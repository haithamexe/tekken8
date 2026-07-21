import { Radio, RotateCcw } from "lucide-react";
import type { AttackButton, Direction, Evaluation, MoveDefinition } from "../domain/types";
import { buttonColor, directionLabel } from "../domain/input-engine";

interface FighterStageProps {
  move: MoveDefinition;
  evaluation: Evaluation;
  pulse: number;
  heldDirection: Direction;
  heldButtons: AttackButton[];
  side: "P1" | "P2";
  enabled: boolean;
  onToggleEnabled: () => void;
  onClear: () => void;
}

const verdictCopy = (evaluation: Evaluation) => {
  switch (evaluation.status) {
    case "success":
      return { eyebrow: "COMMAND VERIFIED", title: "EXECUTED", tone: "success" };
    case "miss":
      return { eyebrow: "INPUT REJECTED", title: "NOT EXECUTED", tone: "danger" };
    case "progress":
      return { eyebrow: "SEQUENCE LIVE", title: `${evaluation.progress} / ${evaluation.total}`, tone: "progress" };
    default:
      return { eyebrow: "CAPTURE READY", title: "YOUR INPUT", tone: "idle" };
  }
};

export const FighterStage = ({
  move,
  evaluation,
  pulse,
  heldDirection,
  heldButtons,
  side,
  enabled,
  onToggleEnabled,
  onClear,
}: FighterStageProps) => {
  const verdict = verdictCopy(evaluation);

  return (
    <section className={`fighter-stage stage-${verdict.tone}`} aria-label="2D execution visualizer">
      <div className="stage-topline">
        <div className="health-cluster">
          <span>KAZUYA</span>
          <div className="health-track"><span /></div>
        </div>
        <div className="stage-timer">∞</div>
        <div className="health-cluster dummy-health">
          <span>FRAME DUMMY</span>
          <div className="health-track"><span /></div>
        </div>
      </div>

      <div className="stage-actions">
        <button className={`capture-toggle${enabled ? " is-on" : ""}`} type="button" onClick={onToggleEnabled}>
          <Radio size={14} /> {enabled ? "INPUT LIVE" : "INPUT PAUSED"}
        </button>
        <button className="icon-text-button" type="button" onClick={onClear} title="Clear input history (Backspace)">
          <RotateCcw size={14} /> Clear
        </button>
      </div>

      <div className="stage-world">
        <div className="stage-horizon" />
        <div className="stage-floor" />
        <div className="stage-marker marker-left">P1</div>
        <div className="stage-marker marker-right">DUMMY</div>

        <div className={`fighter-wrap fighter-${side === "P1" ? "left" : "right"}`}>
          <div className={`fighter-figure kazuya-figure anim-${move.animation}`} key={`${move.id}-${pulse}`}>
            <span className="fighter-shadow" />
            <span className="fighter-head"><i /></span>
            <span className="fighter-torso" />
            <span className="fighter-arm arm-front" />
            <span className="fighter-arm arm-back" />
            <span className="fighter-leg leg-front" />
            <span className="fighter-leg leg-back" />
            <span className="electric-burst" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, index) => <i key={index} />)}
            </span>
          </div>
          <span className="fighter-nameplate">KAZUYA</span>
        </div>

        <div className="fighter-wrap fighter-right">
          <div className={`fighter-figure dummy-figure${evaluation.status === "success" ? " is-hit" : ""}`} key={`dummy-${pulse}`}>
            <span className="fighter-shadow" />
            <span className="fighter-head" />
            <span className="fighter-torso" />
            <span className="fighter-arm arm-front" />
            <span className="fighter-arm arm-back" />
            <span className="fighter-leg leg-front" />
            <span className="fighter-leg leg-back" />
          </div>
          <span className="fighter-nameplate">STAND / GUARD</span>
        </div>

        <div className={`verdict verdict-${verdict.tone}`}>
          <span>{verdict.eyebrow}</span>
          <strong>{verdict.title}</strong>
          <p>{evaluation.reason}</p>
        </div>
      </div>

      <div className="live-input-bar">
        <div className="live-direction">
          <span className="input-label">HELD</span>
          <strong>{directionLabel[heldDirection]}</strong>
          <small>{heldDirection.toUpperCase()}</small>
        </div>
        <div className="live-buttons">
          {(["1", "2", "3", "4"] as AttackButton[]).map((button) => (
            <span
              className={`live-button button-${buttonColor[button]}${heldButtons.includes(button) ? " is-held" : ""}`}
              key={button}
            >
              {button}
            </span>
          ))}
        </div>
        <div className="polling-note"><i /> 60 Hz frame model</div>
      </div>
    </section>
  );
};

