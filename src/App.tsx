import "./App.css";
import { useGame } from "./hooks/useGame";

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
              {phase === "clear" ? "🎉 GOAL ACHIEVED!" : "音が出ます・傾きを許可してください"}
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
              <p className="maze-hint">🎧 ヘッドホン推奨</p>
              <p className="maze-hint">📱 スマホを傾けてボールを転がす</p>
              <p className="maze-hint">💻 PC: WASD / 矢印キーで操作可</p>
              <p className="maze-hint">🎯 「ポーン」の方向がゴール</p>
              <p className="maze-hint">🧱 壁にぶつかると「コツ」と鳴る</p>
            </>
          )}
          {phase === "playing" && (
            <>
              <p className="maze-hint">🎯 「ポーン」音のする方向がゴール</p>
              <p className="maze-hint">🧱 「コツ」= 壁にぶつかった</p>
              <p className="maze-hint">💻 WASD / 矢印キーで操作</p>
            </>
          )}
          {phase === "clear" && (
            <>
              <p className="maze-hint maze-hint--clear">🏆 GOAL CLEAR!</p>
              <p className="maze-hint">おめでとうございます！</p>
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
