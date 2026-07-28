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

照片存储在 Supabase Storage 的 `garments` 存储桶中。衣物白底处理使用
`@imgly/background-removal` 在浏览器本地完成，不需要 API Key，照片不会发送给第三方抠图服务。
模型文件由本站的 `/bg-model/1.7.0/` 路径提供；首次使用约需加载 55MB，浏览器缓存后可重复使用。
白底处理默认关闭。开启后先检查主体蒙版并展示原图/白底对照，只有用户再次确认才会保存；
如果设备性能不足、没有识别到可靠主体或结果异常，应用会停止使用白底版本。
衣物编辑页可以替换错误照片，且会保留名称、备注和穿着次数。
本地抠图依赖 `@imgly/background-removal`，按其 AGPL-3.0 许可证使用；应用内提供本仓库源码入口。

## 上线

仓库的 `main` 分支已经连接 Vercel。Vercel 项目需要配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

提交并推送 `main` 后会触发生产部署。
