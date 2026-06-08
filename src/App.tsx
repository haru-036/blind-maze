import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";

const BALL_RADIUS = 15;
const GOAL_RADIUS = 30;
const INITIAL_BALL = { x: 50, y: 50, vx: 0, vy: 0 };
const GOAL = { x: 450, y: 450 };
const WALLS = [
  { x: 0, y: 0, w: 500, h: 10 },
  { x: 0, y: 490, w: 500, h: 10 },
  { x: 0, y: 0, w: 10, h: 500 },
  { x: 490, y: 0, w: 10, h: 500 },
  { x: 150, y: 0, w: 20, h: 350 },
  { x: 320, y: 150, w: 20, h: 350 },
];
const HIT_COOLDOWN = 0.15;
const KEY_ACCEL = 1.2;

export default function AudioBlindMaze() {
  const [phase, setPhase] = useState("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => setLogs((p) => [...p.slice(-6), msg]), []);

  const ballRef = useRef({ ...INITIAL_BALL });
  const isPlayingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const rollOscRef = useRef<OscillatorNode | null>(null);
  const rollGainRef = useRef<GainNode | null>(null);
  const nextPingRef = useRef(0);
  const nextWallPingRef = useRef(0);
  const lastHitRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});

  const initAudio = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      addLog("ctx作成: " + ctx.state);
      if (ctx.state === "suspended") {
        await ctx.resume();
        addLog("resume後: " + ctx.state);
      }
      audioCtxRef.current = ctx;

      const panner = ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "linear";
      panner.maxDistance = 20;
      panner.rolloffFactor = 1;
      panner.connect(ctx.destination);
      pannerRef.current = panner;

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

  const playHit = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - lastHitRef.current < HIT_COOLDOWN) return;
    lastHitRef.current = now;
    const osc = ctx.createOscillator(),
      g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }, []);

  const playWallWarning = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(),
      g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }, []);

  const playGoalPing = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(),
      g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(g);
    g.connect(pannerRef.current!);
    osc.start(now);
    osc.stop(now + 0.4);
  }, []);

  const playFanfare = useCallback(() => {
    const ctx = audioCtxRef.current;
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

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (!isPlayingRef.current) return;
    const tiltX = e.gamma ?? 0;
    const tiltY = (e.beta ?? 0) - 30;
    const ball = ballRef.current;
    ball.vx = (ball.vx + tiltX * 0.05) * 0.95;
    ball.vy = (ball.vy + tiltY * 0.05) * 0.95;
  }, []);

  const updateGame = useCallback(() => {
    if (!isPlayingRef.current) return;
    const ball = ballRef.current;
    const keys = keysRef.current;

    if (keys["ArrowLeft"] || keys["a"]) ball.vx -= KEY_ACCEL;
    if (keys["ArrowRight"] || keys["d"]) ball.vx += KEY_ACCEL;
    if (keys["ArrowUp"] || keys["w"]) ball.vy -= KEY_ACCEL;
    if (keys["ArrowDown"] || keys["s"]) ball.vy += KEY_ACCEL;
    ball.vx *= 0.92;
    ball.vy *= 0.92;
    ball.x += ball.vx;
    ball.y += ball.vy;

    let minDist = 9999;
    for (const w of WALLS) {
      const cx = Math.max(w.x, Math.min(ball.x, w.x + w.w));
      const cy = Math.max(w.y, Math.min(ball.y, w.y + w.h));
      const dx = ball.x - cx,
        dy = ball.y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < BALL_RADIUS) {
        if (Math.abs(dx) > Math.abs(dy)) {
          ball.vx *= -0.5;
          ball.x = cx + (dx > 0 ? BALL_RADIUS : -BALL_RADIUS);
        } else {
          ball.vy *= -0.5;
          ball.y = cy + (dy > 0 ? BALL_RADIUS : -BALL_RADIUS);
        }
        playHit();
      }
      if (d < minDist) minDist = d;
    }

    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

    rollGainRef.current!.gain.setTargetAtTime(Math.min(spd / 10, 0.5), now, 0.1);
    rollOscRef.current!.frequency.setTargetAtTime(80 + spd * 5, now, 0.1);

    if (minDist < 80) {
      const interval = 0.1 + (minDist / 80) * 0.5;
      if (now > nextWallPingRef.current) {
        playWallWarning();
        nextWallPingRef.current = now + interval;
      }
    }

    if (now > nextPingRef.current) {
      const px = (GOAL.x - ball.x) / 100;
      const pz = (GOAL.y - ball.y) / 100;
      const panner = pannerRef.current;
      if (panner?.positionX) {
        panner.positionX.setValueAtTime(px, now);
        panner.positionZ.setValueAtTime(pz, now);
      } else {
        panner?.setPosition?.(px, 0, pz);
      }
      playGoalPing();
      const dg = Math.hypot(GOAL.x - ball.x, GOAL.y - ball.y);
      nextPingRef.current = now + Math.max(0.4, Math.min(1.5, dg / 300));
    }

    if (Math.hypot(GOAL.x - ball.x, GOAL.y - ball.y) < GOAL_RADIUS) {
      isPlayingRef.current = false;
      try {
        rollOscRef.current?.stop();
      } catch {
        // already stopped
      }
      playFanfare();
      setPhase("clear");
      return;
    }

    rafRef.current = requestAnimationFrame(updateGame);
  }, [playHit, playWallWarning, playGoalPing, playFanfare]);

  const startGame = useCallback(async () => {
    addLog("スタートボタン押下");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOE = DeviceOrientationEvent as any;
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DOE.requestPermission === "function"
    ) {
      try {
        const s = await DOE.requestPermission();
        if (s !== "granted") {
          addLog("センサー許可なし");
          return;
        }
        addLog("センサーOK");
      } catch (err) {
        addLog("センサーエラー: " + (err instanceof Error ? err.message : String(err)));
      }
    } else {
      addLog("センサー: 許可不要(非iOS)");
    }

    const ok = await initAudio();
    if (!ok) return;

    ballRef.current = { ...INITIAL_BALL };
    nextPingRef.current = 0;
    nextWallPingRef.current = 0;
    lastHitRef.current = 0;
    isPlayingRef.current = true;

    window.addEventListener("deviceorientation", handleOrientation);
    setPhase("playing");
    addLog("ゲーム開始！");
    rafRef.current = requestAnimationFrame(updateGame);
  }, [addLog, initAudio, handleOrientation, updateGame]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("deviceorientation", handleOrientation);
      isPlayingRef.current = false;
    },
    [handleOrientation],
  );

  return (
    <div style={s.root}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.65)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        .sbtn:hover { background: rgba(0,200,255,.15) !important; }
        .sbtn:active { transform: scale(.97); }
      `}</style>

      <div style={s.grid} />
      <div style={s.scanline} />

      <div style={s.inner}>
        <div style={{ textAlign: "center" }}>
          <p style={s.eyebrow}>◈ AUDIO BLIND ◈</p>
          <h1 style={s.title}>MAZE</h1>
          <p style={s.subtitle}>目を閉じて、音だけを頼りに脱出せよ</p>
        </div>

        {phase !== "playing" && (
          <button className="sbtn" style={s.btn} onClick={startGame}>
            <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>
              {phase === "clear" ? "▶ RETRY" : "▶ START GAME"}
            </span>
            <span style={{ fontSize: ".65rem", color: "rgba(0,200,255,.6)" }}>
              {phase === "clear" ? "🎉 GOAL ACHIEVED!" : "音が出ます・傾きを許可してください"}
            </span>
          </button>
        )}

        {phase === "playing" && (
          <div style={{ display: "flex", alignItems: "center", gap: ".7rem" }}>
            <span style={{ ...s.dot, animation: "pulse 1s ease-in-out infinite" }} />
            <span style={{ fontSize: ".8rem", letterSpacing: ".35em", color: "#00ff9d" }}>
              NOW PLAYING
            </span>
          </div>
        )}

        <div style={s.hintBox}>
          {phase === "idle" && (
            <>
              <p style={s.hint}>🎧 ヘッドホン推奨</p>
              <p style={s.hint}>📱 スマホを傾けてボールを転がす</p>
              <p style={s.hint}>💻 PC: WASD / 矢印キーで操作可</p>
              <p style={s.hint}>🎯 「ポーン」の方向がゴール</p>
            </>
          )}
          {phase === "playing" && (
            <>
              <p style={s.hint}>🎯 「ポーン」音のする方向がゴール</p>
              <p style={s.hint}>⚠️ 「ピッ」連打 = 壁が近い</p>
              <p style={s.hint}>💻 WASD / 矢印キーで操作</p>
            </>
          )}
          {phase === "clear" && (
            <>
              <p style={{ ...s.hint, color: "#00ff9d", fontSize: "1rem" }}>🏆 GOAL CLEAR!</p>
              <p style={s.hint}>おめでとうございます！</p>
            </>
          )}
        </div>

        {/* デバッグログ */}
        {logs.length > 0 && (
          <div style={s.logBox}>
            {logs.map((l, i) => (
              <p key={i} style={s.logLine}>
                {l}
              </p>
            ))}
          </div>
        )}
      </div>

      <p style={s.footer}>
        {phase === "idle" && "画面を見ずにプレイしてください"}
        {phase === "playing" && "ゲーム中..."}
        {phase === "clear" && "STAGE CLEAR ✓"}
      </p>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#060a0e",
    color: "#c8dde8",
    fontFamily: "'Courier New', Courier, monospace",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(0,200,255,0.04) 1px, transparent 1px)," +
      "linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
    pointerEvents: "none",
  },
  scanline: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: "linear-gradient(transparent, rgba(0,200,255,0.07), transparent)",
    animation: "scanline 6s linear infinite",
    pointerEvents: "none",
    zIndex: 10,
  },
  inner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.8rem",
    padding: "2rem",
    zIndex: 1,
    width: "100%",
    maxWidth: 480,
  },
  eyebrow: {
    margin: "0 0 .3rem",
    fontSize: ".7rem",
    letterSpacing: ".45em",
    color: "#00c8ff",
    opacity: 0.7,
  },
  title: {
    margin: 0,
    fontSize: "clamp(4rem, 22vw, 9rem)",
    fontWeight: 900,
    letterSpacing: ".1em",
    color: "transparent",
    WebkitTextStroke: "2.5px #00c8ff",
    textShadow: "0 0 60px rgba(0,200,255,.3)",
    lineHeight: 1,
  },
  subtitle: {
    margin: ".6rem 0 0",
    fontSize: ".72rem",
    letterSpacing: ".2em",
    color: "rgba(200,221,232,.4)",
  },
  btn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: ".45rem",
    padding: "1.1rem 2.4rem",
    background: "rgba(0,200,255,.05)",
    color: "#00c8ff",
    border: "1.5px solid rgba(0,200,255,.55)",
    borderRadius: "3px",
    cursor: "pointer",
    transition: "background .2s",
    boxShadow: "0 0 18px rgba(0,200,255,.15)",
    fontFamily: "inherit",
    letterSpacing: ".08em",
  },
  dot: {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#00ff9d",
    boxShadow: "0 0 10px #00ff9d",
  },
  hintBox: {
    display: "flex",
    flexDirection: "column",
    gap: ".35rem",
    width: "100%",
    borderLeft: "2px solid rgba(0,200,255,.2)",
    paddingLeft: "1rem",
  },
  hint: {
    margin: 0,
    fontSize: ".75rem",
    color: "rgba(200,221,232,.45)",
    lineHeight: 1.7,
  },
  logBox: {
    width: "100%",
    background: "rgba(0,0,0,.5)",
    border: "1px solid rgba(0,200,255,.2)",
    borderRadius: "3px",
    padding: ".6rem .8rem",
  },
  logLine: {
    margin: "0 0 .1rem",
    fontSize: ".65rem",
    color: "#00ff9d",
    fontFamily: "monospace",
  },
  footer: {
    position: "absolute",
    bottom: "1.2rem",
    margin: 0,
    fontSize: ".65rem",
    letterSpacing: ".18em",
    color: "rgba(255,255,255,.18)",
  },
};
