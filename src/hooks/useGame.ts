import { useState, useRef, useCallback, useEffect } from "react";
import { BALL_RADIUS, KEY_ACCEL, MAX_SPEED, TILT_ACCEL, MAZES } from "../constants/maze";
import { useAudio } from "./useAudio";
import type { WallDirection } from "./useAudio";

export type Phase = "idle" | "playing" | "clear";

export function useGame() {
  const [phase, setPhase] = useState<Phase>("idle");

  const { initAudio, resetTimings, stopAudio, playHit, playWallTouch, playFanfare, tickGoalPing } =
    useAudio();

  const mazeRef = useRef(MAZES[0]);
  const ballRef = useRef({ ...mazeRef.current.ball });
  const isPlayingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const tiltRef = useRef({ x: 0, y: 0 });

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (!isPlayingRef.current) return;
    const tiltX = e.gamma ?? 0;
    const tiltY = (e.beta ?? 0) - 30;
    tiltRef.current = { x: tiltX, y: tiltY };
    const ball = ballRef.current;
    ball.vx = (ball.vx + tiltX * TILT_ACCEL) * 0.95;
    ball.vy = (ball.vy + tiltY * TILT_ACCEL) * 0.95;
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
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > MAX_SPEED) {
      ball.vx = (ball.vx / speed) * MAX_SPEED;
      ball.vy = (ball.vy / speed) * MAX_SPEED;
    }
    ball.x += ball.vx;
    ball.y += ball.vy;

    for (const w of mazeRef.current.walls) {
      const cx = Math.max(w.x, Math.min(ball.x, w.x + w.w));
      const cy = Math.max(w.y, Math.min(ball.y, w.y + w.h));
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < BALL_RADIUS) {
        let impactSpeed: number;
        let dir: WallDirection;
        if (Math.abs(dx) > Math.abs(dy)) {
          impactSpeed = Math.abs(ball.vx);
          ball.vx = 0;
          ball.x = cx + (dx > 0 ? BALL_RADIUS : -BALL_RADIUS);
          dir = dx > 0 ? "left" : "right";
        } else {
          impactSpeed = Math.abs(ball.vy);
          ball.vy = 0;
          ball.y = cy + (dy > 0 ? BALL_RADIUS : -BALL_RADIUS);
          dir = dy > 0 ? "top" : "bottom";
        }
        const totalSpeed = Math.hypot(ball.vx, ball.vy);
        if (impactSpeed >= 1.2) {
          playHit(impactSpeed, dir);
        } else if (totalSpeed < 1.5) {
          playWallTouch(dir);
        }
      }
    }

    const { goal } = mazeRef.current;
    const goalCx = goal.x + goal.w / 2;
    const goalCy = goal.y + goal.h / 2;
    tickGoalPing(ball, goalCx, goalCy);

    const gcx = Math.max(goal.x, Math.min(ball.x, goal.x + goal.w));
    const gcy = Math.max(goal.y, Math.min(ball.y, goal.y + goal.h));
    if (Math.hypot(ball.x - gcx, ball.y - gcy) < BALL_RADIUS) {
      isPlayingRef.current = false;
      playFanfare();
      setPhase("clear");
      return;
    }

    rafRef.current = requestAnimationFrame(updateGame);
  }, [playHit, playWallTouch, playFanfare, tickGoalPing]);

  const startGame = useCallback(
    async (mazeIndex: number) => {
      // 前のセッションを必ずクリーンアップ（clear からのリトライ時も含む）
      isPlayingRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("deviceorientation", handleOrientation);
      stopAudio();

      // AudioContext はユーザージェスチャー中（await前）に作成する必要がある（iOS制約）
      const ok = await initAudio();
      if (!ok) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DOE = DeviceOrientationEvent as any;
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DOE.requestPermission === "function"
      ) {
        try {
          const s = await DOE.requestPermission();
          if (s !== "granted") return;
        } catch {
          // permission denied or not supported
        }
      }

      mazeRef.current = MAZES[mazeIndex];
      ballRef.current = { ...mazeRef.current.ball };
      resetTimings();
      isPlayingRef.current = true;

      window.addEventListener("deviceorientation", handleOrientation);
      setPhase("playing");
      rafRef.current = requestAnimationFrame(updateGame);
    },
    [initAudio, resetTimings, handleOrientation, updateGame, stopAudio],
  );

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

  const stopGame = useCallback(() => {
    isPlayingRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    window.removeEventListener("deviceorientation", handleOrientation);
    stopAudio();
    setPhase("idle");
  }, [handleOrientation, stopAudio]);

  return { phase, startGame, stopGame, tiltRef, ballRef, mazeRef };
}
