import { useRef, useCallback } from "react";
import { HIT_COOLDOWN } from "../constants/maze";

const AudioCtxClass: typeof AudioContext =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.AudioContext || (window as any).webkitAudioContext;

function playTone(ctx: AudioContext, dest: AudioNode, freq: number, peakGain: number, dur: number) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(peakGain, now);
  g.gain.exponentialRampToValueAtTime(0.01, now + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(now);
  osc.stop(now + dur);
}

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const lastHitRef = useRef(0);
  const lastWallRef = useRef(0);
  const nextPingRef = useRef(0);

  const initAudio = useCallback(async () => {
    try {
      let ctx = ctxRef.current;
      if (!ctx) {
        ctx = new AudioCtxClass();
        ctxRef.current = ctx;

        const panner = ctx.createPanner();
        panner.panningModel = "HRTF";
        panner.distanceModel = "linear";
        panner.maxDistance = 20;
        panner.rolloffFactor = 1;
        panner.connect(ctx.destination);
        pannerRef.current = panner;
      }

      if (ctx.state === "suspended" || (ctx.state as string) === "interrupted") {
        await ctx.resume();
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  const resetTimings = useCallback(() => {
    nextPingRef.current = 0;
    lastHitRef.current = 0;
    lastWallRef.current = 0;
  }, []);

  const playHit = useCallback((impactSpeed: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    // 壁への垂直速度が小さい（ゆっくり押し付け・横滑り）は無音
    if (impactSpeed < 1.2) return;
    const now = ctx.currentTime;
    if (now - lastHitRef.current < HIT_COOLDOWN) return;
    lastHitRef.current = now;

    const vol = Math.min(1, impactSpeed / 6);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    oscGain.gain.setValueAtTime(0.35 * vol, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    const bufSize = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    noiseGain.gain.setValueAtTime(0.08 * vol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    noise.buffer = buf;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }, []);

  const playWallTouch = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - lastWallRef.current < 0.9) return;
    lastWallRef.current = now;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    oscGain.gain.setValueAtTime(0.12, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    const bufSize = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    noiseGain.gain.setValueAtTime(0.03, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    noise.buffer = buf;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }, []);

  const playGoalPing = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !pannerRef.current) return;
    playTone(ctx, pannerRef.current, 220, 0.2, 0.4);
  }, []);

  const playFanfare = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator(),
        g = ctx.createGain();
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      g.gain.setValueAtTime(0.25, now + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.5);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    });
  }, []);

  const tickGoalPing = useCallback(
    (ball: { x: number; y: number }, goalX: number, goalY: number) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      if (now <= nextPingRef.current) return;
      const px = (goalX - ball.x) / 100;
      const pz = (goalY - ball.y) / 100;
      const panner = pannerRef.current;
      if (panner?.positionX) {
        panner.positionX.setValueAtTime(px, now);
        panner.positionZ.setValueAtTime(pz, now);
      } else {
        panner?.setPosition?.(px, 0, pz);
      }
      playGoalPing();
      const dg = Math.hypot(goalX - ball.x, goalY - ball.y);
      nextPingRef.current = now + Math.max(0.4, Math.min(1.5, dg / 300));
    },
    [playGoalPing],
  );

  const stopAudio = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    void ctx.close();
    ctxRef.current = null;
    pannerRef.current = null;
  }, []);

  return {
    initAudio,
    resetTimings,
    stopAudio,
    playHit,
    playWallTouch,
    playFanfare,
    tickGoalPing,
  };
}
