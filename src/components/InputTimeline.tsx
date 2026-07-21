import { Clock3, ScanLine } from "lucide-react";
import type { InputToken } from "../domain/types";
import { FRAME_MS, formatInputToken } from "../domain/input-engine";

interface InputTimelineProps {
  tokens: InputToken[];
  strict: boolean;
}

export const InputTimeline = ({ tokens, strict }: InputTimelineProps) => {
  const visibleTokens = tokens.slice(-12);
  return (
    <section className="panel input-microscope">
      <div className="panel-heading">
        <div>
          <span className="section-kicker"><ScanLine size={13} /> Input microscope</span>
          <h3>Frame-by-frame history</h3>
        </div>
        <span className="frame-window"><Clock3 size={12} /> {strict ? "1F grade" : "2F capture"}</span>
      </div>

      {visibleTokens.length === 0 ? (
        <div className="timeline-empty">
          <span>W</span><span>A</span><span>S</span><span>D</span>
          <p>Direction transitions and attack presses will appear here.</p>
        </div>
      ) : (
        <div className="timeline-scroll" aria-label="Input history">
          {visibleTokens.map((token, index) => {
            const previous = visibleTokens[index - 1];
            const gap = previous ? Math.max(0, Math.round((token.at - previous.at) / FRAME_MS)) : 0;
            return (
              <div className="timeline-item" key={token.id}>
                {index > 0 && <span className={`timeline-gap${gap <= 1 ? " is-tight" : ""}`}>{gap}f</span>}
                <div className={`input-token${token.buttons.length ? " has-attack" : ""}`}>
                  <strong>{formatInputToken(token)}</strong>
                  <small>F{token.frame}</small>
                  {(token.chordSpreadMs ?? token.simultaneousMs) !== undefined && token.buttons.length > 0 && (
                    <em>{((token.chordSpreadMs ?? token.simultaneousMs ?? 0) / FRAME_MS).toFixed(1)}f sync</em>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
