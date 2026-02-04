import React from "react";

type Props = {
  stageId: number;
  viewers: number;
  mental: number;
  score: number;
  combo: number;
  removed: number;
  timeLeftMs: number;
};

export default function HUD({ stageId, viewers, mental, score, combo, removed, timeLeftMs }: Props) {
  const pct = Math.max(0, Math.min(100, mental));
  const pctInt = Math.floor(pct); // UI용 정수 표시
  const sec = Math.ceil(timeLeftMs / 1000);

  return (
    <div className="hud">
      <div className="hud-left">
        <div className="pill">Stage {stageId}</div>
        <div className="pill">시청자 {viewers.toLocaleString()}명</div>
        <div className="pill">남은 시간 {sec}s</div>
      </div>

      <div className="hud-center">
        <div className="mental">
          <div className="mental-label">멘탈</div>
          <div className="mental-bar">
            <div className="mental-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="mental-num">{pctInt}</div>
        </div>
      </div>

      <div className="hud-right">
        <div className="stat">
          <div className="k">점수</div>
          <div className="v">{score.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="k">콤보</div>
          <div className="v">{combo}</div>
        </div>
        <div className="stat">
          <div className="k">제거</div>
          <div className="v">{removed}</div>
        </div>
      </div>
    </div>
  );
}
