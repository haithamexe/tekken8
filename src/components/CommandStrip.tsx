import { Link2 } from "lucide-react";
import type { CommandStep, MoveDefinition } from "../domain/types";
import { buttonColor, directionLabel } from "../domain/input-engine";

interface StepGlyphProps {
  step: CommandStep;
  active?: boolean;
  done?: boolean;
  compact?: boolean;
}

export const StepGlyph = ({ step, active = false, done = false, compact = false }: StepGlyphProps) => (
  <span
    className={`command-step${active ? " is-active" : ""}${done ? " is-done" : ""}${compact ? " is-compact" : ""}`}
    title={step.justFrame ? `${step.label}: same-frame input required` : step.label}
  >
    {step.direction !== undefined && (
      <span className={`direction-glyph direction-${step.direction}`}>
        {directionLabel[step.direction]}
      </span>
    )}
    {step.direction !== undefined && step.buttons && <span className="command-join">{step.justFrame ? ":" : "+"}</span>}
    {step.buttons?.map((button, index) => (
      <span className="button-glyph-wrap" key={`${button}-${index}`}>
        {index > 0 && <span className="command-join">+</span>}
        <span className={`button-glyph button-${buttonColor[button]}`}>{button}</span>
      </span>
    ))}
    {step.justFrame && <Link2 className="just-frame-mark" aria-label="Same-frame input" size={11} />}
  </span>
);

interface CommandStripProps {
  move: MoveDefinition;
  progress?: number;
  compact?: boolean;
}

export const CommandStrip = ({ move, progress = 0, compact = false }: CommandStripProps) => (
  <div className={`command-strip${compact ? " is-compact" : ""}`} aria-label={move.notation}>
    {move.steps.map((step, index) => (
      <span className="command-part" key={`${move.id}-${index}`}>
        {index > 0 && <span className="command-separator">›</span>}
        <StepGlyph
          step={step}
          done={index < progress}
          active={index === progress}
          compact={compact}
        />
      </span>
    ))}
  </div>
);

