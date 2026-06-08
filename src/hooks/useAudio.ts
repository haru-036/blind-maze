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

export function useAudio(addLog: (msg: string) => void) {
  const ctxRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const rollOscRef = useRef<OscillatorNode | null>(null);
  const rollGainRef = useRef<GainNode | null>(null);
  const lastHitRef = useRef(0);
  const nextPingRef = useRef(0);
  const nextWallPingRef = useRef(0);

  const initAudio = useCallback(async () => {
    try {
      // Reuse context across retries; browsers cap AudioContext instances
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

      addLog("ctx作成: " + ctx.state);
      if (ctx.state === "suspended") {
        await ctx.resume();
        addLog("resume後: " + ctx.state);
      }

      // Stop previous oscillator before creating a new one for this session
      try {
        rollOscRef.current?.stop();
      } catch {
        /* already stopped */
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 200;
      osc.type = "triangle";
      osc.frequency.value = 80;
      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      rollOscRef.current = osc;
      rollGainRef.current = gain;

      addLog("音声初期化OK");
      return true;
    } catch (e) {
      addLog("音声エラー: " + (e instanceof Error ? e.message : String(e)));
      return false;
    }
  }, [addLog]);

  const resetTimings = useCallback(() => {
    nextPingRef.current = 0;
    nextWallPingRef.current = 0;
    lastHitRef.current = 0;
  }, []);

  const playHit = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - lastHitRef.current < HIT_COOLDOWN) return;
    lastHitRef.current = now;
    playTone(ctx, ctx.destination, 120, 0.4, 0.12);
  }, []);

  const playWallWarning = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    playTone(ctx, ctx.destination, 880, 0.05, 0.05);
  }, []);

  const playGoalPing = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !pannerRef.current) return;
    playTone(ctx, pannerRef.current, 440, 0.2, 0.4);
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

  const stopRoll = useCallback(() => {
    try {
      rollOscRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const updateRoll = useCallback((spd: number) => {
    const ctx = ctxRef.current;
    if (!ctx || !rollGainRef.current || !rollOscRef.current) return;
    const now = ctx.currentTime;
    rollGainRef.current.gain.setTargetAtTime(Math.min(spd / 10, 0.5), now, 0.1);
    rollOscRef.current.frequency.setTargetAtTime(80 + spd * 5, now, 0.1);
  }, []);

  const tickWallWarning = useCallback(
    (minDist: number) => {
      const ctx = ctxRef.current;
      if (!ctx || minDist >= 80) return;
      const now = ctx.currentTime;
      const interval = 0.1 + (minDist / 80) * 0.5;
      if (now > nextWallPingRef.current) {
        playWallWarning();
        nextWallPingRef.current = now + interval;
      }
    },
    [playWallWarning],
  );

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

  return {
    initAudio,
    resetTimings,
    playHit,
    playFanfare,
    stopRoll,
    updateRoll,
    tickWallWarning,
    tickGoalPing,
  };
}
