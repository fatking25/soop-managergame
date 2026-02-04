import React, { useMemo } from "react";
import type { ChatKind } from "../game/types";

type Props = {
  cleared: boolean;
  score: number;
  stageId: number;
  viewers: number;
  removedTotal: number;
  maxCombo: number;
  removedByKind: Record<ChatKind, number>;
  onRestart: () => void;
};

function grade(cleared: boolean, score: number, stageId: number) {
  if (cleared) return "숲의 수호자";
  if (stageId >= 4 && score > 6000) return "완장 인증";
  if (stageId >= 3) return "커뮤니티 관리자";
  return "초보 매니저";
}

export default function ResultScreen(props: Props) {
  const title = grade(props.cleared, props.score, props.stageId);

  const removedSum = useMemo(() => {
    const r = props.removedByKind;
    return (
      (r.LONG ?? 0) +
      (r.COACH ?? 0) +
      (r.DIVERT ?? 0) +
      (r.KEYWORD ?? 0) +
      (r.COMMUNITY ?? 0)
    );
  }, [props.removedByKind]);

  const totalToShow = removedSum; // ✅ 화면 표시는 합산값 고정

  return (
    <div className="result-wrap">
      <div className="result-card">
        <div className="result-title">{props.cleared ? "클리어" : "방송 종료"}</div>
        <div className="result-sub">{title}</div>

        <div className="result-grid">
          <div className="box">
            <div className="k">도달 Stage</div>
            <div className="v">{props.stageId}</div>
          </div>
          <div className="box">
            <div className="k">최종 시청자</div>
            <div className="v">{props.viewers.toLocaleString()}명</div>
          </div>
          <div className="box">
            <div className="k">총 분탕 제거</div>
            <div className="v">{totalToShow}</div>
          </div>
          <div className="box">
            <div className="k">최대 콤보</div>
            <div className="v">{props.maxCombo}</div>
          </div>
          <div className="box wide">
            <div className="k">점수</div>
            <div className="v big">{props.score.toLocaleString()}</div>
          </div>
        </div>

        <div className="result-kinds">
          <div className="kind">장문형 {props.removedByKind.LONG ?? 0}</div>
          <div className="kind">훈수형 {props.removedByKind.COACH ?? 0}</div>
          <div className="kind">물타기형 {props.removedByKind.DIVERT ?? 0}</div>
          <div className="kind">키워드형 {props.removedByKind.KEYWORD ?? 0}</div>
          <div className="kind">커뮤니티형 {props.removedByKind.COMMUNITY ?? 0}</div>
        </div>

        <div className="result-actions">
          <button className="btn" onClick={props.onRestart}>다시하기</button>
          <div className="hint">스샷용: 이 화면 그대로 캡쳐</div>
        </div>
      </div>
    </div>
  );
}
