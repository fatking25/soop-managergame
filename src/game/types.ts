export type StageId = 1 | 2 | 3 | 4 | 5;

export type ChatKind =
  | "NORMAL"
  | "LONG"
  | "COACH"
  | "DIVERT"
  | "KEYWORD"
  | "COMMUNITY";

export type ActionKind = "MUTE" | "KICK" | "BAN";

export type JudgeVerdict = "PERFECT" | "GOOD" | "MISS";

export type StreamMood = "CALM" | "ANGRY" | "TIRED";

export type EventKind = "NONE" | "DONATION" | "AD" | "LAG" | "ACCIDENT";

export type ChatMessage = {
  id: string;
  nick: string;
  text: string;
  kind: ChatKind;
  isTroll: boolean;

  // UI
  y: number; // px
  speed: number; // px/sec
  createdAtMs: number;
};

export type StageConfig = {
  id: StageId;
  viewers: number;
  durationMs: number;
  spawnIntervalMs: number; // base
  trollRate: number; // 0..1
  speedPxPerSec: number;
  comboDecayMs: number;
  stageMultiplier: number;
};

export type FeedbackState = {
  visible: boolean;
  ok: boolean;
  title: string;
  tip: string;
  ttlMs: number;
};

export type GameSnapshot = {
  running: boolean;
  paused: boolean;
  stage: StageConfig;
  stageIndex: number; // 0..4
  stageTimeLeftMs: number;

  viewers: number;
  mental: number; // 0..100
  score: number;

  removedTotal: number;
  removedByKind: Record<ChatKind, number>;
  maxCombo: number;
  combo: number;

  activeAction: ActionKind;

  event: {
    kind: EventKind;
    leftMs: number;
  };

  subtitle: string;

  messages: ChatMessage[];

  // input delay (AD event 등)
  inputLockMs: number;

  // tutorial
  showTutorial: boolean;

  // result
  gameOver: boolean;
  cleared: boolean;

  // NEW: 오답/팁 토스트
  feedback: FeedbackState;
};
