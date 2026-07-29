type LocalCutoutImage = {
  toBlob: (type?: string, quality?: number) => Promise<Blob>;
};

type LocalCutoutRunner = (image: string) => Promise<LocalCutoutImage[]>;
type LocalCutoutProgress = (message: string) => void;

let runnerPromise: Promise<LocalCutoutRunner> | null = null;
const progressListeners = new Set<LocalCutoutProgress>();

function reportProgress(message: string) {
  progressListeners.forEach((listener) => listener(message));
}

function loadRunner(): Promise<LocalCutoutRunner> {
  if (!runnerPromise) {
    runnerPromise = import("@huggingface/transformers").then(
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
              };
              if (
                progress.status === "progress" &&
                Number.isFinite(progress.progress)
              ) {
                reportProgress(
                  `首次加载本地模型 ${Math.round(progress.progress || 0)}%`,
                );
              } else if (progress.status === "ready") {
                reportProgress("本地模型已就绪");
              } else if (progress.status === "initiate") {
                reportProgress("正在准备本地模型…");
              }
            },
          },
        );
        return runner as unknown as LocalCutoutRunner;
      },
    );
  }
  return runnerPromise;
}

export async function removeBackgroundWithRmbg(
  image: Blob,
  onProgress?: LocalCutoutProgress,
): Promise<Blob> {
  if (onProgress) progressListeners.add(onProgress);
  const sourceUrl = URL.createObjectURL(image);
  try {
    onProgress?.("正在载入新的本地抠图模型…");
    const runner = await loadRunner();
    onProgress?.("正在本机识别衣物轮廓…");
    const output = await runner(sourceUrl);
    if (!output[0]) throw new Error("模型没有返回结果");
    return output[0].toBlob("image/png", 1);
  } finally {
    URL.revokeObjectURL(sourceUrl);
    if (onProgress) progressListeners.delete(onProgress);
  }
}
