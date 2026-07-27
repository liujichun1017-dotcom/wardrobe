"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "wardrobe.athome.dismissed";

export default function AddToHomeScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    // 仅在 iOS Safari 引导（其他浏览器有自己的安装提示）
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (!isIOS || !isSafari) return;
    const timeout = window.setTimeout(() => setShow(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  if (!show) return null;
  return (
    <div className="athome-banner">
      <div>
        <strong>添加到主屏</strong>
        <p>
          点击底部
          <span className="athome-share">分享</span>
          ，选「添加到主屏幕」，像 App 一样使用衣橱。
        </p>
      </div>
      <button onClick={dismiss} aria-label="关闭">×</button>
    </div>
  );
}
