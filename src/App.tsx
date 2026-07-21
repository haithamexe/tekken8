import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Gauge,
  Keyboard,
  RotateCcw,
  Search,
  Target,
  TimerReset,
  X,
  Zap,
} from "lucide-react";
import { CommandStrip } from "./components/CommandStrip";
import { InputTimeline } from "./components/InputTimeline";
import {
  DATA_VERSION,
  PUBLIC_KAZUYA_MOVES,
  filterKazuyaMoves,
  getMoveById,
} from "./data/kazuya";
import { detectMove, directionLabel, FRAME_MS } from "./domain/input-engine";
import type { LabStats } from "./domain/types";
import { useTekkenInput } from "./hooks/useTekkenInput";

const DEFAULT_STATS: LabStats = {
  attempts: 0,
  successes: 0,
  streak: 0,
  bestStreak: 0,
  moveSuccesses: {},
};

const loadStats = (): LabStats => {
  try {
    const saved = window.localStorage.getItem("mishima-lab-stats");
    return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) as LabStats } : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
};

const frameValue = (value: number | undefined) => value === undefined ? "—" : `${value.toFixed(1)}f`;

export default function App() {
  const [selectedMoveId, setSelectedMoveId] = useState("ewgf");
  const [query, setQuery] = useState("");
  const [side, setSide] = useState<"P1" | "P2">("P1");
  const [moveListOpen, setMoveListOpen] = useState(false);
  const [stats, setStats] = useState<LabStats>(loadStats);
  const settledTokenRef = useRef<number | null>(null);

  const activeMove = getMoveById(selectedMoveId);
  const combatState = activeMove.state ?? "neutral";
  const filteredMoves = useMemo(
    () => filterKazuyaMoves(PUBLIC_KAZUYA_MOVES, query, "All"),
    [query],
  );
  const { tokens, heldDirection, heldButtons, clear } = useTekkenInput({
    side,
    strict: true,
    enabled: true,
  });
  const detection = useMemo(
    () => detectMove(activeMove, PUBLIC_KAZUYA_MOVES, tokens, FRAME_MS, combatState),
    [activeMove, combatState, tokens],
  );
  const evaluation = detection.targetEvaluation;
  const wrongMove = detection.detectedMove?.id !== activeMove.id
    ? detection.detectedMove
    : undefined;
  const latestAttack = [...tokens].reverse().find((token) => token.buttons.length > 0);
  const accuracy = stats.attempts === 0 ? 0 : Math.round((stats.successes / stats.attempts) * 100);

  useEffect(() => {
    window.localStorage.setItem("mishima-lab-stats", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (!latestAttack || settledTokenRef.current === latestAttack.id) return;
    const settledMiss = evaluation.status === "miss"
      && (evaluation.progress === 0 || evaluation.progress === evaluation.total);
    if (evaluation.status !== "success" && !settledMiss) return;

    settledTokenRef.current = latestAttack.id;
    setStats((current) => {
      const success = evaluation.status === "success";
      const nextStreak = success ? current.streak + 1 : 0;
      return {
        ...current,
        attempts: current.attempts + 1,
        successes: current.successes + (success ? 1 : 0),
        streak: nextStreak,
        bestStreak: Math.max(current.bestStreak, nextStreak),
        moveSuccesses: success
          ? {
              ...current.moveSuccesses,
              [activeMove.id]: (current.moveSuccesses[activeMove.id] ?? 0) + 1,
            }
          : current.moveSuccesses,
      };
    });
  }, [activeMove.id, evaluation, latestAttack]);

  const resetAttempt = () => {
    clear();
    settledTokenRef.current = null;
  };

  const selectMove = (id: string) => {
    setSelectedMoveId(id);
    setMoveListOpen(false);
    clear();
    settledTokenRef.current = null;
  };

  const status = evaluation.status === "success"
    ? "success"
    : wrongMove
      ? "wrong"
      : evaluation.status;
  const statusTitle = status === "success"
    ? "CLEAN"
    : status === "wrong"
      ? "WRONG MOVE"
      : status === "miss"
        ? "MISS"
        : status === "progress"
          ? `${evaluation.progress} / ${evaluation.total}`
          : "READY";
  const statusDetail = status === "success"
    ? `${activeMove.name} detected.`
    : wrongMove
      ? `${wrongMove.name} (${wrongMove.notation}) detected instead.`
      : evaluation.reason;
  const timingEvaluation = status === "wrong"
    ? detection.detectedEvaluation ?? evaluation
    : evaluation;

  return (
    <div className="trainer-shell">
      <header className="trainer-header">
        <div className="trainer-brand">
          <span><Zap size={17} /></span>
          <div><strong>MISHIMA LAB</strong><small>input trainer</small></div>
        </div>
        <div className="listener-status"><i /> Direct keyboard listener · 60 Hz timing</div>
        <button
          className="side-button"
          type="button"
          onClick={() => {
            setSide((current) => current === "P1" ? "P2" : "P1");
            resetAttempt();
          }}
        >
          {side}<small>{side === "P1" ? "facing right" : "facing left"}</small>
        </button>
      </header>

      <main className="trainer-layout">
        <aside className={`move-picker${moveListOpen ? " is-open" : ""}`}>
          <div className="picker-heading">
            <div><span>MOVES</span><strong>Kazuya Mishima</strong></div>
            <button type="button" onClick={() => setMoveListOpen(false)} aria-label="Close move list"><X size={17} /></button>
          </div>
          <label className="move-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or notation"
            />
          </label>
          <div className="move-list">
            {filteredMoves.map((move) => (
              <button
                className={move.id === activeMove.id ? "is-active" : ""}
                type="button"
                onClick={() => selectMove(move.id)}
                key={move.id}
              >
                <span><strong>{move.name}</strong><code>{move.notation}</code></span>
                <small>{move.frames.startup}</small>
              </button>
            ))}
            {filteredMoves.length === 0 && <p>No named move matches that search.</p>}
          </div>
          <div className="roster-note">
            <Check size={14} />
            <span><strong>{PUBLIC_KAZUYA_MOVES.length} named moves</strong>No generated “Kazuya + number” labels.</span>
          </div>
        </aside>

        <section className="practice-column">
          <header className="target-card">
            <div className="target-line">
              <div>
                <span className="eyebrow"><Target size={13} /> TARGET</span>
                <h1>{activeMove.name}</h1>
                <p>{activeMove.notation}</p>
              </div>
              <div className="target-actions">
                {activeMove.state && <span className="state-badge">{activeMove.state}</span>}
                <button className="choose-move-button" type="button" onClick={() => setMoveListOpen((open) => !open)}>
                  Choose move <ChevronDown size={14} />
                </button>
                <button type="button" onClick={resetAttempt}><RotateCcw size={14} /> Clear</button>
              </div>
            </div>
            <CommandStrip move={activeMove} progress={evaluation.progress} />
          </header>

          <section className={`execution-result status-${status}`} aria-live="polite">
            <div className="result-mark">{status === "success" ? <Check size={30} /> : status === "wrong" || status === "miss" ? <X size={30} /> : <Zap size={27} />}</div>
            <div className="result-copy">
              <span>{statusTitle}</span>
              <strong>{statusDetail}</strong>
              {status === "wrong" && <small>{evaluation.reason}</small>}
            </div>
            <div className="timing-readout">
              <div><small>MOTION</small><strong>{frameValue(timingEvaluation.executionFrames)}</strong></div>
              <div><small>SYNC</small><strong>{frameValue(evaluation.precisionFrames)}</strong></div>
              <div><small>STARTUP</small><strong>{activeMove.frames.startup}</strong></div>
            </div>
          </section>

          <div className="live-input-bar">
            <div><span>LIVE DIRECTION</span><strong>{directionLabel[heldDirection]}</strong></div>
            <div><span>HELD BUTTONS</span><strong>{heldButtons.length ? heldButtons.join("+") : "—"}</strong></div>
            <p>WASD movement · U/I/J/K = 1/2/3/4 · Backspace clears</p>
          </div>

          <InputTimeline tokens={tokens} strict />

          <section className="keyboard-legend">
            <div className="legend-title"><Keyboard size={15} /><span><strong>Keys</strong><small>Inputs are read from physical key codes.</small></span></div>
            <div className="key-groups">
              <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><small>movement</small></span>
              <span><kbd>U</kbd><b>1</b><kbd>I</kbd><b>2</b><kbd>J</kbd><b>3</b><kbd>K</kbd><b>4</b></span>
            </div>
          </section>
        </section>

        <aside className="facts-column">
          <section className="fact-panel">
            <div className="panel-title"><Gauge size={15} /><strong>Frame data</strong><small>{DATA_VERSION}</small></div>
            <div className="frame-facts">
              <div><span>STARTUP</span><strong>{activeMove.frames.startup}</strong></div>
              <div><span>ON BLOCK</span><strong>{activeMove.frames.onBlock}</strong></div>
              <div><span>ON HIT</span><strong>{activeMove.frames.onHit}</strong></div>
              <div><span>DAMAGE</span><strong>{activeMove.frames.damage}</strong></div>
            </div>
            <p>{activeMove.frames.hitLevel} · {activeMove.tags.join(" · ")}</p>
          </section>

          <section className="fact-panel coach-copy">
            <div className="panel-title"><TimerReset size={15} /><strong>Execution</strong></div>
            <p>{activeMove.coach}</p>
            {activeMove.notes && <small>{activeMove.notes}</small>}
          </section>

          <section className="fact-panel stats-panel-simple">
            <div className="panel-title"><Zap size={15} /><strong>Session</strong></div>
            <div>
              <span><strong>{accuracy}%</strong><small>accuracy</small></span>
              <span><strong>{stats.streak}</strong><small>streak</small></span>
              <span><strong>{stats.moveSuccesses[activeMove.id] ?? 0}</strong><small>clean</small></span>
            </div>
            <button type="button" onClick={() => setStats(DEFAULT_STATS)}>Reset stats</button>
          </section>

          <p className="scope-note">This checks command order and browser-event timing. It does not simulate hitboxes, range, walls, or an opponent.</p>
        </aside>
      </main>
    </div>
  );
}
