import React, { useEffect, useMemo, useRef, useState } from "react";
import TopBar from "./ui/TopBar";
import StreamFrame from "./ui/StreamFrame";
import ChatPanel from "./ui/ChatPanel";
import HUD from "./ui/HUD";
import ResultScreen from "./ui/ResultScreen";
import TutorialOverlay from "./ui/TutorialOverlay";
import { GameEngine } from "./game/gameEngine";
import type { ActionKind, StreamMood } from "./game/types";

const TOPBAR_H = 60;
const HUD_H = 86;
const GAP_H = 64;

function calcPanelHeight() {
  const h = window.innerHeight - TOPBAR_H - HUD_H - GAP_H;
  return Math.max(360, Math.min(560, h));
}

function isDigit(code: string, key: string, n: "1" | "2" | "3") {
  // Digit1 / Numpad1 둘 다 잡기
  return key === n || code === `Digit${n}` || code === `Numpad${n}`;
}

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());

  const [panelH, setPanelH] = useState<number>(() => calcPanelHeight());
  const [tick, setTick] = useState(0);

  const snap = useMemo(() => {
    if (!engineRef.current) return null;
    return engineRef.current.getSnapshot();
  }, [tick]);

  // init
  useEffect(() => {
    const eng = new GameEngine({ chatHeightPx: panelH });
    engineRef.current = eng;
    setTick((t) => t + 1);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // resize
  useEffect(() => {
    const onResize = () => setPanelH(calcPanelHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // push height into engine
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.setChatHeightPx(panelH);
  }, [panelH]);

  // loop
  useEffect(() => {
    const loop = (now: number) => {
      const eng = engineRef.current;
      if (!eng) return;

      const dt = Math.min(40, now - lastRef.current);
      lastRef.current = now;

      eng.update(dt);
      setTick((t) => t + 1);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // keyboard (FIX)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;

      if (e.repeat) return;

      let changed = false;

      // ESC pause/resume
      if (e.key === "Escape" || e.code === "Escape") {
        e.preventDefault();
        eng.togglePause();
        changed = true;
      }

      // 1/2/3 actions (Digit + Numpad)
      if (isDigit(e.code, e.key, "1")) {
        e.preventDefault();
        eng.setAction("MUTE");
        changed = true;
      }
      if (isDigit(e.code, e.key, "2")) {
        e.preventDefault();
        eng.setAction("KICK");
        changed = true;
      }
      if (isDigit(e.code, e.key, "3")) {
        e.preventDefault();
        eng.setAction("BAN");
        changed = true;
      }

      if (changed) setTick((t) => t + 1);
    };

    // capture로 먼저 받기 (버블에서 막히는 케이스 방지)
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  if (!snap) return null;

  const mood: StreamMood =
    snap.mental <= 30 ? "TIRED" : snap.mental <= 70 ? "ANGRY" : "CALM";

  const onAct = (id: string, action?: ActionKind) => {
    const eng = engineRef.current!;
    if (!id && action) {
      eng.setAction(action);
      setTick((t) => t + 1);
      return;
    }
    if (id) eng.actOnMessage(id, action);
    setTick((t) => t + 1);
  };

  const onStart = () => {
    const eng = engineRef.current!;
    eng.start();
    setTick((t) => t + 1);
  };

  const onRestart = () => {
    const eng = engineRef.current!;
    eng.reset();
    setTick((t) => t + 1);
  };

  return (
    <div className={`page ${snap.paused ? "paused" : ""}`}>
      <TopBar />

      <div className="content">
        <div className="left">
          <StreamFrame
            viewers={snap.viewers}
            stageId={snap.stage.id}
            subtitle={snap.subtitle}
            mood={mood}
            event={snap.event}
            heightPx={panelH}
          />
        </div>

        <div className="right">
          <ChatPanel
            messages={snap.messages}
            heightPx={panelH}
            onAct={onAct}
            activeAction={snap.activeAction}
            inputLockMs={snap.inputLockMs}
            feedback={snap.feedback}
          />
        </div>
      </div>

      <HUD
        stageId={snap.stage.id}
        viewers={snap.viewers}
        mental={snap.mental}
        score={snap.score}
        combo={snap.combo}
        removed={snap.removedTotal}
        timeLeftMs={snap.stageTimeLeftMs}
      />

      {snap.showTutorial && <TutorialOverlay onStart={onStart} />}

      {snap.paused && (
        <div className="pause-overlay">
          <div className="pause-card">
            <div className="p-title">일시정지</div>
            <div className="p-desc">ESC로 재개</div>
          </div>
        </div>
      )}

      {snap.gameOver && (
        <ResultScreen
          cleared={snap.cleared}
          score={snap.score}
          stageId={snap.stage.id}
          viewers={snap.viewers}
          removedTotal={snap.removedTotal}
          maxCombo={snap.maxCombo}
          removedByKind={snap.removedByKind}
          onRestart={onRestart}
        />
      )}
    </div>
  );
}
