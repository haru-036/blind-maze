import "./App.css";

export function OgImage() {
  return (
    <div className="maze-root" style={{ width: 1200, height: 630, minHeight: "unset" }}>
      <div className="maze-grid" />
      <div className="maze-scanline" />

      {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((pos) => {
        const isTop = pos.startsWith("top");
        const isLeft = pos.endsWith("left");
        return (
          <div
            key={pos}
            style={{
              position: "absolute",
              top: isTop ? 24 : undefined,
              bottom: isTop ? undefined : 24,
              left: isLeft ? 24 : undefined,
              right: isLeft ? undefined : 24,
              width: 48,
              height: 48,
              borderTop: isTop ? "2.5px solid rgba(0, 200, 255, 0.85)" : undefined,
              borderBottom: isTop ? undefined : "2.5px solid rgba(0, 200, 255, 0.85)",
              borderLeft: isLeft ? "2.5px solid rgba(0, 200, 255, 0.85)" : undefined,
              borderRight: isLeft ? undefined : "2.5px solid rgba(0, 200, 255, 0.85)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        );
      })}

      <div
        className="maze-inner"
        style={{ zIndex: 2, maxWidth: "none", width: "100%", padding: "0 60px" }}
      >
        <div className="maze-header">
          <p
            className="maze-eyebrow"
            style={{ fontSize: "1.4rem", opacity: 1, fontWeight: 700, letterSpacing: "0.35em" }}
          >
            ◈ AUDIO BLIND ◈
          </p>
          <h1 className="maze-title" style={{ fontSize: "10rem" }}>
            MAZE
          </h1>
          <p
            className="maze-subtitle"
            style={{
              fontSize: "1.4rem",
              color: "rgba(200, 221, 232, 0.75)",
              marginTop: "1.2rem",
              letterSpacing: "0.25em",
            }}
          >
            目を閉じて、音だけを頼りに脱出せよ
          </p>
        </div>
      </div>
    </div>
  );
}
