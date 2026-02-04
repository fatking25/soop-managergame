import React from "react";

type Props = {
  onStart: () => void;
};

export default function TutorialOverlay({ onStart }: Props) {
  return (
    <div className="tutorial">
      <div className="tutorial-card">
        <div className="t-title">숲 버츄얼 키우기</div>
        <div className="t-desc">
          채팅에서 분탕을 쳐내서 방장의 멘탈을 지켜라<br /><br />
          조작법 : 좌클릭<br />
          숫자키 : (1)채금 / (2)강퇴 / (3)블랙<br />
          일시정지 : ESC<br />
        </div>
        <button className="btn" onClick={onStart}>시작</button>
      </div>
    </div>
  );
}
