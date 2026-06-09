export const BALL_RADIUS = 15;
export const HIT_COOLDOWN = 0.5;
export const KEY_ACCEL = 1.2;
export const MAX_SPEED = 8;
export const TILT_ACCEL = 0.025;

type Wall = { x: number; y: number; w: number; h: number };
type MazeConfig = {
  walls: Wall[];
  ball: { x: number; y: number; vx: number; vy: number };
  goal: Wall;
};

const BORDER_WALLS: Wall[] = [
  { x: 0, y: 0, w: 500, h: 10 },
  { x: 0, y: 490, w: 500, h: 10 },
  { x: 0, y: 0, w: 10, h: 500 },
  { x: 490, y: 0, w: 10, h: 500 },
];

// Easy: 横壁1枚、右端(x>370)が隙間
// ルート: 右に寄る → 隙間を下に抜ける → ゴール壁に当たる
const MAZE_EASY: MazeConfig = {
  walls: [...BORDER_WALLS, { x: 10, y: 240, w: 360, h: 20 }],
  ball: { x: 50, y: 50, vx: 0, vy: 0 },
  goal: { x: 410, y: 455, w: 75, h: 15 },
};

// Normal: 3×3グリッド迷路（マス140px、壁20px）
// セル(c,r): x=20+c*160, y=20+r*160
// ルート: (0,0)→(1,0)→(1,1)→(2,1)→(2,2)
// 罠: (1,0)から右の(2,0)は行き止まり
const MAZE_NORMAL: MazeConfig = {
  walls: [
    ...BORDER_WALLS,
    { x: 160, y: 180, w: 20, h: 140 }, // V(0→1, r=1)
    { x: 160, y: 340, w: 20, h: 140 }, // V(0→1, r=2)
    { x: 320, y: 340, w: 20, h: 140 }, // V(1→2, r=2)
    { x: 20, y: 160, w: 140, h: 20 }, // H(c=0, 0→1)
    { x: 20, y: 320, w: 140, h: 20 }, // H(c=0, 1→2)
    { x: 180, y: 320, w: 140, h: 20 }, // H(c=1, 1→2)
    { x: 340, y: 160, w: 140, h: 20 }, // H(c=2, 0→1)
  ],
  ball: { x: 90, y: 90, vx: 0, vy: 0 },
  goal: { x: 340, y: 455, w: 140, h: 15 }, // セル(2,2)の下壁
};

// Hard: 4×4グリッド迷路（マス100px、壁20px）
// セル(c,r): x=10+c*120, y=10+r*120
// ルート: (0,0)→(1,0)→(2,0)→(3,0)→(3,1)→(2,1)→(1,1)→(1,2)→(2,2)→(2,3)→(3,3)
// 罠: (1,2)から左の(0,2)は行き止まり
const MAZE_HARD: MazeConfig = {
  walls: [
    ...BORDER_WALLS,
    { x: 110, y: 130, w: 20, h: 100 }, // V(0→1, r=1)
    { x: 110, y: 370, w: 20, h: 100 }, // V(0→1, r=3)
    { x: 230, y: 370, w: 20, h: 100 }, // V(1→2, r=3)
    { x: 350, y: 250, w: 20, h: 100 }, // V(2→3, r=2)
    { x: 10, y: 110, w: 100, h: 20 }, // H(c=0, 0→1)
    { x: 10, y: 230, w: 100, h: 20 }, // H(c=0, 1→2)
    { x: 10, y: 350, w: 100, h: 20 }, // H(c=0, 2→3)
    { x: 130, y: 110, w: 100, h: 20 }, // H(c=1, 0→1)
    { x: 130, y: 350, w: 100, h: 20 }, // H(c=1, 2→3)
    { x: 250, y: 110, w: 100, h: 20 }, // H(c=2, 0→1)
    { x: 250, y: 230, w: 100, h: 20 }, // H(c=2, 1→2)
    { x: 370, y: 230, w: 100, h: 20 }, // H(c=3, 1→2)
    { x: 370, y: 350, w: 100, h: 20 }, // H(c=3, 2→3)
  ],
  ball: { x: 60, y: 60, vx: 0, vy: 0 },
  goal: { x: 370, y: 455, w: 110, h: 15 }, // セル(3,3)の下壁
};

export const MAZES: MazeConfig[] = [MAZE_EASY, MAZE_NORMAL, MAZE_HARD];

export const MAZE_LABELS = ["EASY", "NORMAL", "HARD"] as const;
