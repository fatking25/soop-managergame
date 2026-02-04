import type { ActionKind, ChatKind, JudgeVerdict } from "./types";

export function requiredActionFor(kind: ChatKind): ActionKind {
  // 최소 제재(정답 커트라인)
  // - 장문/훈수: 채금
  // - 물타기/커뮤: 강퇴
  // - 키워드(정치/민감): 블랙
  switch (kind) {
    case "LONG":
      return "MUTE";
    case "COACH":
      return "MUTE";
    case "DIVERT":
      return "KICK";
    case "COMMUNITY":
      return "KICK";
    case "KEYWORD":
      return "BAN";
    default:
      return "MUTE";
  }
}

export function actionRank(a: ActionKind): number {
  if (a === "MUTE") return 1;
  if (a === "KICK") return 2;
  return 3; // BAN
}

export function judgeMessage(
  isTroll: boolean,
  kind: ChatKind,
  action: ActionKind,
  ageMs: number
): { ok: boolean; verdict: JudgeVerdict; overPunish: boolean } {
  // NORMAL이면 어떤 제재도 오답
  if (!isTroll) {
    return { ok: false, verdict: "MISS", overPunish: true };
  }

  const req = requiredActionFor(kind);

  // 관대 룰(브레인스토밍 반영)
  // - 물타기(DIVERT): 채금도 정답 처리(단, PERFECT 불가)
  // - 키워드(KEYWORD): 강퇴도 정답 처리(단, PERFECT 불가)
  const lenientOk =
    (kind === "DIVERT" && action === "MUTE") ||
    (kind === "KEYWORD" && action === "KICK");

  const ok = actionRank(action) >= actionRank(req) || lenientOk;

  // 속도 판정
  let verdict: JudgeVerdict = "MISS";
  if (!ok) {
    verdict = "MISS";
  } else {
    // 기본 타이밍
    let v: JudgeVerdict =
      ageMs <= 500 ? "PERFECT" : ageMs <= 1000 ? "GOOD" : "MISS";

    // 관대 정답은 최고 등급 제한
    if (lenientOk && v === "PERFECT") v = "GOOD";

    verdict = v;
  }

  // 과잉 제재(최소 제재보다 강하면 과잉)
  // 관대 정답은 “미달인데 인정”이라 overPunish랑 별개
  const overPunish = actionRank(action) > actionRank(req);

  return { ok, verdict, overPunish };

}

export function basePoints(action: ActionKind): number {
  if (action === "MUTE") return 1;
  if (action === "KICK") return 2;
  return 4;
}
