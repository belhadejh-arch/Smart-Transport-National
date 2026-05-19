import React, { useEffect, useRef } from "react";
import { View, Platform } from "react-native";

type Props = {
  onScan: (data: string) => void;
  paused?: boolean;
};

export function WebQRScanner({ onScan, paused }: Props) {
  const containerId = useRef(`qr-${Math.random().toString(36).slice(2)}`).current;
  const scannerRef = useRef<any>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (Platform.OS !== "web") return;
    let cancelled = false;

    (async () => {
      try {
        const mod: any = await import("html5-qrcode");
        if (cancelled) return;
        const Html5Qrcode = mod.Html5Qrcode;
        const instance = new Html5Qrcode(containerId, { verbose: false });
        scannerRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (vw: number, vh: number) => {
              const min = Math.min(vw, vh);
              const size = Math.floor(min * 0.7);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            onScanRef.current?.(decodedText);
          },
          () => {
            // ignore per-frame decode errors
          },
        );
      } catch (e) {
        console.warn("WebQRScanner start failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      if (inst) {
        try {
          inst.stop().then(() => inst.clear()).catch(() => {});
        } catch {}
      }
    };
  }, [containerId]);

  // Pause / resume
  useEffect(() => {
    const inst = scannerRef.current;
    if (!inst) return;
    try {
      if (paused) inst.pause?.(true);
      else inst.resume?.();
    } catch {}
  }, [paused]);

  if (Platform.OS !== "web") return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000",
      }}
      // @ts-ignore - nativeID becomes id on web
      nativeID={containerId}
    />
  );
}
