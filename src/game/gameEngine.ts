import type {
  ActionKind,
  ChatKind,
  ChatMessage,
  GameSnapshot,
  StageConfig,
  StreamMood,
  FeedbackState
} from "./types";
import { RNG } from "./rng";
import { STAGES } from "./stages";
import { NICKS, NORMAL_TEXTS, SUBTITLES, TROLL_TEXTS } from "./textPools";
import { basePoints, judgeMessage, requiredActionFor, actionRank } from "./judge";
import { rollEvent } from "./events";

function uid(rng: RNG): string {
  return `${Date.now().toString(36)}_${rng.nextU32().toString(16)}`;
}

function pickTrollKind(rng: RNG, stageId: number): ChatKind {
  const pool: ChatKind[] =
    stageId >= 4
      ? ["LONG", "COACH", "DIVERT", "COMMUNITY", "KEYWORD", "LONG", "KEYWORD"]
      : ["LONG", "COACH", "DIVERT", "COMMUNITY", "KEYWORD"];
  return rng.pick(pool);
}

function pickText(rng: RNG, kind: ChatKind): { text: string; isTroll: boolean } {
  if (kind === "NORMAL") return { text: rng.pick(NORMAL_TEXTS), isTroll: false };
  const list = TROLL_TEXTS[kind as Exclude<ChatKind, "NORMAL">];
  return { text: rng.pick(list), isTroll: true };
}

function moodFromMental(mental: number): StreamMood {
  if (mental <= 30) return "TIRED";
  if (mental <= 70) return "ANGRY";
  return "CALM";
}

function subtitleFor(rng: RNG, mood: StreamMood, mental: number, combo: number): string {
  if (mental <= 20) return rng.pick(SUBTITLES.warning);
  if (combo >= 5) return rng.pick(SUBTITLES.praise);
  if (mood === "CALM") return rng.pick(SUBTITLES.calm);
  if (mood === "ANGRY") return rng.pick(SUBTITLES.angry);
  return rng.pick(SUBTITLES.tired);
}

export type EngineConfig = {
  chatHeightPx: number;
};

const FEEDBACK_DEFAULT: FeedbackState = {
  visible: false,
  ok: false,
  title: "",
  tip: "",
  ttlMs: 0
};

function actionLabel(a: ActionKind): string {
  if (a === "MUTE") return "채금";
  if (a === "KICK") return "강퇴";
  return "블랙";
}

function kindLabel(k: ChatKind): string {
  switch (k) {
    case "LONG": return "장문형";
    case "COACH": return "훈수형";
    case "DIVERT": return "물타기형";
    case "KEYWORD": return "키워드형";
    case "COMMUNITY": return "커뮤니티형";
    default: return "정상";
  }
}

function tipFor(isTroll: boolean, kind: ChatKind, used: ActionKind): string {
  if (!isTroll) {
    return "정상 채팅입니다 제재하지 말고 흘려보내면 됩니다";
  }

  const req = requiredActionFor(kind);

  if (kind === "DIVERT" && used === "MUTE") {
    return "물타기형은 기본 강퇴가 최적입니다 채금도 정답이지만 점수는 낮습니다";
  }
  if (kind === "KEYWORD" && used === "KICK") {
    return "키워드형은 기본 블랙이 최적입니다 강퇴도 정답이지만 점수는 낮습니다";
  }

  if (actionRank(used) < actionRank(req)) {
    return `${kindLabel(kind)}은 ${actionLabel(req)} 이상이 필요합니다`;
  }

  if (actionRank(used) > actionRank(req)) {
    return "과잉 제재입니다 정답은 맞지만 점수가 조금 깎입니다";
  }

  return "정확한 제재입니다";
}

export class GameEngine {
  private rng: RNG;
  private cfg: EngineConfig;

  private stageIndex = 0;
  private stage: StageConfig = STAGES[0];
  private stageLeftMs = this.stage.durationMs;

  private spawnAccMs = 0;
  private messages: ChatMessage[] = [];

  private mental = 100;
  private score = 0;

  private removedTotal = 0; // 내부 누적(참고용)
  private removedByKind: Record<ChatKind, number> = {
    NORMAL: 0,
    LONG: 0,
    COACH: 0,
    DIVERT: 0,
    KEYWORD: 0,
    COMMUNITY: 0
  };

  private combo = 0;
  private maxCombo = 0;

  private activeAction: ActionKind = "MUTE";

  private eventKind: GameSnapshot["event"]["kind"] = "NONE";
  private eventLeftMs = 0;

  private inputLockMs = 0;

  private running = false;
  private paused = false;

  private subtitle = "";
  private subtitleCooldownMs = 0;

  private showTutorial = true;

  private gameOver = false;
  private cleared = false;

  private feedback: FeedbackState = { ...FEEDBACK_DEFAULT };

  constructor(cfg: EngineConfig, seed?: number) {
    this.cfg = cfg;
    this.rng = new RNG(seed);
    this.reset();
  }

  setChatHeightPx(h: number) {
    this.cfg.chatHeightPx = h;
  }

  reset() {
    this.stageIndex = 0;
    this.stage = STAGES[0];
    this.stageLeftMs = this.stage.durationMs;

    this.spawnAccMs = 0;
    this.messages = [];

    this.mental = 100;
    this.score = 0;

    this.removedTotal = 0;
    this.removedByKind = {
      NORMAL: 0,
      LONG: 0,
      COACH: 0,
      DIVERT: 0,
      KEYWORD: 0,
      COMMUNITY: 0
    };

    this.combo = 0;
    this.maxCombo = 0;
    this.activeAction = "MUTE";

    this.eventKind = "NONE";
    this.eventLeftMs = 0;

    this.inputLockMs = 0;

    this.running = false;
    this.paused = false;

    this.subtitle = "준비...";
    this.subtitleCooldownMs = 0;

    this.showTutorial = true;

    this.gameOver = false;
    this.cleared = false;

    this.feedback = { ...FEEDBACK_DEFAULT };
  }

  start() {
    this.running = true;
    this.paused = false;
    this.showTutorial = false;
    this.subtitle = subtitleFor(this.rng, moodFromMental(this.mental), this.mental, this.combo);
  }

  togglePause() {
    if (!this.running || this.gameOver) return;
    this.paused = !this.paused;
  }

  setAction(a: ActionKind) {
    this.activeAction = a;
  }

  getSnapshot(): GameSnapshot {
    // ✅ “총 분탕 제거”는 항상 종류별 합으로 확정
    const removedSum =
      (this.removedByKind.LONG ?? 0) +
      (this.removedByKind.COACH ?? 0) +
      (this.removedByKind.DIVERT ?? 0) +
      (this.removedByKind.KEYWORD ?? 0) +
      (this.removedByKind.COMMUNITY ?? 0);

    return {
      running: this.running,
      paused: this.paused,
      stage: this.stage,
      stageIndex: this.stageIndex,
      stageTimeLeftMs: this.stageLeftMs,
      viewers: this.stage.viewers,
      mental: this.mental,
      score: Math.round(this.score),
      removedTotal: removedSum,
      removedByKind: this.removedByKind,
      maxCombo: this.maxCombo,
      combo: this.combo,
      activeAction: this.activeAction,
      event: { kind: this.eventKind, leftMs: this.eventLeftMs },
      subtitle: this.subtitle,
      messages: this.messages,
      inputLockMs: this.inputLockMs,
      showTutorial: this.showTutorial,
      gameOver: this.gameOver,
      cleared: this.cleared,
      feedback: this.feedback
    };
  }

  update(dtMs: number) {
    if (!this.running || this.gameOver || this.paused) return;

    if (this.inputLockMs > 0) this.inputLockMs = Math.max(0, this.inputLockMs - dtMs);

    if (this.feedback.visible) {
      this.feedback.ttlMs = Math.max(0, this.feedback.ttlMs - dtMs);
      if (this.feedback.ttlMs === 0) this.feedback = { ...FEEDBACK_DEFAULT };
    }

    if (this.eventLeftMs > 0) {
      this.eventLeftMs = Math.max(0, this.eventLeftMs - dtMs);
      if (this.eventLeftMs === 0) this.eventKind = "NONE";
    } else {
      const ev = rollEvent(this.rng, this.stage.id);
      if (ev.kind !== "NONE") {
        this.eventKind = ev.kind;
        this.eventLeftMs = ev.durationMs;
        if (ev.kind === "AD") this.inputLockMs = Math.max(this.inputLockMs, 250);
      }
    }

    if (this.subtitleCooldownMs > 0) {
      this.subtitleCooldownMs = Math.max(0, this.subtitleCooldownMs - dtMs);
    } else {
      this.subtitle = subtitleFor(this.rng, moodFromMental(this.mental), this.mental, this.combo);
      this.subtitleCooldownMs = 1400;
    }

    this.stageLeftMs -= dtMs;
    if (this.stageLeftMs <= 0) {
      if (this.stageIndex >= STAGES.length - 1) {
        this.cleared = true;
        this.gameOver = true;
        this.running = false;
        return;
      }
      this.stageIndex += 1;
      this.stage = STAGES[this.stageIndex];
      this.stageLeftMs = this.stage.durationMs;
      this.mental = Math.min(100, this.mental + 10);
      this.combo = 0;
    }

    this.spawnAccMs += dtMs;
    while (this.spawnAccMs >= this.stage.spawnIntervalMs) {
      this.spawnAccMs -= this.stage.spawnIntervalMs;
      this.spawnMessage();
    }

    const dtSec = dtMs / 1000;
    const bottom = this.cfg.chatHeightPx - 34;

    const next: ChatMessage[] = [];
    for (const m of this.messages) {
      const speed = this.stage.speedPxPerSec * (this.eventKind === "LAG" ? 0.85 : 1);
      const nm: ChatMessage = { ...m, y: m.y + speed * dtSec };

      if (nm.y >= bottom) {
        if (nm.isTroll) {
          this.mental = Math.max(0, this.mental - 10);
          this.combo = 0;
          this.feedback = {
            visible: true,
            ok: false,
            title: "MISS 놓쳤습니다",
            tip: `${kindLabel(nm.kind)}을 놓치면 멘탈이 깎입니다`,
            ttlMs: 900
          };
        } else {
          // ✅ 정상 채팅 흘려보내면 멘탈 소량 회복
          this.mental = Math.min(100, this.mental + 0.1);
        }
        continue;
      }
      next.push(nm);
    }
    this.messages = next;

    if (this.mental <= 0) {
      this.gameOver = true;
      this.running = false;
    }
  }

  private spawnMessage() {
    const isTroll = this.rng.chance(this.stage.trollRate);
    const kind: ChatKind = isTroll ? pickTrollKind(this.rng, this.stage.id) : "NORMAL";
    const { text } = pickText(this.rng, kind);

    const nick = this.rng.pick(NICKS);
    const y = 6;
    const lengthFactor = Math.min(1.4, 0.85 + text.length / 140);

    const m: ChatMessage = {
      id: uid(this.rng),
      nick,
      text,
      kind,
      isTroll,
      y,
      speed: this.stage.speedPxPerSec / lengthFactor,
      createdAtMs: performance.now()
    };

    if (this.stage.id >= 4 && isTroll && this.rng.chance(0.18)) {
      m.text = `${m.text} (…)`;
      m.kind = m.kind === "KEYWORD" ? "COMMUNITY" : m.kind;
    }

    this.messages.unshift(m);
    if (this.messages.length > 40) this.messages.length = 40;
  }

  actOnMessage(messageId: string, action?: ActionKind) {
    if (!this.running || this.paused || this.gameOver) return;
    if (this.inputLockMs > 0) return;

    const a = action ?? this.activeAction;

    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;

    const m = this.messages[idx];
    const ageMs = performance.now() - m.createdAtMs;

    const judged = judgeMessage(m.isTroll, m.kind, a, ageMs);

    this.messages.splice(idx, 1);

    if (!judged.ok) {
      this.combo = 0;

      if (!m.isTroll) {
        this.mental = Math.max(0, this.mental - 15);
      } else {
        const extra = m.kind === "KEYWORD" ? 20 : 12;
        this.mental = Math.max(0, this.mental - extra);
      }

      if (a === "BAN") {
        this.mental = Math.max(0, this.mental - 10);
      }

      this.feedback = {
        visible: true,
        ok: false,
        title: `오답: ${actionLabel(a)} (${kindLabel(m.kind)})`,
        tip: tipFor(m.isTroll, m.kind, a),
        ttlMs: 1500
      };
      return;
    }

    this.combo += judged.verdict === "PERFECT" ? 2 : 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    const p = basePoints(a);
    const verdictBonus = judged.verdict === "PERFECT" ? 1.25 : 1.0;
    const overPunishPenalty = judged.overPunish ? 0.9 : 1.0;

    const gained =
      p *
      this.stage.stageMultiplier *
      verdictBonus *
      overPunishPenalty *
      (1 + Math.min(1.5, this.combo * 0.03));

    this.score += gained;

    this.removedTotal += 1;
    this.removedByKind[m.kind] = (this.removedByKind[m.kind] ?? 0) + 1;

    const baseHeal = judged.verdict === "PERFECT" ? 4 : 2;
    const heal = Math.max(1, baseHeal - (judged.overPunish ? 1 : 0));
    this.mental = Math.min(100, this.mental + heal);

    this.feedback = {
      visible: true,
      ok: true,
      title: `${judged.verdict}: ${actionLabel(a)} 성공`,
      tip: tipFor(m.isTroll, m.kind, a),
      ttlMs: 900
    };

    if (a === "BAN") this.inputLockMs = Math.max(this.inputLockMs, 120);
  }
}
