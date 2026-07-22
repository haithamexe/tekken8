import { ArrowLeft, ArrowRight, ExternalLink, Route } from "lucide-react";
import { getMoveById } from "../data/kazuya";
import type { ComboDefinition } from "../domain/types";

interface ComboNavigatorProps {
  activeStepIndex: number;
  combo: ComboDefinition;
  onSelectStep: (index: number) => void;
}

export const ComboNavigator = ({ activeStepIndex, combo, onSelectStep }: ComboNavigatorProps) => {
  const trainableIndexes = combo.steps
    .map((step, index) => step.moveId ? index : -1)
    .filter((index) => index >= 0);
  const activeTrainableIndex = trainableIndexes.indexOf(activeStepIndex);
  const previousIndex = trainableIndexes[activeTrainableIndex - 1];
  const nextIndex = trainableIndexes[activeTrainableIndex + 1];

  return (
    <section className="combo-navigator">
      <header>
        <div>
          <span className="section-kicker"><Route size={13} /> Combo #{combo.rank}</span>
          <h2>{combo.name}</h2>
          <code>{combo.notation}</code>
        </div>
        <div className="combo-meta">
          <strong>{combo.damage}</strong><small>damage</small>
          <span>{combo.difficulty}</span>
        </div>
      </header>

      <div className="combo-step-list" aria-label={`${combo.name} command list`}>
        {combo.steps.map((step, index) => {
          const practiceMove = step.moveId ? getMoveById(step.moveId) : undefined;
          return (
            <button
              className={index === activeStepIndex ? "is-active" : ""}
              type="button"
              disabled={!practiceMove}
              onClick={() => onSelectStep(index)}
              key={`${combo.id}-${step.notation}-${index}`}
              title={practiceMove
                ? `Open base-command drill: ${practiceMove.notation}`
                : `${step.notation} is a route cue, not a standalone drill`}
            >
              <small>{index + 1} · {step.label}</small>
              <strong>{step.notation}</strong>
              {step.cue && <em>{step.cue}</em>}
            </button>
          );
        })}
      </div>

      <footer>
        <p>
          <strong>{combo.context}</strong>{combo.summary}
          <small>Route cues stay visible; linked drills grade the base command only, not dash, Heat/CH, or juggle state.</small>
        </p>
        <div>
          <button type="button" disabled={previousIndex === undefined} onClick={() => onSelectStep(previousIndex)} aria-label="Previous trainable command"><ArrowLeft size={14} /></button>
          <span>{activeTrainableIndex + 1} / {trainableIndexes.length} base drills</span>
          <button type="button" disabled={nextIndex === undefined} onClick={() => onSelectStep(nextIndex)} aria-label="Next trainable command"><ArrowRight size={14} /></button>
          <a href={combo.sourceUrl} target="_blank" rel="noreferrer">{combo.sourceVersion}<ExternalLink size={11} /></a>
        </div>
      </footer>
    </section>
  );
};
