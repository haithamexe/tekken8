import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Gauge,
  Keyboard,
  RotateCcw,
  Target,
  TimerReset,
  X,
  Zap,
} from "lucide-react";
import { BeginnerPathCard } from "./components/BeginnerPathCard";
import { ComboNavigator } from "./components/ComboNavigator";
import { CommandStrip } from "./components/CommandStrip";
import { InputTimeline } from "./components/InputTimeline";
import { TrainingLibrary } from "./components/TrainingLibrary";
import type { LibraryView } from "./components/TrainingLibrary";
import {
  DATA_CHECKED_AT,
  DATA_SOURCES,
  DATA_VERSION,
  KAZUYA_COMBOS,
  KAZUYA_MOVES,
  PUBLIC_KAZUYA_MOVES,
  filterKazuyaMoves,
  getBeginnerApproachById,
  getComboById,
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
  const [selectedMoveId, setSelectedMoveId] = useState("pewgf");
  const [selectedComboId, setSelectedComboId] = useState(KAZUYA_COMBOS[0].id);
  const [comboStepIndex, setComboStepIndex] = useState(0);
  const [selectedApproachId, setSelectedApproachId] = useState("map-crouch-dash");
  const [libraryView, setLibraryView] = useState<LibraryView>("moves");
  const [query, setQuery] = useState("");
  const [side, setSide] = useState<"P1" | "P2">("P1");
  const [moveListOpen, setMoveListOpen] = useState(false);
  const [stats, setStats] = useState<LabStats>(loadStats);
  const settledTokenRef = useRef<number | null>(null);

  const activeMove = getMoveById(selectedMoveId);
  const activeCombo = libraryView === "combos" ? getComboById(selectedComboId) : undefined;
  const activeApproach = libraryView === "path"
    ? getBeginnerApproachById(selectedApproachId)
    : undefined;
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
    () => detectMove(activeMove, KAZUYA_MOVES, tokens, FRAME_MS, combatState),
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

  const setActiveTrainingMove = (id: string) => {
    setSelectedMoveId(id);
    resetAttempt();
  };

  const selectMove = (id: string) => {
    setLibraryView("moves");
    setActiveTrainingMove(id);
    setMoveListOpen(false);
  };

  const selectComboStep = (index: number) => {
    const combo = getComboById(selectedComboId);
    const step = combo.steps[index];
    if (!step?.moveId) return;
    setComboStepIndex(index);
    setActiveTrainingMove(step.moveId);
  };

  const selectCombo = (id: string) => {
    const combo = getComboById(id);
    const firstTrainableIndex = combo.steps.findIndex((step) => step.moveId);
    setLibraryView("combos");
    setSelectedComboId(id);
    setComboStepIndex(firstTrainableIndex);
    if (firstTrainableIndex >= 0) setActiveTrainingMove(combo.steps[firstTrainableIndex].moveId!);
    setMoveListOpen(false);
  };

  const selectApproach = (id: string) => {
    const approach = getBeginnerApproachById(id);
    setLibraryView("path");
    setSelectedApproachId(id);
    setActiveTrainingMove(approach.moveId);
    setMoveListOpen(false);
  };

  const changeLibraryView = (view: LibraryView) => {
    setLibraryView(view);
    setQuery("");
    if (view === "moves") {
      if (activeMove.internal) setActiveTrainingMove("pewgf");
      return;
    }
    if (view === "combos") {
      const combo = getComboById(selectedComboId);
      const trainableIndex = combo.steps[comboStepIndex]?.moveId
        ? comboStepIndex
        : combo.steps.findIndex((step) => step.moveId);
      setComboStepIndex(trainableIndex);
      if (trainableIndex >= 0) setActiveTrainingMove(combo.steps[trainableIndex].moveId!);
      return;
    }
    setActiveTrainingMove(getBeginnerApproachById(selectedApproachId).moveId);
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
  const targetLabel = activeCombo
    ? `COMBO #${activeCombo.rank} · BASE DRILL ${comboStepIndex + 1}`
    : activeApproach
      ? `STARTER PATH · STEP ${activeApproach.rank}`
      : activeMove.id === "pewgf"
        ? "PRIMARY FOCUS · PERFECT ELECTRIC"
        : "TARGET";

  return (
    <div className="trainer-shell">
      <header className="trainer-header">
        <div className="trainer-brand">
          <span><Zap size={17} /></span>
          <div><strong>MISHIMA LAB</strong><small>Season 3 · PEWGF trainer</small></div>
        </div>
        <div className="listener-status"><i /> Direct keyboard listener · 60 Hz timing proxy</div>
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
        <TrainingLibrary
          activeMoveId={activeMove.id}
          filteredMoves={filteredMoves}
          isOpen={moveListOpen}
          onClose={() => setMoveListOpen(false)}
          onQueryChange={setQuery}
          onSelectApproach={selectApproach}
          onSelectCombo={selectCombo}
          onSelectMove={selectMove}
          onViewChange={changeLibraryView}
          query={query}
          selectedApproachId={selectedApproachId}
          selectedComboId={selectedComboId}
          view={libraryView}
        />

        <section className="practice-column">
          <header className="target-card">
            <div className="target-line">
              <div>
                <span className="eyebrow"><Target size={13} /> {targetLabel}</span>
                <h1>{activeMove.name}</h1>
                <p>{activeMove.notation}</p>
              </div>
              <div className="target-actions">
                {activeMove.state && <span className="state-badge">{activeMove.state}</span>}
                <button className="choose-move-button" type="button" onClick={() => setMoveListOpen((open) => !open)}>
                  Library <ChevronDown size={14} />
                </button>
                <button type="button" onClick={resetAttempt}><RotateCcw size={14} /> Clear</button>
              </div>
            </div>
            <CommandStrip move={activeMove} progress={evaluation.progress} />
          </header>

          {activeCombo && (
            <ComboNavigator
              activeStepIndex={comboStepIndex}
              combo={activeCombo}
              onSelectStep={selectComboStep}
            />
          )}
          {activeApproach && <BeginnerPathCard approach={activeApproach} />}

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
          {activeMove.id === "pewgf" && (
            <section className="fact-panel pewgf-recipe">
              <div className="panel-title"><Zap size={15} /><strong>PEWGF · exact route</strong><small>i13 target</small></div>
              <div className="recipe-frames">
                <span><small>INPUT 1</small><strong>f</strong><em>forward</em></span>
                <i>›</i>
                <span><small>INPUT 2</small><strong>n</strong><em>≤ 1 frame</em></span>
                <i>›</i>
                <span><small>INPUT 3</small><strong>df:2</strong><em>same frame</em></span>
              </div>
              <p><strong>Skip down.</strong> A separate <code>d</code> produces the ordinary i14 EWGF route. A late <code>2</code> produces WGF.</p>
              <small>Browser grade: both transitions must be within 1F and df/2 must sync within 1F. Confirm a true i13 result in Tekken with a 13f punish or the CH df+2 pickup.</small>
            </section>
          )}

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
            <small>{activeMove.summary}{activeMove.notes ? ` ${activeMove.notes}` : ""}</small>
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

          <section className="fact-panel sources-panel">
            <div className="panel-title"><ExternalLink size={15} /><strong>Checked sources</strong><small>{DATA_CHECKED_AT}</small></div>
            <div>
              {DATA_SOURCES.map((source) => (
                <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.label}<ExternalLink size={10} /></a>
              ))}
            </div>
          </section>

          <p className="scope-note">This checks command order and browser-event timing. It cannot prove Tekken's sampled frame, hitbox, range, axis, wall, or juggle state.</p>
        </aside>
      </main>
    </div>
  );
}
