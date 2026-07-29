"use client";

/* Local previews intentionally use native img elements and object URLs. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import styles from "./cutout-test.module.css";

type LocalCutoutImage = {
  toBlob: (type?: string, quality?: number) => Promise<Blob>;
};

type LocalCutoutRunner = (image: string) => Promise<LocalCutoutImage[]>;

let cutoutRunnerPromise: Promise<LocalCutoutRunner> | null = null;

function loadRmbgRunner(
  onProgress: (message: string) => void,
): Promise<LocalCutoutRunner> {
  if (!cutoutRunnerPromise) {
    cutoutRunnerPromise = import("@huggingface/transformers").then(
      async ({ pipeline }) => {
        const runner = await pipeline(
          "background-removal",
          "briaai/RMBG-1.4",
          {
            device: "wasm",
            dtype: "q8",
            progress_callback: (event: unknown) => {
              const progress = event as {
                status?: string;
                progress?: number;
                file?: string;
              };
              if (
                progress.status === "progress" &&
                Number.isFinite(progress.progress)
              ) {
                onProgress(
                  `首次加载本地模型 ${Math.round(progress.progress || 0)}%`,
                );
              } else if (progress.status === "ready") {
                onProgress("本地模型已就绪");
              } else if (progress.status === "initiate") {
                onProgress("正在准备本地模型…");
              }
            },
          },
        );
        return runner as unknown as LocalCutoutRunner;
      },
    );
  }
  return cutoutRunnerPromise;
}

function studioFrame(transparent: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(transparent);
    const image = new Image();

    image.onload = () => {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const sourceContext = sourceCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sourceContext) {
        URL.revokeObjectURL(sourceUrl);
        reject(new Error("无法读取抠图结果"));
        return;
      }

      sourceContext.drawImage(image, 0, 0);
      const pixels = sourceContext.getImageData(
        0,
        0,
        sourceCanvas.width,
        sourceCanvas.height,
      ).data;
      let minX = sourceCanvas.width;
      let minY = sourceCanvas.height;
      let maxX = -1;
      let maxY = -1;
      let visiblePixels = 0;

      for (let y = 0; y < sourceCanvas.height; y += 1) {
        for (let x = 0; x < sourceCanvas.width; x += 1) {
          const alpha = pixels[(y * sourceCanvas.width + x) * 4 + 3];
          if (alpha <= 18) continue;
          visiblePixels += 1;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }

      const visibleRatio =
        visiblePixels / Math.max(1, sourceCanvas.width * sourceCanvas.height);
      if (
        maxX < minX ||
        maxY < minY ||
        visibleRatio < 0.012 ||
        visibleRatio > 0.98
      ) {
        URL.revokeObjectURL(sourceUrl);
        reject(new Error("模型没有识别出可靠的衣物主体"));
        return;
      }

      const detectedWidth = maxX - minX + 1;
      const detectedHeight = maxY - minY + 1;
      const padding = Math.max(
        4,
        Math.round(Math.max(detectedWidth, detectedHeight) * 0.02),
      );
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropRight = Math.min(sourceCanvas.width, maxX + padding + 1);
      const cropBottom = Math.min(sourceCanvas.height, maxY + padding + 1);
      const cropWidth = cropRight - cropX;
      const cropHeight = cropBottom - cropY;

      const frameWidth = 1200;
      const frameHeight = 1500;
      const scale = Math.min(
        (frameWidth * 0.7) / cropWidth,
        (frameHeight * 0.74) / cropHeight,
      );
      const drawWidth = Math.max(1, Math.round(cropWidth * scale));
      const drawHeight = Math.max(1, Math.round(cropHeight * scale));
      const drawX = Math.round((frameWidth - drawWidth) / 2);
      const drawY = Math.round((frameHeight - drawHeight) / 2 - 16);

      const frame = document.createElement("canvas");
      frame.width = frameWidth;
      frame.height = frameHeight;
      const context = frame.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(sourceUrl);
        reject(new Error("无法生成白底图"));
        return;
      }

      context.fillStyle = "#fff";
      context.fillRect(0, 0, frameWidth, frameHeight);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.save();
      context.shadowColor = "rgba(17, 17, 15, 0.06)";
      context.shadowBlur = 16;
      context.shadowOffsetY = 6;
      context.drawImage(
        sourceCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
      );
      context.restore();
      URL.revokeObjectURL(sourceUrl);

      frame.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("无法生成白底图"));
        },
        "image/jpeg",
        0.94,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("无法读取抠图结果"));
    };
    image.src = sourceUrl;
  });
}

export default function CutoutTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [status, setStatus] = useState("选择一张衣物照片开始测试");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    },
    [originalUrl],
  );

  useEffect(
    () => () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    },
    [resultUrl],
  );

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setError("请选择 JPG、PNG 或 WebP 图片");
      return;
    }
    if (next.size > 25 * 1024 * 1024) {
      setError("图片请控制在 25MB 以内");
      return;
    }
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(next);
    setOriginalUrl(URL.createObjectURL(next));
    setResultUrl("");
    setElapsed(null);
    setError("");
    setStatus("照片已准备好，点击开始测试");
  }

  async function runCutout() {
    if (!file || running) return;
    setRunning(true);
    setError("");
    setElapsed(null);
    const startedAt = performance.now();
    const inputUrl = URL.createObjectURL(file);
    try {
      setStatus("正在加载新的本地抠图模型…");
      const runner = await loadRmbgRunner(setStatus);
      setStatus("正在本机识别衣物轮廓…");
      const output = await runner(inputUrl);
      if (!output[0]) throw new Error("模型没有返回结果");
      const transparent = await output[0].toBlob("image/png", 1);
      setStatus("正在生成统一白底陈列图…");
      const framed = await studioFrame(transparent);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(framed));
      setElapsed(Math.round((performance.now() - startedAt) / 100) / 10);
      setStatus("处理完成，请重点检查颜色、领口、袖口和细肩带");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "本地模型运行失败";
      setError(`${message}。原图没有上传，也没有被修改。`);
      setStatus("测试未完成");
    } finally {
      URL.revokeObjectURL(inputUrl);
      setRunning(false);
    }
  }

  return (
    <main className={styles.lab}>
      <header className={styles.header}>
        <Link href="/">← 返回衣橱</Link>
        <span>LOCAL / NO UPLOAD / NO SAVE</span>
      </header>

      <section className={styles.intro}>
        <p>真实照片验证页</p>
        <h1>
          先测试，
          <br />
          再上线。
        </h1>
        <div>
          <strong>照片不会上传</strong>
          <span>不登录、不保存、不覆盖衣橱；关闭页面后测试结果消失。</span>
        </div>
      </section>

      <section className={styles.controls}>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={selectFile}
        />
        <button
          type="button"
          className={styles.selectButton}
          onClick={() => fileRef.current?.click()}
          disabled={running}
        >
          {file ? "换一张照片" : "选择衣物照片"}
        </button>
        <button
          type="button"
          className={styles.runButton}
          onClick={runCutout}
          disabled={!file || running}
        >
          {running ? "正在本机处理…" : "开始新模型测试"}
        </button>
        <p className={styles.status} role="status">
          {status}
          {elapsed !== null && <strong> · {elapsed} 秒</strong>}
        </p>
        {error && <p className={styles.error}>{error}</p>}
      </section>

      <section className={styles.comparison} aria-label="抠图前后对比">
        <figure>
          <div className={styles.imageStage}>
            {originalUrl ? (
              <img src={originalUrl} alt="原始衣物照片" />
            ) : (
              <span>ORIGINAL</span>
            )}
          </div>
          <figcaption>
            <strong>原图</strong>
            <span>只在当前浏览器内读取</span>
          </figcaption>
        </figure>

        <figure>
          <div className={`${styles.imageStage} ${styles.whiteStage}`}>
            {resultUrl ? (
              <img src={resultUrl} alt="新模型白底处理结果" />
            ) : (
              <span>NEW MODEL</span>
            )}
          </div>
          <figcaption>
            <strong>新模型 · 白底陈列</strong>
            <span>主体缩小至约 70%，统一 4:5 留白</span>
          </figcaption>
        </figure>
      </section>

      {resultUrl && (
        <section className={styles.verdict}>
          <strong>请看四个地方</strong>
          <span>衣服颜色有没有变白</span>
          <span>领口和袖口有没有缺失</span>
          <span>细带、蕾丝和网纱有没有被吃掉</span>
          <span>整体大小和留白是否像商品陈列</span>
          <a href={resultUrl} download="wardrobe-cutout-test.jpg">
            下载测试图
          </a>
        </section>
      )}
    </main>
  );
}
