import "./App.css";
import { useEffect, useRef, useState } from "react";
import { useGame } from "./hooks/useGame";
import { MAZE_LABELS, BALL_RADIUS } from "./constants/maze";
import {
  Headphones,
  DeviceMobile,
  Desktop,
  Target,
  Wall,
  Trophy,
  WarningCircle,
} from "@phosphor-icons/react";

function TiltOverlay({
  tiltRef,
  ballRef,
}: {
  tiltRef: React.RefObject<{ x: number; y: number }>;
  ballRef: React.RefObject<{ x: number; y: number; vx: number; vy: number }>;
}) {
  const dotRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const t = tiltRef.current;
      const b = ballRef.current;
      const dot = dotRef.current;
      const label = labelRef.current;
      if (dot && label) {
        const MAX = 40;
        const nx = Math.max(-1, Math.min(1, t.x / MAX));
        const ny = Math.max(-1, Math.min(1, t.y / MAX));
        dot.style.transform = `translate(calc(-50% + ${nx * 22}px), calc(-50% + ${ny * 22}px))`;
        const speed = Math.hypot(b.vx, b.vy);
        label.textContent = `γ${t.x.toFixed(0).padStart(4)} β${t.y.toFixed(0).padStart(4)}  v${speed.toFixed(1)}`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [tiltRef, ballRef]);

  return (
    <div className="tilt-overlay">
      <div className="tilt-ring">
        <span ref={dotRef} className="tilt-dot" />
      </div>
      <span ref={labelRef} className="tilt-label" />
    </div>
  );
}

function MazeDebugView({
  mazeRef,
  ballRef,
}: {
  mazeRef: React.RefObject<{
    walls: { x: number; y: number; w: number; h: number }[];
    ball: { x: number; y: number; vx: number; vy: number };
    goal: { x: number; y: number; w: number; h: number };
  }>;
  ballRef: React.RefObject<{ x: number; y: number; vx: number; vy: number }>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const maze = mazeRef.current;
      const ball = ballRef.current;
      const S = canvas.width / 500;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ゴール壁
      const g = maze.goal;
      ctx.fillStyle = "rgba(0,255,120,0.3)";
      ctx.fillRect(g.x * S, g.y * S, g.w * S, g.h * S);
      ctx.strokeStyle = "#00ff78";
      ctx.lineWidth = 1;
      ctx.strokeRect(g.x * S, g.y * S, g.w * S, g.h * S);
      ctx.fillStyle = "#00ff78";
      ctx.font = `${9 * S}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("GOAL", (g.x + g.w / 2) * S, (g.y - 3) * S);

      // 壁
      for (const w of maze.walls) {
        ctx.fillStyle = "#3a6ea5";
        ctx.fillRect(w.x * S, w.y * S, w.w * S, w.h * S);
        ctx.strokeStyle = "#5a9ed5";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(w.x * S, w.y * S, w.w * S, w.h * S);
      }

      // ボール
      ctx.beginPath();
      ctx.arc(ball.x * S, ball.y * S, BALL_RADIUS * S, 0, Math.PI * 2);
      ctx.fillStyle = "#ff6b35";
      ctx.fill();
      ctx.strokeStyle = "#ffaa80";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 速度ベクトル
      const vScale = 4;
      ctx.beginPath();
      ctx.moveTo(ball.x * S, ball.y * S);
      ctx.lineTo((ball.x + ball.vx * vScale) * S, (ball.y + ball.vy * vScale) * S);
      ctx.strokeStyle = "#ffaa80";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 座標ラベル
      ctx.fillStyle = "#888";
      ctx.font = `${9 * S}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`(${Math.round(ball.x)}, ${Math.round(ball.y)})`, (ball.x + 18) * S, ball.y * S);

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [mazeRef, ballRef]);

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 9999,
        opacity: 0.92,
        border: "1px solid #3a6ea5",
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 2px 12px #000a",
      }}
    >
      <div
        style={{
          background: "#111",
          color: "#5a9ed5",
          fontSize: 9,
          fontFamily: "monospace",
          padding: "2px 6px",
          letterSpacing: 1,
        }}
      >
        DEBUG MAZE VIEW
      </div>
      <canvas ref={canvasRef} width={250} height={250} style={{ display: "block" }} />
    </div>
  );
}

export default function AudioBlindMaze() {
  const { phase, startGame, stopGame, tiltRef, ballRef, mazeRef } = useGame();
  const [debugVisible, setDebugVisible] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "`") setDebugVisible((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="maze-root">
      <div className="maze-grid" />
      <div className="maze-scanline" />

      <div className="maze-inner">
        <div className="maze-header">
          <p className="maze-eyebrow">◈ AUDIO BLIND ◈</p>
          <h1 className="maze-title">MAZE</h1>
          <p className="maze-subtitle">目を閉じて、音だけを頼りに脱出せよ</p>
        </div>

        {phase !== "playing" && (
          <div className="maze-select">
            <p className="maze-select-label">
              {phase === "clear" ? (
                <>
                  <Trophy size={12} weight="light" /> NEXT STAGE
                </>
              ) : (
                <>
                  <WarningCircle size={12} weight="light" /> 音が出ます・傾きを許可してください
                </>
              )}
            </p>
            <div className="maze-select-btns">
              {MAZE_LABELS.map((label, i) => (
                <button key={label} className="maze-btn" onClick={() => startGame(i)}>
                  <span className="maze-btn-label">▶ {label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "playing" && (
          <div className="maze-playing-indicator">
            <span className="maze-dot" />
            <span className="maze-playing-label">NOW PLAYING</span>
            <button className="maze-stop-btn" onClick={stopGame}>
              ■ STOP
            </button>
          </div>
        )}

        <div className="maze-hint-box">
          {phase === "idle" && (
            <>
              <p className="maze-hint">
                <Headphones size={13} weight="light" /> ヘッドホン推奨
              </p>
              <p className="maze-hint">
                <DeviceMobile size={13} weight="light" /> スマホを傾けてボールを転がす
              </p>
              <p className="maze-hint">
                <Desktop size={13} weight="light" /> PC: WASD / 矢印キーで操作可
              </p>
              <p className="maze-hint">
                <Target size={13} weight="light" /> 「ポーン」の方向がゴール
              </p>
              <p className="maze-hint">
                <Wall size={13} weight="light" /> 壁にぶつかると「コツ」と鳴る
              </p>
            </>
          )}
          {phase === "playing" && (
            <>
              <p className="maze-hint">
                <Target size={13} weight="light" /> 「ポーン」音のする方向がゴール
              </p>
              <p className="maze-hint">
                <Wall size={13} weight="light" /> 「コツ」= 壁にぶつかった
              </p>
              <p className="maze-hint">
                <Desktop size={13} weight="light" /> WASD / 矢印キーで操作
              </p>
            </>
          )}
          {phase === "clear" && (
            <>
              <p className="maze-hint maze-hint--clear">
                <Trophy size={16} weight="light" /> GOAL CLEAR!
              </p>
              <p className="maze-hint maze-hint--clear">おめでとうございます！</p>
            </>
          )}
        </div>

        {phase === "playing" && <TiltOverlay tiltRef={tiltRef} ballRef={ballRef} />}
      </div>

      {import.meta.env.DEV && (
        <>
          {debugVisible && <MazeDebugView mazeRef={mazeRef} ballRef={ballRef} />}
          <button
            onClick={() => setDebugVisible((v) => !v)}
            style={{
              position: "fixed",
              bottom: 8,
              right: 8,
              zIndex: 9999,
              background: debugVisible ? "#3a6ea5" : "#222",
              color: debugVisible ? "#fff" : "#666",
              border: "1px solid #3a6ea5",
              borderRadius: 3,
              padding: "3px 8px",
              fontSize: 10,
              fontFamily: "monospace",
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            {debugVisible ? "MAZE OFF" : "MAZE ON"} [`]
          </button>
        </>
      )}

      <p className="maze-footer">
        {phase === "idle" && "画面を見ずにプレイしてください"}
        {phase === "playing" && "ゲーム中..."}
        {phase === "clear" && "STAGE CLEAR ✓"}
      </p>
    </div>
  );
}
