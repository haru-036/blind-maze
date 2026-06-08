import { useState, useRef, useCallback, useEffect } from "react";
import {
  BALL_RADIUS,
  GOAL_RADIUS,
  INITIAL_BALL,
  GOAL,
  WALLS,
  KEY_ACCEL,
  MAX_SPEED,
  TILT_ACCEL,
} from "../constants/maze";
import { useAudio } from "./useAudio";

export type Phase = "idle" | "playing" | "clear";

export function useGame() {
  const [phase, setPhase] = useState<Phase>("idle");

  const { initAudio, resetTimings, stopAudio, playHit, playFanfare, tickGoalPing } = useAudio();

  const ballRef = useRef({ ...INITIAL_BALL });
  const isPlayingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (!isPlayingRef.current) return;
    const tiltX = e.gamma ?? 0;
    const tiltY = (e.beta ?? 0) - 30;
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

    for (const w of WALLS) {
      const cx = Math.max(w.x, Math.min(ball.x, w.x + w.w));
      const cy = Math.max(w.y, Math.min(ball.y, w.y + w.h));
      const dx = ball.x - cx;
      const dy = ball.y - cy;
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
    }

    tickGoalPing(ball, GOAL.x, GOAL.y);

    const distToGoal = Math.hypot(GOAL.x - ball.x, GOAL.y - ball.y);
    if (distToGoal < GOAL_RADIUS) {
      isPlayingRef.current = false;
      playFanfare();
      setPhase("clear");
      return;
    }

    rafRef.current = requestAnimationFrame(updateGame);
  }, [playHit, playFanfare, tickGoalPing]);

  const startGame = useCallback(async () => {
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

    const ok = await initAudio();
    if (!ok) return;

    ballRef.current = { ...INITIAL_BALL };
    resetTimings();
    isPlayingRef.current = true;

    window.addEventListener("deviceorientation", handleOrientation);
    setPhase("playing");
    rafRef.current = requestAnimationFrame(updateGame);
  }, [initAudio, resetTimings, handleOrientation, updateGame]);

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

  return { phase, startGame, stopGame };
}
