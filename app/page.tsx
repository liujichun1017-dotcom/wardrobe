"use client";

/* User uploads and local blob previews intentionally use native img elements. */
/* eslint-disable @next/next/no-img-element */

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import AuthGate from "@/app/AuthGate";
import AddToHomeScreen from "@/app/AddToHomeScreen";

type Tab = "today" | "closet" | "looks" | "ootd" | "consider";
type EntryKind = "garment" | "outfit" | "wish";
type ArchiveView = "outfits" | "garments";

type Entry = {
  id: string;
  kind: EntryKind;
  name: string;
  category: string;
  color: string;
  season: string;
  wornCount: number;
  lastWornAt: string | null;
  imageKey: string | null;
  imageUrl: string | null;
  notes: string;
  extra: Record<string, string | number | boolean | string[]>;
  createdAt: string;
  isDemo?: boolean;
};

type EntryRow = {
  id: string;
  kind: EntryKind;
  name: string;
  category: string;
  color: string;
  season: string;
  worn_count: number;
  last_worn_at: string | null;
  image_key: string | null;
  notes: string;
  extra: Record<string, unknown> | null;
  created_at: string;
};

function publicImageUrl(key: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
}

function rowToEntry(row: EntryRow): Entry {
  const extra = (row.extra || {}) as Record<string, string | number | boolean | string[]>;
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    category: row.category,
    color: row.color,
    season: row.season,
    wornCount: row.worn_count,
    lastWornAt: row.last_worn_at,
    imageKey: row.image_key,
    imageUrl: row.image_key ? publicImageUrl(row.image_key) : null,
    notes: row.notes,
    extra,
    createdAt: row.created_at,
  };
}

const DEMO_ITEMS: Entry[] = [
  {
    id: "demo-shirt",
    kind: "garment",
    name: "燕麦色亚麻衬衫",
    category: "衬衫",
    color: "燕麦",
    season: "春夏",
    wornCount: 12,
    lastWornAt: "2026-07-18",
    imageKey: null,
    imageUrl: null,
    notes: "",
    extra: { shape: "shirt", tone: "#d8c6aa" },
    createdAt: "2026-03-02",
    isDemo: true,
  },
  {
    id: "demo-tee",
    kind: "garment",
    name: "海盐白 T 恤",
    category: "T恤",
    color: "白色",
    season: "四季",
    wornCount: 23,
    lastWornAt: "2026-07-21",
    imageKey: null,
    imageUrl: null,
    notes: "",
    extra: { shape: "tee", tone: "#f4f0e8" },
    createdAt: "2026-02-11",
    isDemo: true,
  },
  {
    id: "demo-trousers",
    kind: "garment",
    name: "雾蓝阔腿裤",
    category: "长裤",
    color: "雾蓝",
    season: "春秋",
    wornCount: 8,
    lastWornAt: "2026-06-03",
    imageKey: null,
    imageUrl: null,
    notes: "",
    extra: { shape: "pants", tone: "#8097a6" },
    createdAt: "2025-10-13",
    isDemo: true,
  },
  {
    id: "demo-bag",
    kind: "garment",
    name: "黑色半月包",
    category: "包袋",
    color: "黑色",
    season: "四季",
    wornCount: 31,
    lastWornAt: "2026-07-20",
    imageKey: null,
    imageUrl: null,
    notes: "",
    extra: { shape: "bag", tone: "#34322f" },
    createdAt: "2025-09-20",
    isDemo: true,
  },
  {
    id: "demo-swim",
    kind: "garment",
    name: "深海蓝连体泳衣",
    category: "泳装",
    color: "深蓝",
    season: "夏季",
    wornCount: 3,
    lastWornAt: "2026-05-08",
    imageKey: null,
    imageUrl: null,
    notes: "",
    extra: { shape: "swim", tone: "#254a5f" },
    createdAt: "2025-07-01",
    isDemo: true,
  },
  {
    id: "demo-cap",
    kind: "garment",
    name: "柠檬黄泳帽",
    category: "泳帽",
    color: "黄色",
    season: "夏季",
    wornCount: 3,
    lastWornAt: "2026-05-08",
    imageKey: null,
    imageUrl: null,
    notes: "",
    extra: { shape: "cap", tone: "#e5c958" },
    createdAt: "2025-07-01",
    isDemo: true,
  },
];

const DEMO_OUTFITS: Entry[] = [
  {
    id: "demo-look-01",
    kind: "outfit",
    name: "黑色体积 / 通勤",
    category: "通勤",
    color: "黑 / 白",
    season: "四季",
    wornCount: 1,
    lastWornAt: "2026-07-19",
    imageKey: null,
    imageUrl: null,
    notes: "",
    extra: { demoOffset: 0 },
    createdAt: "2026-07-19T09:20:00.000Z",
    isDemo: true,
  },
  {
    id: "demo-look-02",
    kind: "outfit",
    name: "白衬衫的错误比例",
    category: "日常",
    color: "白 / 雾蓝",
    season: "春夏",
    wornCount: 1,
    lastWornAt: "2026-06-28",
    imageKey: null,
    imageUrl: null,
    notes: "",
    extra: { demoOffset: 1 },
    createdAt: "2026-06-28T14:10:00.000Z",
    isDemo: true,
  },
  {
    id: "demo-look-03",
    kind: "outfit",
    name: "泳池之后",
    category: "旅行",
    color: "深蓝 / 黄色",
    season: "夏季",
    wornCount: 1,
    lastWornAt: "2026-05-08",
    imageKey: null,
    imageUrl: null,
    notes: "",
    extra: { demoOffset: 4 },
    createdAt: "2026-05-08T17:40:00.000Z",
    isDemo: true,
  },
];

const CATEGORY_OPTIONS = [
  "T恤",
  "衬衫",
  "针织",
  "外套",
  "裙装",
  "长裤",
  "短裤",
  "鞋履",
  "包袋",
  "配饰",
  "帽子",
  "围巾",
  "腰带",
  "首饰",
  "内衣 / 家居",
  "泳装",
  "泳帽",
  "其他",
];

const REMOVAL_REASONS = [
  { id: "sold", label: "已售出", note: "卖掉了，保留过往穿着记录" },
  { id: "gifted", label: "送人了", note: "离开衣橱，但仍属于你的风格档案" },
  { id: "donated", label: "已捐赠", note: "记录去向，不再参与搭配与数量统计" },
  { id: "retired", label: "其他原因", note: "损坏、淘汰或暂时不再拥有" },
];

type GarmentRole = "top" | "bottom" | "layer" | "onepiece" | "shoe" | "accessory" | "swim" | "other";

const LOOK_SUGGESTION_NAMES = ["黑白层次", "体积错位", "克制留白"];

function garmentRole(category: string): GarmentRole {
  if (["T恤", "衬衫", "针织"].includes(category)) return "top";
  if (["长裤", "短裤"].includes(category)) return "bottom";
  if (category === "外套") return "layer";
  if (category === "裙装") return "onepiece";
  if (category === "鞋履") return "shoe";
  if (["包袋", "配饰", "帽子", "围巾", "腰带", "首饰"].includes(category)) return "accessory";
  if (["泳装", "泳帽"].includes(category)) return "swim";
  return "other";
}

function buildLookSuggestions(seed: Entry, wardrobe: Entry[]): Entry[][] {
  const active = wardrobe.filter(
    (item, index, list) =>
      item.kind === "garment" &&
      item.extra.status !== "removed" &&
      list.findIndex((candidate) => candidate.id === item.id) === index,
  );
  const seedRole = garmentRole(seed.category);
  const templates: Record<GarmentRole, GarmentRole[]> = {
    top: ["layer", "top", "bottom", "shoe", "accessory"],
    bottom: ["layer", "top", "bottom", "shoe", "accessory"],
    layer: ["layer", "top", "bottom", "shoe", "accessory"],
    onepiece: ["layer", "onepiece", "shoe", "accessory"],
    shoe: ["layer", "top", "bottom", "shoe", "accessory"],
    accessory: ["layer", "top", "bottom", "shoe", "accessory"],
    swim: ["swim", "accessory", "shoe"],
    other: ["layer", "top", "bottom", "other", "shoe", "accessory"],
  };

  const suggestions: Entry[][] = [];
  for (let variant = 0; variant < 3; variant += 1) {
    const used = new Set<string>();
    const suggestion: Entry[] = [];
    for (const role of templates[seedRole]) {
      let chosen: Entry | undefined;
      if (role === seedRole && !used.has(seed.id)) {
        chosen = seed;
      } else {
        const candidates = active
          .filter((item) => !used.has(item.id) && garmentRole(item.category) === role)
          .sort((a, b) => {
            const seasonA = a.season === seed.season || a.season === "四季" ? 1 : 0;
            const seasonB = b.season === seed.season || b.season === "四季" ? 1 : 0;
            return seasonB - seasonA || a.wornCount - b.wornCount || a.name.localeCompare(b.name, "zh-CN");
          });
        chosen = candidates.length ? candidates[variant % candidates.length] : undefined;
      }
      if (chosen) {
        used.add(chosen.id);
        suggestion.push(chosen);
      }
    }
    if (!used.has(seed.id)) suggestion.unshift(seed);
    const key = suggestion.map((item) => item.id).join("|");
    if (suggestion.length && !suggestions.some((look) => look.map((item) => item.id).join("|") === key)) {
      suggestions.push(suggestion);
    }
  }
  return suggestions;
}

function removalReasonLabel(reason: unknown) {
  return REMOVAL_REASONS.find((item) => item.id === reason)?.label || "已出库";
}

const NAV_ITEMS: Array<{ id: Tab; label: string; short: string }> = [
  { id: "today", label: "今天", short: "今" },
  { id: "closet", label: "清单", short: "衣" },
  { id: "looks", label: "搭配", short: "搭" },
  { id: "ootd", label: "档案馆", short: "档" },
  { id: "consider", label: "购前想想", short: "想" },
];

function daysSince(date: string | null) {
  if (!date) return 999;
  const diff = Date.now() - new Date(`${date}T12:00:00`).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function localDateKey(date = new Date()) {
  const localTime = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(localTime).toISOString().slice(0, 10);
}

function unwornLabel(date: string | null) {
  return date ? `${daysSince(date)} 天未穿` : "从未穿过";
}

function GarmentVisual({
  item,
  className = "",
}: {
  item: Entry;
  className?: string;
}) {
  if (item.imageUrl) {
    return (
      <div className={`garment-visual has-photo ${className}`}>
        {/* User-owned uploads are served directly from this app. */}
        <img src={item.imageUrl} alt={item.name} />
      </div>
    );
  }

  const shape = String(item.extra.shape || "tee");
  const tone = String(item.extra.tone || "#d4c8b9");
  return (
    <div className={`garment-visual ${className}`} aria-label={item.name}>
      <div className={`garment-shape shape-${shape}`} style={{ background: tone }} />
    </div>
  );
}

function OutfitArchiveVisual({
  outfit,
  garments,
}: {
  outfit: Entry;
  garments: Entry[];
}) {
  if (outfit.imageUrl) {
    return <GarmentVisual item={outfit} className="archive-uploaded-look" />;
  }

  // 造型方案：读 extra.garmentIds 找到关联衣物
  const garmentIds = Array.isArray(outfit.extra.garmentIds)
    ? (outfit.extra.garmentIds as string[])
    : [];
  const linkedGarments = garmentIds
    .map((id) => garments.find((g) => g.id === id))
    .filter((g): g is Entry => Boolean(g));

  if (linkedGarments.length > 0) {
    return (
      <div className="archive-look-visual look-linked" aria-label={outfit.name}>
        {linkedGarments.slice(0, 4).map((item, index) => (
          <GarmentVisual key={`${outfit.id}-${item.id}`} item={item} className={`archive-layer layer-${index + 1}`} />
        ))}
      </div>
    );
  }

  // demo 数据：用 offset 假拼贴
  const offset = Number(outfit.extra.demoOffset || 0);
  const pieces = Array.from({ length: Math.min(3, garments.length) }, (_, index) => {
    return garments[(offset + index) % garments.length];
  });

  return (
    <div className="archive-look-visual" aria-label={outfit.name}>
      <span className="archive-crosshair">＋</span>
      {pieces.map((item, index) => (
        <GarmentVisual key={`${outfit.id}-${item.id}`} item={item} className={`archive-layer layer-${index + 1}`} />
      ))}
    </div>
  );
}

function Nav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <>
      <nav className="desktop-nav" aria-label="主要功能">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={active === item.id ? "active" : ""}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <nav className="mobile-nav" aria-label="主要功能">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={active === item.id ? "active" : ""}
            onClick={() => onChange(item.id)}
          >
            <span>{item.short}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}

function LookPicker({
  garments,
  selectedIds,
  onToggle,
  onClose,
  filter,
  setFilter,
}: {
  garments: Entry[];
  selectedIds: string[];
  onToggle: (item: Entry) => void;
  onClose: () => void;
  filter: string;
  setFilter: (f: string) => void;
}) {
  const pickerCats = ["全部", ...Array.from(new Set(garments.map((g) => g.category)))];
  const list = garments.filter(
    (g) => filter === "全部" || g.category === filter,
  );
  return (
    <div className="look-picker-backdrop" onClick={onClose}>
      <div className="look-picker" onClick={(e) => e.stopPropagation()}>
        <div className="look-picker-head">
          <strong>选择单品</strong>
          <button onClick={onClose}>完成</button>
        </div>
        <div className="look-picker-filter filter-chips">
          {pickerCats.map((cat) => (
            <button
              key={cat}
              className={filter === cat ? "active" : ""}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="look-picker-grid">
          {list.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                className={`look-picker-item ${selected ? "selected" : ""}`}
                onClick={() => onToggle(item)}
              >
                <GarmentVisual item={item} />
                <span>{item.name}</span>
                {selected && <i className="check">✓</i>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 缩放到最长边 1400，输出 webp（不抠背景时用）
function scaleToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const src = URL.createObjectURL(file);
    image.onload = () => {
      const maxSide = 1400;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(src);
        reject(new Error("无法读取图片"));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(src);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("图片处理失败"));
        },
        "image/webp",
        0.9,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("图片读取失败"));
    };
    image.src = src;
  });
}

// 调服务端代理 /api/remove-bg 拿透明 PNG（API key 只在服务端持有）
async function removeBackgroundViaApi(image: Blob): Promise<Blob> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("bg-failed");
  const fd = new FormData();
  fd.append("image", image);
  const res = await fetch("/api/remove-bg", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) throw new Error("bg-failed");
  return await res.blob();
}

// 把透明 PNG 合成到纯白底，输出 jpg
function compositeOnWhite(transparent: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(transparent);
    const image = new Image();
    image.onload = () => {
      const maxSide = 1400;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(src);
        reject(new Error("图片处理失败"));
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(src);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("图片处理失败"));
        },
        "image/jpeg",
        0.92,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("图片处理失败"));
    };
    image.src = src;
  });
}

type ProcessedImage = {
  blob: Blob;
  cleaned: boolean;
  extension: "jpg" | "webp";
  notice?: string;
};

async function normalizeImage(file: File, removeBackground: boolean): Promise<ProcessedImage> {
  const scaled = await scaleToBlob(file);
  if (!removeBackground) {
    return { blob: scaled, cleaned: false, extension: "webp" };
  }
  try {
    const transparent = await removeBackgroundViaApi(scaled);
    const whiteBackground = await compositeOnWhite(transparent);
    return { blob: whiteBackground, cleaned: true, extension: "jpg" };
  } catch {
    return {
      blob: scaled,
      cleaned: false,
      extension: "webp",
      notice: "衣物已保存，但白底服务暂时不可用，所以保留了原图。",
    };
  }
}

function UploadModal({
  mode,
  items,
  onClose,
  onSaved,
}: {
  mode: EntryKind;
  items: Entry[];
  onClose: () => void;
  onSaved: (entry: Entry, notice?: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [cleanBackground, setCleanBackground] = useState(mode !== "outfit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(mode === "outfit" ? "日常搭配" : "T恤");
  const [color, setColor] = useState("");
  const [season, setSeason] = useState("四季");
  const [price, setPrice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const similar = useMemo(() => {
    if (mode !== "wish") return [];
    return items.filter(
      (item) =>
        item.kind === "garment" &&
        (item.category === category ||
          (color && item.color.toLowerCase().includes(color.toLowerCase()))),
    );
  }, [items, category, color, mode]);

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setError("请选择图片文件");
      event.target.value = "";
      return;
    }
    if (next.size > 25 * 1024 * 1024) {
      setError("图片请控制在 25MB 以内");
      event.target.value = "";
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setError("");
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("先给它一个容易认出的名字吧");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("未登录");

      // 先压缩并尝试白底处理；白底服务不可用时保留原图，不阻断录入。
      let processedImage: ProcessedImage | null = null;
      let ext = "webp";
      if (file) {
        processedImage = await normalizeImage(file, cleanBackground);
        ext = processedImage.extension;
      }

      const extra = {
        price,
        cleaned: processedImage?.cleaned ?? false,
        outfitType: mode === "outfit" ? "ootd" : "",
        recommendation:
          mode === "wish"
            ? similar.length >= 3
              ? "同类偏多，建议先用已有单品搭 3 套"
              : similar.length > 0
                ? `已有 ${similar.length} 件相近单品，先比较版型与场景`
                : "衣橱里暂时没有明显重复，可以继续考虑"
            : "",
      };

      const { data: inserted, error: insertError } = await supabase
        .from("entries")
        .insert({
          user_id: userId,
          kind: mode,
          name: name.trim(),
          category,
          color: color.trim(),
          season,
          notes: "",
          extra,
          last_worn_at: mode === "outfit" ? localDateKey() : null,
        })
        .select()
        .single();
      if (insertError || !inserted) throw new Error("保存失败");

      if (processedImage) {
        const imageKey = `${userId}/${inserted.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(imageKey, processedImage.blob, {
            contentType: processedImage.blob.type,
            upsert: true,
          });
        if (upErr) {
          await supabase.from("entries").delete().eq("id", inserted.id);
          throw new Error("图片上传失败");
        }
        const { data: updated, error: updErr } = await supabase
          .from("entries")
          .update({ image_key: imageKey })
          .eq("id", inserted.id)
          .select()
          .single();
        if (updErr || !updated) {
          await supabase.storage.from(STORAGE_BUCKET).remove([imageKey]);
          await supabase.from("entries").delete().eq("id", inserted.id);
          throw new Error("保存失败");
        }
        onSaved(rowToEntry(updated), processedImage.notice);
      } else {
        onSaved(rowToEntry(inserted));
      }
    } catch {
      setError("暂时没有保存成功，请稍后再试");
    } finally {
      setSaving(false);
    }
  }

  const title =
    mode === "garment" ? "收进衣橱" : mode === "outfit" ? "记录今天的 OOTD" : "购前想一想";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">
              {mode === "wish" ? "BUY LESS, LOVE MORE" : "ADD TO YOUR STORY"}
            </p>
            <h2 id="upload-title">{title}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          <button
            type="button"
            className={`photo-drop ${preview ? "with-preview" : ""}`}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="待上传预览" />
            ) : (
              <>
                <span className="camera-mark">＋</span>
                <strong>{mode === "outfit" ? "拍下今天这一身" : "拍照或从相册选择"}</strong>
                <small>建议用纯色背景、自然光，后续处理会更干净</small>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={pickFile}
          />

          {mode !== "outfit" && (
            <label className="clean-toggle">
              <span>
                <strong>白底处理</strong>
                <small>自动抠出衣服并铺纯白底（联网处理，需登录）</small>
              </span>
              <input
                type="checkbox"
                checked={cleanBackground}
                onChange={(event) => setCleanBackground(event.target.checked)}
              />
              <i />
            </label>
          )}

          <div className="form-grid">
            <label className="field full">
              <span>{mode === "outfit" ? "给这套搭配起个名字" : "名称"}</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={mode === "outfit" ? "例如：周四的轻松通勤" : "例如：米白色亚麻衬衫"}
              />
            </label>
            <label className="field">
              <span>{mode === "outfit" ? "场景" : "品类"}</span>
              {mode === "outfit" ? (
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option>日常搭配</option>
                  <option>通勤</option>
                  <option>约会</option>
                  <option>旅行</option>
                  <option>运动</option>
                </select>
              ) : (
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              )}
            </label>
            <label className="field">
              <span>颜色</span>
              <input
                value={color}
                onChange={(event) => setColor(event.target.value)}
                placeholder="例如：海盐白"
              />
            </label>
            {mode === "wish" ? (
              <label className="field full">
                <span>价格（选填）</span>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  inputMode="decimal"
                  placeholder="¥"
                />
              </label>
            ) : (
              <label className="field full">
                <span>适合季节</span>
                <select value={season} onChange={(event) => setSeason(event.target.value)}>
                  <option>四季</option>
                  <option>春夏</option>
                  <option>秋冬</option>
                  <option>夏季</option>
                  <option>冬季</option>
                </select>
              </label>
            )}
          </div>

          {mode === "wish" && category && (
            <div className={`similar-note ${similar.length >= 3 ? "warning" : ""}`}>
              <span>{similar.length}</span>
              <p>
                {similar.length === 0
                  ? `当前衣橱里没有同类的「${category}」`
                  : `衣橱里已有 ${similar.length} 件同类或相近单品`}
              </p>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          <button className="primary-button wide" type="submit" disabled={saving}>
            {saving ? "正在整理…" : mode === "wish" ? "生成购买建议" : "保存"}
          </button>
        </form>
      </section>
    </div>
  );
}

function ProfileModal({
  displayName,
  onClose,
}: {
  displayName: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
  }
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="close-button" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <div className="profile-orbit">{displayName.slice(0, 1) || "衣"}</div>
        <p className="eyebrow">SIGNED IN</p>
        <h2>你好，{displayName}</h2>
        <p>你的衣物清单按账号隔离保存，换设备登录后可以继续同步。</p>
        <button className="primary-button wide" onClick={signOut} disabled={busy}>
          {busy ? "处理中…" : "退出登录"}
        </button>
        <small>这是个人衣橱版本；开放给更多人之前，建议再升级照片的私有访问方式。</small>
      </section>
    </div>
  );
}

function RemoveGarmentModal({
  item,
  onClose,
  onUpdated,
  onDeleted,
}: {
  item: Entry;
  onClose: () => void;
  onUpdated: (entry: Entry) => void;
  onDeleted: (id: string) => void;
}) {
  const [reason, setReason] = useState("sold");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function retireGarment() {
    setBusy(true);
    setError("");
    try {
      const extra = {
        ...(item.extra || {}),
        status: "removed",
        removalReason: reason,
        removedAt: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("entries")
        .update({ extra })
        .eq("id", item.id)
        .select()
        .single();
      if (error || !data) throw new Error("Unable to archive garment");
      onUpdated(rowToEntry(data));
    } catch {
      setError("暂时没有出库成功，请稍后再试");
    } finally {
      setBusy(false);
    }
  }

  async function permanentlyDelete() {
    setBusy(true);
    setError("");
    try {
      if (item.imageKey) {
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([item.imageKey]);
        if (storageError) throw new Error("Unable to delete image");
      }
      const { error } = await supabase.from("entries").delete().eq("id", item.id);
      if (error) throw new Error("Unable to delete garment");
      onDeleted(item.id);
    } catch {
      setError("暂时没有删除成功，请稍后再试");
      setBusy(false);
    }
  }

  if (item.kind !== "garment") {
    const label = item.kind === "outfit"
      ? item.extra.outfitType === "look"
        ? "造型方案"
        : "OOTD 记录"
      : "购前清单";
    return (
      <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
        <section
          className="remove-modal delete-entry-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-entry-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="modal-head">
            <div>
              <p className="eyebrow">DELETE FROM ARCHIVE</p>
              <h2 id="delete-entry-title">删除{label}</h2>
            </div>
            <button className="close-button" onClick={onClose} aria-label="关闭">
              ×
            </button>
          </div>
          <div className="remove-garment-preview">
            <GarmentVisual item={item} />
            <div>
              <span>{label} / {item.category}</span>
              <strong>{item.name}</strong>
              <small>这会同时删除照片和资料，删除后无法恢复。</small>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="delete-entry-actions">
            <button onClick={onClose}>先保留</button>
            <button onClick={permanentlyDelete} disabled={busy}>
              {busy ? "正在删除…" : "确认删除"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="remove-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">GARMENT DEPARTURE</p>
            <h2 id="remove-title">衣物出库</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="remove-garment-preview">
          <GarmentVisual item={item} />
          <div>
            <span>{item.category} / {item.color || "未标颜色"}</span>
            <strong>{item.name}</strong>
            <small>出库后不再参与衣橱数量、搭配和闲置提醒。</small>
          </div>
        </div>

        <fieldset className="removal-reasons">
          <legend>为什么离开衣橱？</legend>
          {REMOVAL_REASONS.map((option) => (
            <label key={option.id} className={reason === option.id ? "active" : ""}>
              <input
                type="radio"
                name="removal-reason"
                value={option.id}
                checked={reason === option.id}
                onChange={() => setReason(option.id)}
              />
              <span>{option.label}</span>
              <small>{option.note}</small>
            </label>
          ))}
        </fieldset>

        <div className="retire-explainer">
          <strong>建议选择“确认出库”</strong>
          <p>照片和资料会保留在档案馆的“已出库”陈列里，以前的 OOTD 也不会受影响。</p>
        </div>

        {error && <p className="form-error">{error}</p>}
        <button className="primary-button wide retire-confirm" onClick={retireGarment} disabled={busy}>
          {busy ? "正在处理…" : `确认出库 · ${removalReasonLabel(reason)}`}
        </button>

        {!confirmDelete ? (
          <button className="permanent-delete-link" onClick={() => setConfirmDelete(true)}>
            不保留记录，彻底删除
          </button>
        ) : (
          <div className="permanent-delete-confirm">
            <p>这会永久删除照片和资料，无法恢复。</p>
            <button onClick={() => setConfirmDelete(false)}>返回</button>
            <button onClick={permanentlyDelete} disabled={busy}>
              {busy ? "正在删除…" : "确认彻底删除"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Home({ displayName }: { displayName: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploadMode, setUploadMode] = useState<EntryKind | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [archiveView, setArchiveView] = useState<ArchiveView>("outfits");
  const [archiveCategory, setArchiveCategory] = useState("全部");
  const [removeTarget, setRemoveTarget] = useState<Entry | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [lookDraft, setLookDraft] = useState<Entry[]>([]);
  const [lookName, setLookName] = useState("");
  const [lookScene, setLookScene] = useState("日常搭配");
  const [lookPickerOpen, setLookPickerOpen] = useState(false);
  const [lookPickerFilter, setLookPickerFilter] = useState("全部");
  const [lookSaving, setLookSaving] = useState(false);
  const [lookError, setLookError] = useState("");
  const [lookSaved, setLookSaved] = useState(false);
  const [lookSuggestionSeed, setLookSuggestionSeed] = useState<Entry | null>(null);
  const [lookSuggestions, setLookSuggestions] = useState<Entry[][]>([]);
  const [lookSuggestionIndex, setLookSuggestionIndex] = useState(0);
  const [archiveOutfitView, setArchiveOutfitView] = useState<"looks" | "ootd">("looks");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pageSize = 500;
      const rows: EntryRow[] = [];
      let error: Error | null = null;
      for (let from = 0; from < 10_000; from += pageSize) {
        const result = await supabase
          .from("entries")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);
        if (result.error) {
          error = result.error;
          break;
        }
        const page = (result.data || []) as EntryRow[];
        rows.push(...page);
        if (page.length < pageSize) break;
      }
      if (cancelled) return;
      if (!error) setEntries(rows.map(rowToEntry));
      setLoadError(Boolean(error));
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const allGarments = entries.filter((entry) => entry.kind === "garment");
  const garments = allGarments.filter((entry) => entry.extra.status !== "removed");
  const removedGarments = allGarments.filter((entry) => entry.extra.status === "removed");
  const isDemoCloset = loaded && allGarments.length === 0;
  const visibleGarments = isDemoCloset ? DEMO_ITEMS : garments;
  const outfits = entries.filter((entry) => entry.kind === "outfit");
  const visibleOutfits = loaded && outfits.length === 0 ? DEMO_OUTFITS : outfits;
  // 造型方案 vs OOTD 照片分开
  const savedLooks = outfits.filter((o) => o.extra.outfitType === "look");
  const ootdPhotos = outfits.filter((o) => o.extra.outfitType !== "look");
  const visibleSavedLooks = savedLooks.length ? savedLooks : [];
  const visibleOotdPhotos = ootdPhotos.length ? ootdPhotos : [];
  const wishes = entries.filter((entry) => entry.kind === "wish");
  const longUnworn = visibleGarments
    .filter((item) => daysSince(item.lastWornAt) >= 30)
    .sort((a, b) => daysSince(b.lastWornAt) - daysSince(a.lastWornAt));
  const categories = ["全部", ...Array.from(new Set(visibleGarments.map((item) => item.category)))];
  const closetView = visibleGarments.filter(
    (item) =>
      (categoryFilter === "全部" || item.category === categoryFilter) &&
      (!query || `${item.name}${item.category}${item.color}`.toLowerCase().includes(query.toLowerCase())),
  );
  const archiveSourceGarments = allGarments.length ? allGarments : DEMO_ITEMS;
  const lookGarmentSource = allGarments.length ? allGarments : DEMO_ITEMS;
  const archiveCategories = [
    "全部",
    ...Array.from(new Set(archiveSourceGarments.map((item) => item.category))),
    ...(removedGarments.length ? ["已出库"] : []),
  ];
  const archiveGarments = archiveSourceGarments.filter((garment) => {
    if (archiveCategory === "全部") return true;
    if (archiveCategory === "已出库") return garment.extra.status === "removed";
    return garment.category === archiveCategory;
  });

  function addEntry(entry: Entry, message?: string) {
    setEntries((current) => [entry, ...current]);
    setUploadMode(null);
    if (entry.kind === "garment") {
      const suggestions = buildLookSuggestions(entry, [entry, ...garments]);
      const firstSuggestion = suggestions[0] || [entry];
      setLookSuggestionSeed(entry);
      setLookSuggestions(suggestions.length ? suggestions : [[entry]]);
      setLookSuggestionIndex(0);
      setLookDraft(firstSuggestion);
      setLookName(`${entry.name} / ${LOOK_SUGGESTION_NAMES[0]}`);
      setLookScene("日常搭配");
      setLookError("");
      setActiveTab("looks");
      setNotice(message || "衣物已保存，并为它生成了一套搭配建议。");
      return;
    }
    setNotice(message || "已保存到你的衣橱档案。");
  }

  function updateEntry(entry: Entry) {
    setEntries((current) => current.map((item) => (item.id === entry.id ? entry : item)));
    setRemoveTarget(null);
    setNotice("已完成出库，过往记录仍保留在档案馆。");
  }

  function deleteEntry(id: string) {
    const deleted = entries.find((item) => item.id === id);
    setEntries((current) => current.filter((item) => item.id !== id));
    setRemoveTarget(null);
    setNotice(
      deleted?.kind === "garment"
        ? "衣物和照片已彻底删除。"
        : deleted?.kind === "wish"
          ? "已从购前清单删除。"
          : "造型记录已删除。",
    );
  }

  async function restoreEntry(entry: Entry) {
    const rest = { ...(entry.extra || {}) } as Record<string, unknown>;
    delete rest.status;
    delete rest.removalReason;
    delete rest.removedAt;
    const { data, error } = await supabase
      .from("entries")
      .update({ extra: rest })
      .eq("id", entry.id)
      .select()
      .single();
    if (error) {
      setNotice("重新入库失败，请稍后再试。");
      return;
    }
    const restored = rowToEntry(data);
    setEntries((current) => current.map((item) => (item.id === restored.id ? restored : item)));
    setNotice("已经重新放回衣橱。");
  }

  async function recordWorn(entry: Entry) {
    const today = localDateKey();
    if (entry.lastWornAt === today) return;
    const { data, error } = await supabase
      .from("entries")
      .update({ worn_count: (entry.wornCount || 0) + 1, last_worn_at: today })
      .eq("id", entry.id)
      .select()
      .single();
    if (error) {
      setNotice("穿着记录没有保存成功，请稍后再试。");
      return;
    }
    const updated = rowToEntry(data);
    setEntries((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setNotice(`已记录今天穿了「${entry.name}」。`);
  }

  // 造型方案"标记今天穿了"：给关联的所有衣物 +1 穿着计数，造型本身标记穿过日期
  async function markLookWorn(outfit: Entry) {
    const today = localDateKey();
    if (outfit.lastWornAt === today) return;
    // 找到关联的衣物（含 demo）
    const garmentIds = Array.isArray(outfit.extra.garmentIds)
      ? (outfit.extra.garmentIds as string[])
      : [];
    const allSource = [...allGarments, ...DEMO_ITEMS];
    const linkedGarments = garmentIds
      .map((id) => allSource.find((g) => g.id === id))
      .filter((g): g is Entry => g != null && g.lastWornAt !== today);
    // 逐件 +1（真实衣物写 DB，demo 衣物只更新前端 state）
    let failed = false;
    for (const g of linkedGarments) {
      const isDemo = g.id.startsWith("demo-");
      if (isDemo) {
        // demo 衣物不在数据库，只更新前端
        setEntries((current) =>
          current.map((item) =>
            item.id === g.id
              ? { ...item, wornCount: (item.wornCount || 0) + 1, lastWornAt: today }
              : item,
          ),
        );
      } else {
        const { data, error } = await supabase
          .from("entries")
          .update({ worn_count: (g.wornCount || 0) + 1, last_worn_at: today })
          .eq("id", g.id)
          .select()
          .single();
        if (error) failed = true;
        if (data) {
          const updated = rowToEntry(data);
          setEntries((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        }
      }
    }
    // 造型本身标记穿过
    const { data: outfitData, error: outfitError } = await supabase
      .from("entries")
      .update({ last_worn_at: today })
      .eq("id", outfit.id)
      .select()
      .single();
    if (outfitData) {
      const updated = rowToEntry(outfitData);
      setEntries((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    }
    setNotice(
      failed || outfitError
        ? "部分穿着记录没有同步成功，请稍后再试。"
        : `已记录今天穿了「${outfit.name}」。`,
    );
  }

  // 造型页：切换衣物选中
  function toggleLookItem(item: Entry) {
    setLookDraft((current) => {
      const exists = current.some((g) => g.id === item.id);
      if (exists) return current.filter((g) => g.id !== item.id);
      return [...current, item];
    });
  }

  function showNextLookSuggestion() {
    if (!lookSuggestionSeed || lookSuggestions.length < 2) return;
    const nextIndex = (lookSuggestionIndex + 1) % lookSuggestions.length;
    setLookSuggestionIndex(nextIndex);
    setLookDraft(lookSuggestions[nextIndex]);
    setLookName(
      `${lookSuggestionSeed.name} / ${LOOK_SUGGESTION_NAMES[nextIndex % LOOK_SUGGESTION_NAMES.length]}`,
    );
    setLookError("");
  }

  // 造型页：保存
  async function saveLook() {
    if (!lookName.trim()) {
      setLookError("先给这套搭配起个名字吧");
      return;
    }
    const validDraft = lookDraft.filter((draft) =>
      garments.some((garment) => garment.id === draft.id),
    );
    if (validDraft.length === 0) {
      setLookError("至少选一件衣物");
      return;
    }
    if (validDraft.length !== lookDraft.length) {
      setLookDraft(validDraft);
      setLookError("有单品已经出库，请确认当前搭配后再保存");
      return;
    }
    setLookSaving(true);
    setLookError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("未登录");
      const { data: inserted, error: insertError } = await supabase
        .from("entries")
        .insert({
          user_id: userId,
          kind: "outfit",
          name: lookName.trim(),
          category: lookScene,
          color: "",
          season: "四季",
          notes: "",
          extra: {
            garmentIds: validDraft.map((g) => g.id),
            outfitType: "look",
            price: "",
            cleaned: false,
            recommendation: "",
          },
          last_worn_at: null,
        })
        .select()
        .single();
      if (insertError || !inserted) throw new Error("保存失败");
      addEntry(rowToEntry(inserted));
      setLookDraft([]);
      setLookName("");
      setLookScene("日常搭配");
      setLookSuggestionSeed(null);
      setLookSuggestions([]);
      setLookSuggestionIndex(0);
      setLookSaved(true);
      setTimeout(() => setLookSaved(false), 3000);
    } catch {
      setLookError("保存失败，请稍后再试");
    } finally {
      setLookSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="wordmark" onClick={() => setActiveTab("today")}>
          <span>W</span>
          衣橱档案
        </button>
        <Nav active={activeTab} onChange={setActiveTab} />
        <div className="top-actions">
          <button className="add-top" onClick={() => setUploadMode("garment")}>
            <span>＋</span> 录入单品
          </button>
          <button className="profile-button" onClick={() => setProfileOpen(true)} aria-label="账户">
            {displayName.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <div className="page-wrap">
        {!loaded && <div className="system-banner">正在同步你的衣橱…</div>}
        {loadError && (
          <div className="system-banner error" role="alert">
            衣橱同步失败，当前内容可能不完整。
            <button onClick={() => window.location.reload()}>重新加载</button>
          </div>
        )}
        {activeTab === "today" && (
          <section className="today-page">
            <div className="hero-copy">
              <p className="eyebrow">我的衣橱</p>
              <h1>
                今天，穿得
                <em>不那么正确。</em>
              </h1>
              {isDemoCloset && (
                <button className="demo-badge" onClick={() => setUploadMode("garment")}>
                  现在展示的是示例衣橱 · 添加我的第一件
                </button>
              )}
            </div>

            <div className="summary-strip">
              <div>
                <strong>{visibleGarments.length}</strong>
                <span>件衣物</span>
              </div>
              <i />
              <div>
                <strong>{new Set(visibleGarments.map((item) => item.category)).size}</strong>
                <span>个品类</span>
              </div>
              <i />
              <div>
                <strong>{outfits.length}</strong>
                <span>条造型档案</span>
              </div>
            </div>

            <div className="today-grid">
              <article className="outfit-feature">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">LOOK CONSTRUCTION</p>
                    <h2>今日造型实验</h2>
                  </div>
                  <button onClick={() => setActiveTab("looks")}>去搭配</button>
                </div>
                <div className="look-canvas">
                  <div className="look-note">
                    <p>从衣橱里挑几件，搭一套今天的造型。</p>
                  </div>
                  {visibleGarments.slice(0, 4).map((item, index) => (
                    <GarmentVisual key={item.id} item={item} className={`look-item look-item-${index + 1}`} />
                  ))}
                </div>
                <div className="look-footer">
                  <span>用你衣橱里的 {Math.min(4, visibleGarments.length)} 件单品</span>
                  <button onClick={() => setActiveTab("looks")}>开始搭配</button>
                </div>
              </article>

              <aside className="side-stack">
                <article className="idle-card">
                  <div className="idle-top">
                    <span className="pulse-dot" />
                    <p>UNWORN / 30+</p>
                    <strong>{longUnworn.length}</strong>
                  </div>
                  <h3>被遗忘的单品，也是一份造型材料。</h3>
                  <div className="idle-items">
                    {longUnworn.slice(0, 3).map((item) => (
                      <div key={item.id}>
                        <GarmentVisual item={item} />
                        <span>{unwornLabel(item.lastWornAt)}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab("closet")}>
                    看看是重新搭，还是告别 <span>→</span>
                  </button>
                </article>

                <article className="buy-card">
                  <p className="eyebrow">OBJECT UNDER REVIEW</p>
                  <h3>不是每一件欲望，都需要拥有。</h3>
                  <p>上传心仪单品，看看是否已有相近款、同类是否过量。</p>
                  <button onClick={() => setUploadMode("wish")}>
                    <span>＋</span> 上传想买的衣服
                  </button>
                </article>
              </aside>
            </div>

            <section className="archive-portal">
              <div className="archive-portal-copy">
                <p className="eyebrow">WORN / COLLECTED / REMEMBERED</p>
                <span className="archive-portal-number">A—01</span>
                <h2>过去穿过的，<br />才是你的风格档案。</h2>
                <p>回看历次 OOTD，或像看展览一样浏览每一件衣服。</p>
                <button
                  onClick={() => {
                    setArchiveView("outfits");
                    setActiveTab("ootd");
                  }}
                >
                  进入档案馆 <span>→</span>
                </button>
              </div>
              <div className="archive-portal-looks">
                {visibleOutfits.slice(0, 2).map((outfit, index) => (
                  <button
                    key={outfit.id}
                    onClick={() => {
                      setArchiveView("outfits");
                      setActiveTab("ootd");
                    }}
                  >
                    <OutfitArchiveVisual outfit={outfit} garments={lookGarmentSource} />
                    <span>LOOK / {String(index + 1).padStart(2, "0")}</span>
                    <strong>{outfit.name}</strong>
                  </button>
                ))}
              </div>
            </section>

            <section className="recent-section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">GARMENT INDEX</p>
                  <h2>最近归档</h2>
                </div>
                <button onClick={() => setActiveTab("closet")}>查看全部</button>
              </div>
              <div className="piece-row">
                {visibleGarments.slice(0, 6).map((item) => (
                  <button key={item.id} className="piece-card" onClick={() => setActiveTab("closet")}>
                    <GarmentVisual item={item} />
                    <strong>{item.name}</strong>
                    <span>
                      {item.category} · {item.color}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </section>
        )}

        {activeTab === "closet" && (
          <section className="closet-page inner-page">
            <div className="page-title-row">
              <div>
                <p className="eyebrow">GARMENT ARCHIVE / ALL</p>
                <h1>衣物档案</h1>
                <p>{visibleGarments.length} 件单品，清清楚楚。</p>
              </div>
              <button className="primary-button" onClick={() => setUploadMode("garment")}>
                ＋ 添加衣物
              </button>
            </div>
            <div className="closet-tools">
              <label className="search-box">
                <span>⌕</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜名称、品类或颜色"
                />
              </label>
              <div className="filter-chips">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={categoryFilter === category ? "active" : ""}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            {isDemoCloset && (
              <div className="sample-notice">这是示例衣橱。添加第一件后，就会切换成你的真实衣橱。</div>
            )}
            <div className="closet-grid">
              {closetView.map((item) => (
                <article className="closet-card" key={item.id}>
                  <div className="closet-image">
                    <GarmentVisual item={item} />
                    {item.isDemo && <span className="sample-chip">示例</span>}
                    {daysSince(item.lastWornAt) >= 30 && (
                      <span className="idle-chip">{unwornLabel(item.lastWornAt)}</span>
                    )}
                  </div>
                  <div className="closet-meta">
                    <strong>{item.name}</strong>
                    <span>
                      {item.category} · {item.color || "未标颜色"}
                    </span>
                    <small>穿过 {item.wornCount} 次</small>
                    {!item.isDemo && (
                      <div className="garment-actions">
                        <button
                          className="garment-worn-button"
                          onClick={() => recordWorn(item)}
                          disabled={item.lastWornAt === localDateKey()}
                        >
                          {item.lastWornAt === localDateKey() ? "今天已记" : "今天穿了"}
                        </button>
                        <button className="garment-departure-button" onClick={() => setRemoveTarget(item)}>
                          出库 / 已售
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "looks" && (
          <section className="looks-page inner-page">
            <div className="page-title-row">
              <div>
                <p className="eyebrow">DECONSTRUCT / RECONSTRUCT</p>
                <h1>造型实验室</h1>
                <p>从衣橱选单品，拼一套搭配，保存起来。</p>
              </div>
            </div>

            {lookSuggestionSeed && (
              <div className="look-suggestion-banner" role="status">
                <div>
                  <p className="eyebrow">NEW GARMENT / LOOK SUGGESTION</p>
                  <strong>围绕「{lookSuggestionSeed.name}」拼好了搭配草案</strong>
                  <span>
                    使用的都是你真实录入、仍在衣橱里的单品。可以继续增删，再保存为造型方案。
                  </span>
                </div>
                {lookSuggestions.length > 1 && (
                  <button onClick={showNextLookSuggestion}>
                    换一套 · {lookSuggestionIndex + 1}/{lookSuggestions.length}
                  </button>
                )}
              </div>
            )}

            <div className="look-builder">
              <label className="field">
                <span>搭配名称</span>
                <input
                  value={lookName}
                  onChange={(e) => setLookName(e.target.value)}
                  placeholder="例如：周四的轻松通勤"
                />
              </label>
              <label className="field">
                <span>场景</span>
                <select value={lookScene} onChange={(e) => setLookScene(e.target.value)}>
                  <option>日常搭配</option>
                  <option>通勤</option>
                  <option>约会</option>
                  <option>旅行</option>
                  <option>运动</option>
                </select>
              </label>
            </div>

            <div className="look-canvas-new">
              {lookDraft.length === 0 ? (
                <div className="look-empty">
                  {garments.length
                    ? "点下方按钮，从衣橱添加单品"
                    : "先录入自己的衣物，再开始搭配。示例衣物不会被保存进你的造型。"}
                </div>
              ) : (
                <div className="look-pieces">
                  {lookDraft.map((item) => (
                    <div className="look-piece" key={item.id}>
                      <button
                        className="look-piece-remove"
                        onClick={() => toggleLookItem(item)}
                        aria-label="移除"
                      >
                        ×
                      </button>
                      <GarmentVisual item={item} />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="look-actions">
              <button
                className="look-add-btn"
                onClick={() => garments.length ? setLookPickerOpen(true) : setUploadMode("garment")}
              >
                <span>＋</span> {garments.length ? "添加单品" : "先添加衣物"}
              </button>
              <button
                className="primary-button"
                onClick={saveLook}
                disabled={lookSaving}
              >
                {lookSaving ? "保存中…" : "保存这套搭配"}
              </button>
            </div>
            {lookError && <p className="look-error">{lookError}</p>}
            {lookSaved && (
              <p className="look-saved">✓ 已保存！去「档案馆」的「造型方案」里能看到</p>
            )}

            {lookPickerOpen && (
              <LookPicker
                garments={garments}
                selectedIds={lookDraft.map((g) => g.id)}
                onToggle={toggleLookItem}
                onClose={() => setLookPickerOpen(false)}
                filter={lookPickerFilter}
                setFilter={setLookPickerFilter}
              />
            )}
          </section>
        )}

        {activeTab === "ootd" && (
          <section className="archive-page inner-page">
            <div className="archive-title">
              <div>
                <p className="eyebrow">PERSONAL STYLE ARCHIVE / 2026</p>
                <h1>档案馆</h1>
                <p>这里保存过去穿过的 OOTD，也陈列你拥有的每一件衣服。</p>
              </div>
              <button className="primary-button" onClick={() => setUploadMode("outfit")}>
                ＋ 记录今天的 OOTD
              </button>
            </div>

            <div className="archive-switch" role="tablist" aria-label="档案类型">
              <button
                role="tab"
                aria-selected={archiveView === "outfits"}
                className={archiveView === "outfits" ? "active" : ""}
                onClick={() => setArchiveView("outfits")}
              >
                <span>01</span>
                历年 OOTD
                <strong>{outfits.length}</strong>
              </button>
              <button
                role="tab"
                aria-selected={archiveView === "garments"}
                className={archiveView === "garments" ? "active" : ""}
                onClick={() => setArchiveView("garments")}
              >
                <span>02</span>
                衣物陈列
                <strong>{archiveSourceGarments.length}</strong>
              </button>
            </div>

            {archiveView === "outfits" ? (
              <>
                <div className="archive-outfit-tabs">
                  <button
                    className={archiveOutfitView === "looks" ? "active" : ""}
                    onClick={() => setArchiveOutfitView("looks")}
                  >
                    造型方案 ({savedLooks.length})
                  </button>
                  <button
                    className={archiveOutfitView === "ootd" ? "active" : ""}
                    onClick={() => setArchiveOutfitView("ootd")}
                  >
                    OOTD 照片 ({ootdPhotos.length})
                  </button>
                </div>

                {archiveOutfitView === "looks" ? (
                  <div className="archive-year-block">
                    <div className="archive-year">
                      <span>造</span>
                      <strong>型</strong>
                      <small>LOOK<br />PLANS</small>
                    </div>
                    <div className="archive-look-grid">
                      {visibleSavedLooks.length === 0 && loaded && (
                        <div className="archive-sample-note">
                          还没有保存的造型方案。去「造型」页拼一套吧。
                        </div>
                      )}
                      {visibleSavedLooks.map((outfit, index) => (
                        <article key={outfit.id} className="archive-look-card">
                          <button
                            className="archive-card-delete"
                            onClick={() => setRemoveTarget(outfit)}
                            aria-label={`删除造型方案：${outfit.name}`}
                          >
                            ×
                          </button>
                          <div className="archive-look-index">
                            <span>LOOK</span>
                            <strong>{String(index + 1).padStart(2, "0")}</strong>
                          </div>
                          <OutfitArchiveVisual outfit={outfit} garments={lookGarmentSource} />
                          <div className="archive-look-meta">
                            <time dateTime={outfit.createdAt}>
                              {new Date(outfit.createdAt).toLocaleDateString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                              })}
                            </time>
                            <div>
                              <strong>{outfit.name}</strong>
                              <span>{outfit.category}</span>
                            </div>
                          </div>
                          <button
                            className={`look-worn-btn ${outfit.lastWornAt === localDateKey() ? "done" : ""}`}
                            onClick={() => markLookWorn(outfit)}
                            disabled={outfit.lastWornAt === localDateKey()}
                          >
                            {outfit.lastWornAt === localDateKey() ? "✓ 今天已穿" : "今天穿了"}
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="archive-year-block">
                    <div className="archive-year">
                      <span>20</span>
                      <strong>26</strong>
                      <small>WORN<br />ARCHIVE</small>
                    </div>
                    <div className="archive-look-grid">
                      {visibleOotdPhotos.length === 0 && loaded && (
                        <div className="archive-sample-note">
                          还没有 OOTD 照片。点下方记录今天的穿搭。
                        </div>
                      )}
                      {visibleOotdPhotos.map((outfit, index) => (
                        <article key={outfit.id} className="archive-look-card">
                          <button
                            className="archive-card-delete"
                            onClick={() => setRemoveTarget(outfit)}
                            aria-label={`删除 OOTD：${outfit.name}`}
                          >
                            ×
                          </button>
                          <div className="archive-look-index">
                            <span>OOTD</span>
                            <strong>{String(index + 1).padStart(2, "0")}</strong>
                          </div>
                          <OutfitArchiveVisual outfit={outfit} garments={lookGarmentSource} />
                          <div className="archive-look-meta">
                            <time dateTime={outfit.createdAt}>
                              {new Date(outfit.createdAt).toLocaleDateString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                              })}
                            </time>
                            <div>
                              <strong>{outfit.name}</strong>
                              <span>{outfit.category} / {outfit.season}</span>
                            </div>
                          </div>
                        </article>
                      ))}
                      <button className="archive-add-look" onClick={() => setUploadMode("outfit")}>
                        <span>＋</span>
                        <strong>ADD LOOK</strong>
                        <small>记录下一套 OOTD</small>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="archive-toolbar">
                  <div>
                    <span>CATEGORY / 品类</span>
                    {archiveCategories.map((category) => (
                      <button
                        key={category}
                        className={archiveCategory === category ? "active" : ""}
                        onClick={() => setArchiveCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <p>
                    <strong>{archiveGarments.length}</strong>
                    件展品
                  </p>
                </div>

                {isDemoCloset && (
                  <div className="archive-sample-note">
                    这是示例陈列。添加第一件真实衣物后，这里会成为你的私人衣物展厅。
                  </div>
                )}

                <div className="garment-exhibition">
                  <div className="exhibition-label">
                    <p className="eyebrow">PERMANENT COLLECTION</p>
                    <h2>我的衣物<br />永久收藏</h2>
                    <span>每一件都不是库存，是你造型语言的一部分。</span>
                  </div>
                  <div className="exhibition-grid">
                    {archiveGarments.map((garment, index) => (
                      <article
                        key={garment.id}
                        className={`exhibit-card ${garment.extra.status === "removed" ? "removed" : ""}`}
                      >
                        <div className="exhibit-number">
                          {String(index + 1).padStart(3, "0")}
                        </div>
                        <GarmentVisual item={garment} />
                        {garment.isDemo && <span className="archive-demo-mark">示例</span>}
                        {garment.extra.status === "removed" && (
                          <span className="removed-mark">
                            {removalReasonLabel(garment.extra.removalReason)}
                          </span>
                        )}
                        <div className="exhibit-meta">
                          <strong>{garment.name}</strong>
                          <span>{garment.category} / {garment.color || "未标颜色"}</span>
                          <small>
                            入藏 {new Date(garment.createdAt).toLocaleDateString("zh-CN", {
                              year: "numeric",
                              month: "2-digit",
                            })} · 穿过 {garment.wornCount} 次
                          </small>
                          {!garment.isDemo && garment.extra.status !== "removed" && (
                            <button
                              className="garment-departure-button"
                              onClick={() => setRemoveTarget(garment)}
                            >
                              出库 / 已售
                            </button>
                          )}
                          {garment.extra.status === "removed" && (
                            <button
                              className="garment-restore-button"
                              onClick={() => restoreEntry(garment)}
                            >
                              重新入库
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "consider" && (
          <section className="consider-page inner-page">
            <div className="consider-hero">
              <p className="eyebrow">DESIRE / REVIEW / DECIDE</p>
              <h1>欲望需要<br />一次审查。</h1>
              <p>上传一件想买的衣服，衣橱会从品类、颜色和已有数量三个方向给你一个冷静建议。</p>
              <button className="primary-button" onClick={() => setUploadMode("wish")}>
                ＋ 上传心仪单品
              </button>
            </div>
            <div className="decision-board">
              <div className="decision-stat">
                <span>{wishes.length}</span>
                <p>件正在考虑</p>
              </div>
              <div className="decision-stat">
                <span>{new Set(garments.map((item) => item.category)).size}</span>
                <p>个已有品类</p>
              </div>
              <div className="decision-rule">
                <p className="eyebrow">YOUR RULE</p>
                <h3>同类超过 3 件，先搭再买。</h3>
                <span>这条规则可以以后按你的习惯调整。</span>
              </div>
            </div>
            {wishes.length > 0 && (
              <div className="wish-list">
                {wishes.map((wish) => (
                  <article key={wish.id}>
                    <GarmentVisual item={wish} />
                    <div>
                      <strong>{wish.name}</strong>
                      <span>{wish.category} · {wish.color}</span>
                      {wish.extra.price && <small>¥ {String(wish.extra.price)}</small>}
                      <p>{String(wish.extra.recommendation || "已经收进考虑清单")}</p>
                    </div>
                    <button
                      className="wish-delete-button"
                      onClick={() => setRemoveTarget(wish)}
                      aria-label={`删除购前清单：${wish.name}`}
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <button className="mobile-add" onClick={() => setUploadMode("garment")} aria-label="添加衣物">
        ＋
      </button>

      {uploadMode && (
        <UploadModal
          mode={uploadMode}
          items={garments}
          onClose={() => setUploadMode(null)}
          onSaved={addEntry}
        />
      )}
      {profileOpen && (
        <ProfileModal
          displayName={displayName}
          onClose={() => setProfileOpen(false)}
        />
      )}
      {removeTarget && (
        <RemoveGarmentModal
          item={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onUpdated={updateEntry}
          onDeleted={deleteEntry}
        />
      )}
      {notice && <div className="app-notice" role="status">{notice}</div>}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (user === undefined) {
    return <main className="auth-shell"><div className="profile-orbit">衣</div></main>;
  }
  if (!user) {
    return <AuthGate />;
  }
  const displayName = (user.email || "衣橱主人").split("@")[0];
  return (
    <>
      <Home displayName={displayName} />
      <AddToHomeScreen />
    </>
  );
}
