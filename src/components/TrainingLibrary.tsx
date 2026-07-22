import { Check, GraduationCap, List, Route, Search, X } from "lucide-react";
import {
  KAZUYA_BEGINNER_APPROACHES,
  KAZUYA_COMBOS,
  PUBLIC_KAZUYA_MOVES,
  getMoveById,
} from "../data/kazuya";
import type { MoveDefinition } from "../domain/types";

export type LibraryView = "moves" | "combos" | "path";

interface TrainingLibraryProps {
  activeMoveId: string;
  filteredMoves: MoveDefinition[];
  isOpen: boolean;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelectApproach: (id: string) => void;
  onSelectCombo: (id: string) => void;
  onSelectMove: (id: string) => void;
  onViewChange: (view: LibraryView) => void;
  query: string;
  selectedApproachId: string;
  selectedComboId: string;
  view: LibraryView;
}

const includesQuery = (value: string, query: string) => (
  value.toLowerCase().includes(query.trim().toLowerCase())
);

export const TrainingLibrary = ({
  activeMoveId,
  filteredMoves,
  isOpen,
  onClose,
  onQueryChange,
  onSelectApproach,
  onSelectCombo,
  onSelectMove,
  onViewChange,
  query,
  selectedApproachId,
  selectedComboId,
  view,
}: TrainingLibraryProps) => {
  const filteredCombos = KAZUYA_COMBOS.filter((combo) => includesQuery(
    `${combo.name} ${combo.notation} ${combo.starter} ${combo.difficulty}`,
    query,
  ));
  const filteredApproaches = KAZUYA_BEGINNER_APPROACHES.filter((approach) => includesQuery(
    `${approach.name} ${approach.goal} ${approach.why} ${getMoveById(approach.moveId).notation}`,
    query,
  ));
  const visibleCount = view === "moves"
    ? filteredMoves.length
    : view === "combos"
      ? filteredCombos.length
      : filteredApproaches.length;

  return (
    <aside className={`move-picker${isOpen ? " is-open" : ""}`}>
      <div className="picker-heading">
        <div><span>TRAINING LIBRARY</span><strong>Kazuya Mishima</strong></div>
        <button type="button" onClick={onClose} aria-label="Close training library"><X size={17} /></button>
      </div>

      <div className="library-tabs" role="tablist" aria-label="Training library sections">
        <button
          className={view === "moves" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={view === "moves"}
          onClick={() => onViewChange("moves")}
        >
          <List size={13} /> Moves
        </button>
        <button
          className={view === "combos" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={view === "combos"}
          onClick={() => onViewChange("combos")}
        >
          <Route size={13} /> Combos
        </button>
        <button
          className={view === "path" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={view === "path"}
          onClick={() => onViewChange("path")}
        >
          <GraduationCap size={13} /> Start
        </button>
      </div>

      <label className="move-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={view === "moves" ? "Name or notation" : view === "combos" ? "Starter or route" : "Goal or lesson"}
        />
      </label>

      <div className={`move-list library-list library-${view}`}>
        {view === "moves" && filteredMoves.map((move) => (
          <button
            className={move.id === activeMoveId ? "is-active" : ""}
            type="button"
            onClick={() => onSelectMove(move.id)}
            key={move.id}
          >
            <span><strong>{move.name}</strong><code>{move.notation}</code></span>
            <small>{move.frames.startup}</small>
          </button>
        ))}

        {view === "combos" && filteredCombos.map((combo) => (
          <button
            className={combo.id === selectedComboId ? "is-active" : ""}
            type="button"
            onClick={() => onSelectCombo(combo.id)}
            key={combo.id}
          >
            <b className="library-rank">{combo.rank}</b>
            <span><strong>{combo.name}</strong><code>{combo.starter} · {combo.difficulty}</code></span>
            <small>{combo.damage} dmg</small>
          </button>
        ))}

        {view === "path" && filteredApproaches.map((approach) => {
          const move = getMoveById(approach.moveId);
          return (
            <button
              className={approach.id === selectedApproachId ? "is-active" : ""}
              type="button"
              onClick={() => onSelectApproach(approach.id)}
              key={approach.id}
            >
              <b className="library-rank">{approach.rank}</b>
              <span><strong>{approach.name}</strong><code>{move.notation}</code></span>
              <small>step</small>
            </button>
          );
        })}

        {visibleCount === 0 && <p>No training item matches that search.</p>}
      </div>

      <div className="roster-note">
        <Check size={14} />
        <span>
          <strong>{view === "moves" ? `${PUBLIC_KAZUYA_MOVES.length} named moves` : view === "combos" ? "10 Season 3 routes" : "10-step starter path"}</strong>
          {view === "moves" ? "PEWGF, EWGF, and WGF are graded separately." : view === "combos" ? "Open a route to drill its named base commands." : "A practical order, not a tier list."}
        </span>
      </div>
    </aside>
  );
};
