import "./App.css";
import { useGame } from "./hooks/useGame";
import {
  Headphones,
  DeviceMobile,
  Desktop,
  Target,
  Wall,
  Trophy,
  WarningCircle,
} from "@phosphor-icons/react";

export default function AudioBlindMaze() {
  const { phase, startGame, stopGame } = useGame();

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
          <button className="maze-btn" onClick={startGame}>
            <span className="maze-btn-label">{phase === "clear" ? "▶ RETRY" : "▶ START GAME"}</span>
            <span className="maze-btn-sub">
              {phase === "clear" ? (
                <>
                  <Trophy size={12} weight="light" /> GOAL ACHIEVED!
                </>
              ) : (
                <>
                  <WarningCircle size={12} weight="light" /> 音が出ます・傾きを許可してください
                </>
              )}
            </span>
          </button>
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
      </div>

      <p className="maze-footer">
        {phase === "idle" && "画面を見ずにプレイしてください"}
        {phase === "playing" && "ゲーム中..."}
        {phase === "clear" && "STAGE CLEAR ✓"}
      </p>
    </div>
  );
}
