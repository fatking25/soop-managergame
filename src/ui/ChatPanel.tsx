import React, { useMemo } from "react";
import type { ActionKind, ChatMessage, FeedbackState } from "../game/types";

type Props = {
  messages: ChatMessage[];
  heightPx: number;
  onAct: (id: string, action?: ActionKind) => void;
  activeAction: ActionKind;
  inputLockMs: number;
  feedback: FeedbackState;
};

function nickColor(nick: string): string {
  const colors = ["#ff5a5a", "#39d98a", "#2ec5ff", "#b07cff", "#ffb020", "#7ad7ff"];
  let h = 0;
  for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

export default function ChatPanel({
  messages,
  heightPx,
  onAct,
  activeAction,
  inputLockMs,
  feedback
}: Props) {
  const rows = useMemo(() => {
    return [...messages].sort((a, b) => a.y - b.y);
  }, [messages]);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (inputLockMs > 0) return;

    // ✅ 좌클릭 = 현재 선택된 제재(엔진 activeAction)
    onAct(id);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">채팅</div>
        <div className="chat-controls">
          <span className="chat-ico">👥</span>
          <span className="chat-ico">⚙️</span>
          <span className="chat-ico">✕</span>
        </div>
      </div>

      <div className="chat-body" style={{ height: heightPx }}>
        {rows.map((m) => (
          <div
            key={m.id}
            className={`chat-row kind-${m.kind.toLowerCase()} ${m.isTroll ? "troll" : "normal"}`}
            style={{ top: m.y }}
            onClick={(e) => handleClick(e, m.id)}
            title="채팅 클릭 = 현재 선택된 제재 적용"
          >
            <span className="nick" style={{ color: nickColor(m.nick) }}>
              {m.nick}
            </span>
            <span className="msg">{m.text}</span>
          </div>
        ))}

        {inputLockMs > 0 && (
          <div className="input-lock">
            입력 지연 {Math.ceil(inputLockMs)}ms
          </div>
        )}

        {feedback.visible && (
          <div className={`feedback-toast ${feedback.ok ? "ok" : "bad"}`}>
            <div className="fb-title">{feedback.title}</div>
            <div className="fb-tip">{feedback.tip}</div>
          </div>
        )}
      </div>

      <div className="chat-actions">
        <div className="act-hint">단축키: 1 채금 · 2 강퇴 · 3 블랙 · ESC 일시정지 | 채팅은 좌클릭만</div>
        <div className="act-buttons">
          <button className={`act ${activeAction === "MUTE" ? "on" : ""}`} onClick={() => onAct("", "MUTE")}>
            채금(1)
          </button>
          <button className={`act ${activeAction === "KICK" ? "on" : ""}`} onClick={() => onAct("", "KICK")}>
            강퇴(2)
          </button>
          <button className={`act danger ${activeAction === "BAN" ? "on" : ""}`} onClick={() => onAct("", "BAN")}>
            블랙(3)
          </button>
        </div>
      </div>
    </div>
  );
}
