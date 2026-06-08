export const BALL_RADIUS = 15;
export const GOAL_RADIUS = 30;
export const HIT_COOLDOWN = 0.5;
export const KEY_ACCEL = 1.2;
export const MAX_SPEED = 8;
export const TILT_ACCEL = 0.025;

type Wall = { x: number; y: number; w: number; h: number };
type MazeConfig = {
  walls: Wall[];
  ball: { x: number; y: number; vx: number; vy: number };
  goal: { x: number; y: number };
};

const BORDER_WALLS: Wall[] = [
  { x: 0, y: 0, w: 500, h: 10 },
  { x: 0, y: 490, w: 500, h: 10 },
  { x: 0, y: 0, w: 10, h: 500 },
  { x: 490, y: 0, w: 10, h: 500 },
];

// Easy: 縦壁2枚、S字ルート
// ルート: (50,50) → y>350でwall1通過 → y<150でwall2通過 → (450,450)
const MAZE_EASY: MazeConfig = {
  walls: [...BORDER_WALLS, { x: 150, y: 0, w: 20, h: 350 }, { x: 320, y: 150, w: 20, h: 350 }],
  ball: { x: 50, y: 50, vx: 0, vy: 0 },
  goal: { x: 450, y: 450 },
};

// Normal: 縦壁3枚ジグザグ
// ルート: (50,50) → y>340でwall1通過 → y<160でwall2通過 → y>340でwall3通過 → (450,450)
const MAZE_NORMAL: MazeConfig = {
  walls: [
    ...BORDER_WALLS,
    { x: 130, y: 10, w: 20, h: 330 },
    { x: 260, y: 160, w: 20, h: 330 },
    { x: 390, y: 10, w: 20, h: 330 },
  ],
  ball: { x: 50, y: 50, vx: 0, vy: 0 },
  goal: { x: 450, y: 450 },
};

// Hard: 縦壁+横壁の組み合わせ
// wallA: x=130, y=10〜239 (縦)
// wallB: x=130〜259, y=240〜259 (横、AとCをつなぐ)
// wallC: x=260, y=10〜259 (縦)
// wallD: x=360, y=250〜489 (縦)
// ルート: (50,50) → y>260でwallA+B+Cの隙間を通過 → y>260でwallC通過
//          → y<250でwallD通過 → (450,450)
const MAZE_HARD: MazeConfig = {
  walls: [
    ...BORDER_WALLS,
    { x: 130, y: 10, w: 20, h: 230 },
    { x: 130, y: 240, w: 150, h: 20 },
    { x: 260, y: 10, w: 20, h: 250 },
    { x: 360, y: 250, w: 20, h: 240 },
  ],
  ball: { x: 50, y: 50, vx: 0, vy: 0 },
  goal: { x: 450, y: 450 },
};

export const MAZES: MazeConfig[] = [MAZE_EASY, MAZE_NORMAL, MAZE_HARD];

export const MAZE_LABELS = ["EASY", "NORMAL", "HARD"] as const;
