import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// ─── Web Audio (web only) ────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (Platform.OS !== "web") return null;
  try {
    if (!_ctx || _ctx.state === "closed") {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gain = 0.28,
  type: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.015);
}

// ─── Native Haptics helpers ──────────────────────────────────────────────────

function safeHaptic(fn: () => Promise<void>) {
  fn().catch(() => {});
}

// ─── Unified Sound API ───────────────────────────────────────────────────────

export const Sounds = {
  /** Ascending payment-success chord: C5→E5→G5→C6 (web) / success haptic (native) */
  success() {
    if (Platform.OS === "web") {
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      tone(ctx, 523.25, t,        0.14, 0.22);        // C5
      tone(ctx, 659.25, t + 0.09, 0.14, 0.24);        // E5
      tone(ctx, 783.99, t + 0.18, 0.20, 0.28);        // G5
      tone(ctx, 1046.5, t + 0.27, 0.32, 0.22);        // C6
    } else {
      safeHaptic(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      );
    }
  },

  /** Descending denied buzz (web) / error haptic (native) */
  error() {
    if (Platform.OS === "web") {
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      tone(ctx, 320, t,        0.10, 0.30, "sawtooth");
      tone(ctx, 220, t + 0.13, 0.14, 0.28, "sawtooth");
      tone(ctx, 160, t + 0.28, 0.18, 0.24, "sawtooth");
    } else {
      safeHaptic(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      );
    }
  },

  /** Quick QR-detection beep (web) / medium impact (native) */
  scan() {
    if (Platform.OS === "web") {
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      tone(ctx, 880, t, 0.06, 0.18);                  // A5
    } else {
      safeHaptic(() =>
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      );
    }
  },

  /** Soft button tap feedback */
  tap() {
    if (Platform.OS === "web") {
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      tone(ctx, 660, t, 0.05, 0.10);
    } else {
      safeHaptic(() =>
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      );
    }
  },
};
