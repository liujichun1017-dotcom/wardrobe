import { createClient } from "@supabase/supabase-js";

// remove.bg 的 API Key 只在服务端读取（不带 NEXT_PUBLIC_ 前缀，不会打进客户端 bundle）。
// 客户端不直接调 remove.bg，而是经此 route 代理，避免 key 暴露。
// 登录校验：客户端在 Authorization 头带 Supabase access_token，route 用它验证身份，
// 挡住匿名调用白嫖额度。supabase-js 默认把 session 存 localStorage 而非 cookie，
// 所以这里用 Bearer token 而不是读 cookie。

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response("服务配置不完整", { status: 500 });
  }

  // 1) 校验登录
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return new Response("Unauthorized", { status: 401 });
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return new Response("Unauthorized", { status: 401 });

  // 2) 校验请求体
  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return new Response("缺少图片", { status: 400 });
  if (!file.type.startsWith("image/")) return new Response("仅限图片", { status: 400 });
  if (file.size > MAX_BYTES) return new Response("图片过大", { status: 413 });

  // 3) 调 remove.bg（key 只在此处出现，不下发前端）
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) return new Response("抠图服务未配置", { status: 500 });

  const bgForm = new FormData();
  bgForm.append("image_file", file, file.name);
  bgForm.append("size", "auto");

  let upstream: Response;
  try {
    upstream = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: bgForm,
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return new Response("抠图服务暂不可用", { status: 503 });
  }
  if (!upstream.ok) return new Response("抠图失败", { status: 502 });

  // 4) 透传透明 PNG 给客户端
  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store",
    },
  });
}
