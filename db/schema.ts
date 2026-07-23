import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  color: text("color").notNull().default(""),
  season: text("season").notNull().default("四季"),
  wornCount: integer("worn_count").notNull().default(0),
  lastWornAt: text("last_worn_at"),
  imageKey: text("image_key"),
  notes: text("notes").notNull().default(""),
  extraJson: text("extra_json").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
});
