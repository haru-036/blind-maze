export const BALL_RADIUS = 15;
export const GOAL_RADIUS = 30;
export const INITIAL_BALL = { x: 50, y: 50, vx: 0, vy: 0 };
export const GOAL = { x: 450, y: 450 };
export const WALLS = [
  { x: 0, y: 0, w: 500, h: 10 },
  { x: 0, y: 490, w: 500, h: 10 },
  { x: 0, y: 0, w: 10, h: 500 },
  { x: 490, y: 0, w: 10, h: 500 },
  { x: 150, y: 0, w: 20, h: 350 },
  { x: 320, y: 150, w: 20, h: 350 },
];
export const HIT_COOLDOWN = 0.15;
export const KEY_ACCEL = 1.2;
