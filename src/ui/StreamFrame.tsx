import React from "react";
import type { EventKind, StreamMood } from "../game/types";

type Props = {
  viewers: number;
  stageId: number;
  subtitle: string;
  mood: StreamMood;
  event: { kind: EventKind; leftMs: number };
  heightPx: number;
};

function moodClass(mood: StreamMood) {
  if (mood === "CALM") return "mood-calm";
  if (mood === "ANGRY") return "mood-angry";
  return "mood-tired";
}

function asset(path: string) {
  // 로컬: "/" / 배포(GH Pages): "/SOOP-RPG/"
  return `${import.meta.env.BASE_URL}${path}`;
}

function avatarSrc(mood: StreamMood) {
  if (mood === "CALM") return asset("avatars/1.png");
  if (mood === "ANGRY") return asset("avatars/2.png");
  return asset("avatars/3.png");
}

export default function StreamFrame({
  viewers,
  stageId,
  subtitle,
  mood,
  event,
  heightPx
}: Props) {
  const ev = event.kind;

  // public/bg/bg1.png ~ bg5.png
  const bgUrl = asset(`bg/bg${stageId}.png`);

  return (
    <div
      className={`stream-frame ${moodClass(mood)} ${
        ev !== "NONE" ? `ev-${ev.toLowerCase()}` : ""
      }`}
    >
      <div className="stream-header">
        <div className="stream-badge-live">LIVE</div>
        <div className="stream-title">숲 버츄얼 키우기</div>
        <div className="stream-meta">
          <span>Stage {stageId}</span>
          <span className="dot">•</span>
          <span>시청자 {viewers.toLocaleString()}명</span>
        </div>
      </div>

      <div className="stream-body" style={{ height: heightPx }}>
        <div
          className="stream-bg"
          style={{ ["--stage-bg" as any]: `url("${bgUrl}")` }}
        />

        <div className="stream-avatar-wrap">
          <img
            className="stream-avatar"
            src={avatarSrc(mood)}
            alt="streamer avatar"
            draggable={false}
          />
        </div>

        <div className="stream-subtitle">
          <span className="subtitle-pill">{subtitle}</span>
        </div>

        {ev === "DONATION" && (
          <div className="overlay donation">
            <div className="overlay-card">
              <div className="overlay-title">별풍선 선물</div>
              <div className="overlay-body">후원 감사합니다</div>
            </div>
          </div>
        )}

        {ev === "AD" && (
          <div className="overlay ad">
            <div className="overlay-card">
              <div className="overlay-title">광고</div>
              <div className="overlay-body">입력이 잠시 지연됩니다</div>
            </div>
          </div>
        )}

        {ev === "ACCIDENT" && (
          <div className="overlay accident">
            <div className="overlay-card">
              <div className="overlay-title">방송 사고</div>
              <div className="overlay-body">화면이 잠깐 흔들립니다</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
