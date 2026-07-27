# 衣橱档案

一个为个人衣橱设计的手机优先 Web App：记录衣物、组合造型、保存 OOTD、提醒长期未穿单品，并在购买前检查同类衣物数量。

## 本地运行

需要 Node.js 22。

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中填写 Supabase 项目地址和匿名密钥。首次使用时，在 Supabase SQL Editor 执行 `supabase/schema.sql`。

## 图片与白底处理

照片存储在 Supabase Storage 的 `garments` 存储桶中。设置服务端环境变量 `REMOVE_BG_API_KEY` 后，上传衣物时可调用 remove.bg 自动抠图并铺白底；没有配置或服务暂不可用时，应用会保留压缩后的原图，不会阻断保存。

## 上线

仓库的 `main` 分支已经连接 Vercel。Vercel 项目需要配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `REMOVE_BG_API_KEY`（可选）

提交并推送 `main` 后会触发生产部署。
