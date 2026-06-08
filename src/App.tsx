import "./App.css";
import { useEffect, useRef } from "react";
import { useGame } from "./hooks/useGame";
import { MAZE_LABELS } from "./constants/maze";
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

export default function AudioBlindMaze() {
  const { phase, startGame, stopGame, tiltRef, ballRef } = useGame();

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

      <p className="maze-footer">
        {phase === "idle" && "画面を見ずにプレイしてください"}
        {phase === "playing" && "ゲーム中..."}
        {phase === "clear" && "STAGE CLEAR ✓"}
      </p>
    </div>
  );
}
