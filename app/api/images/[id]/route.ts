import { env as cloudflareEnv } from "cloudflare:workers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type AppEnv = {
  GARMENTS: R2Bucket;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const env = cloudflareEnv as unknown as AppEnv;
  const object = await env.GARMENTS.get(id);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
