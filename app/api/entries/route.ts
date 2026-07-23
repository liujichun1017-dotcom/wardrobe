import { env as cloudflareEnv } from "cloudflare:workers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type AppEnv = {
  DB: D1Database;
  GARMENTS: R2Bucket;
};

type EntryRow = {
  id: string;
  kind: string;
  name: string;
  category: string;
  color: string;
  season: string;
  worn_count: number;
  last_worn_at: string | null;
  image_key: string | null;
  notes: string;
  extra_json: string;
  created_at: string;
};

function getEnv() {
  return cloudflareEnv as unknown as AppEnv;
}

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '',
      season TEXT NOT NULL DEFAULT '四季',
      worn_count INTEGER NOT NULL DEFAULT 0,
      last_worn_at TEXT,
      image_key TEXT,
      notes TEXT NOT NULL DEFAULT '',
      extra_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS entries_kind_idx ON entries (kind)"),
    db.prepare("CREATE INDEX IF NOT EXISTS entries_created_at_idx ON entries (created_at)"),
  ]);
}

function mapEntry(row: EntryRow) {
  let extra: Record<string, unknown> = {};
  try {
    extra = JSON.parse(row.extra_json || "{}") as Record<string, unknown>;
  } catch {
    extra = {};
  }
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    category: row.category,
    color: row.color,
    season: row.season,
    wornCount: row.worn_count,
    lastWornAt: row.last_worn_at,
    imageUrl: row.image_key ? `/api/images/${encodeURIComponent(row.image_key)}` : null,
    notes: row.notes,
    extra,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const { DB } = getEnv();
  await ensureSchema(DB);
  const result = await DB.prepare(
    "SELECT * FROM entries ORDER BY created_at DESC LIMIT 500",
  ).all<EntryRow>();

  return Response.json((result.results || []).map(mapEntry), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const { DB, GARMENTS } = getEnv();
  await ensureSchema(DB);
  const form = await request.formData();
  const kind = String(form.get("kind") || "garment");
  if (!["garment", "outfit", "wish"].includes(kind)) {
    return Response.json({ error: "Unsupported entry type" }, { status: 400 });
  }

  const name = String(form.get("name") || "").trim();
  const category = String(form.get("category") || "").trim();
  if (!name || !category) {
    return Response.json({ error: "Name and category are required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const image = form.get("image");
  let imageKey: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (image.size > 12 * 1024 * 1024) {
      return Response.json({ error: "Image is too large" }, { status: 413 });
    }
    imageKey = id;
    await GARMENTS.put(imageKey, image.stream(), {
      httpMetadata: {
        contentType: image.type || "application/octet-stream",
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  }

  const row: EntryRow = {
    id,
    kind,
    name,
    category,
    color: String(form.get("color") || "").trim(),
    season: String(form.get("season") || "四季"),
    worn_count: 0,
    last_worn_at: kind === "outfit" ? createdAt.slice(0, 10) : null,
    image_key: imageKey,
    notes: String(form.get("notes") || ""),
    extra_json: String(form.get("extra") || "{}"),
    created_at: createdAt,
  };

  await DB.prepare(
    `INSERT INTO entries (
      id, kind, name, category, color, season, worn_count, last_worn_at,
      image_key, notes, extra_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      row.id,
      row.kind,
      row.name,
      row.category,
      row.color,
      row.season,
      row.worn_count,
      row.last_worn_at,
      row.image_key,
      row.notes,
      row.extra_json,
      row.created_at,
    )
    .run();

  return Response.json(mapEntry(row), { status: 201 });
}
