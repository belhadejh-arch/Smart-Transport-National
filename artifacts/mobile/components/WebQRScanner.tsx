import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";

type Props = {
  onScan: (data: string) => void;
  paused?: boolean;
};

export function WebQRScanner({ onScan, paused }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<any>(null);
  const startedRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (Platform.OS !== "web") return;
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    // Ensure the container has a stable id (html5-qrcode requires it)
    if (!el.id) el.id = `qr-${Math.random().toString(36).slice(2)}`;
    const elId = el.id;

    // Inject CSS once to force the video element to fill the container
    if (typeof document !== "undefined" && !document.getElementById("__qr_scanner_css")) {
      const style = document.createElement("style");
      style.id = "__qr_scanner_css";
      style.textContent = `
        #${elId}, #${elId} > div, #${elId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #${elId} video {
          display: block !important;
        }
      `;
      document.head.appendChild(style);
    }

    (async () => {
      try {
        const mod: any = await import("html5-qrcode");
        if (cancelled) return;
        const Html5Qrcode = mod.Html5Qrcode;
        const instance = new Html5Qrcode(elId, { verbose: false });
        scannerRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: undefined,
          },
          (decodedText: string) => {
            onScanRef.current?.(decodedText);
          },
          () => {
            // ignore per-frame decode errors
          },
        );
        startedRef.current = true;
      } catch (e) {
        console.warn("WebQRScanner start failed:", e);
        // Try fallback with user-facing camera if environment camera not available
        try {
          const mod: any = await import("html5-qrcode");
          if (cancelled) return;
          const Html5Qrcode = mod.Html5Qrcode;
          const instance = scannerRef.current ?? new Html5Qrcode(elId, { verbose: false });
          scannerRef.current = instance;
          await instance.start(
            true, // any available camera
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => onScanRef.current?.(decodedText),
            () => {},
          );
          startedRef.current = true;
        } catch (e2) {
          console.warn("WebQRScanner fallback failed:", e2);
        }
      }
    })();

    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      if (inst && startedRef.current) {
        try {
          inst.stop().then(() => {
            try { inst.clear(); } catch {}
          }).catch(() => {});
        } catch {}
      }
      startedRef.current = false;
    };
  }, []);

  // Pause / resume
  useEffect(() => {
    const inst = scannerRef.current;
    if (!inst || !startedRef.current) return;
    try {
      if (paused && typeof inst.pause === "function") inst.pause(true);
      else if (!paused && typeof inst.resume === "function") inst.resume();
    } catch {}
  }, [paused]);

  if (Platform.OS !== "web") return null;

  // Render a real <div> for web so html5-qrcode can mount its video reliably
  return React.createElement("div", {
    ref: containerRef,
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "#000",
      overflow: "hidden",
    },
  });
}
