import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Crosshair,
  Database,
  ExternalLink,
  Flame,
  Gauge,
  Keyboard,
  LibraryBig,
  LockKeyhole,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { CommandStrip } from "./components/CommandStrip";
import { FighterStage } from "./components/FighterStage";
import { InputTimeline } from "./components/InputTimeline";
import {
  DATA_CHECKED_AT,
  DATA_SOURCES,
  DATA_VERSION,
  KAZUYA_DRILLS,
  PUBLIC_KAZUYA_MOVES,
  filterKazuyaMoves,
  getMoveById,
} from "./data/kazuya";
import type {
  AttackButton,
  CombatState,
  DrillDefinition,
  Evaluation,
  LabStats,
  MoveCategory,
  MoveDefinition,
} from "./domain/types";
import { evaluateMove, FRAME_MS, numericAdvantage } from "./domain/input-engine";
import { useTekkenInput } from "./hooks/useTekkenInput";

type AppView = "train" | "library" | "guide";
type TrainingMode = "move" | "drill";
type Outcome = "block" | "hit" | "counter";

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

const categories: Array<"All" | MoveCategory> = [
  "All",
  "Core",
  "Punish",
  "Crouch dash",
  "Launch",
  "Heat",
  "Defense",
];

const difficultyClass = (difficulty: MoveDefinition["difficulty"]) =>
  difficulty === "Just frame" ? "danger" : difficulty === "Advanced" ? "advanced" : "normal";

const getAdvantageLabel = (advantage: number | null) => {
  if (advantage === null) return { label: "Special state", tone: "neutral", detail: "See move notes" };
  if (advantage >= 1) return { label: "Kazuya acts first", tone: "positive", detail: `${advantage} frame${advantage === 1 ? "" : "s"} ahead` };
  if (advantage <= -10) return { label: "Punishable", tone: "negative", detail: `${Math.abs(advantage)} frames behind` };
  if (advantage < 0) return { label: "Opponent acts first", tone: "warning", detail: `${Math.abs(advantage)} frames behind` };
  return { label: "Frame neutral", tone: "neutral", detail: "Both recover together" };
};

const KeyboardMap = ({ heldButtons = [] }: { heldButtons?: AttackButton[] }) => (
  <div className="keyboard-map">
    <div className="keyboard-directions">
      <span className="key key-w"><kbd>W</kbd><small>up</small></span>
      <span className="key key-a"><kbd>A</kbd><small>back</small></span>
      <span className="key key-s"><kbd>S</kbd><small>down</small></span>
      <span className="key key-d"><kbd>D</kbd><small>forward</small></span>
    </div>
    <div className="keyboard-attacks">
      {([
        ["U", "1", "LP"],
        ["I", "2", "RP"],
        ["J", "3", "LK"],
        ["K", "4", "RK"],
      ] as const).map(([key, button, limb]) => (
        <span className={`key attack-key attack-${button}${heldButtons.includes(button) ? " is-held" : ""}`} key={key}>
          <kbd>{key}</kbd><strong>{button}</strong><small>{limb}</small>
        </span>
      ))}
    </div>
  </div>
);

interface FrameTruthProps {
  move: MoveDefinition;
  outcome: Outcome;
  onOutcomeChange: (outcome: Outcome) => void;
}

const FrameTruth = ({ move, outcome, onOutcomeChange }: FrameTruthProps) => {
  const outcomeValue = outcome === "block"
    ? move.frames.onBlock
    : outcome === "counter"
      ? move.frames.onCounter ?? move.frames.onHit
      : move.frames.onHit;
  const advantage = numericAdvantage(outcomeValue);
  const read = getAdvantageLabel(advantage);
  const meterWidth = advantage === null ? 4 : Math.min(50, Math.max(4, Math.abs(advantage) * 3));

  return (
    <section className="panel frame-truth">
      <div className="panel-heading">
        <div>
          <span className="section-kicker"><Gauge size={13} /> Frame truth</span>
          <h3>What happens next?</h3>
        </div>
        <span className="data-stamp">v3.01</span>
      </div>

      <div className="outcome-tabs" role="tablist" aria-label="Move outcome">
        {(["block", "hit", "counter"] as Outcome[]).map((value) => (
          <button
            className={outcome === value ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={outcome === value}
            onClick={() => onOutcomeChange(value)}
            key={value}
          >
            {value === "counter" ? "Counter hit" : value}
          </button>
        ))}
      </div>

      <div className={`advantage-readout tone-${read.tone}`}>
        <span>{outcomeValue}</span>
        <div><strong>{read.label}</strong><small>{read.detail}</small></div>
      </div>
      <div className="advantage-meter" aria-hidden="true">
        <span className="meter-opponent" style={{ width: advantage !== null && advantage < 0 ? `${meterWidth}%` : "0%" }} />
        <i />
        <span className="meter-kazuya" style={{ width: advantage !== null && advantage > 0 ? `${meterWidth}%` : "0%" }} />
      </div>
      <div className="meter-labels"><span>Opponent</span><span>0</span><span>Kazuya</span></div>

      <div className="frame-grid">
        <div><small>STARTUP</small><strong>{move.frames.startup}</strong></div>
        <div><small>ON BLOCK</small><strong>{move.frames.onBlock}</strong></div>
        <div><small>ON HIT</small><strong>{move.frames.onHit}</strong></div>
        <div><small>DAMAGE</small><strong>{move.frames.damage}</strong></div>
      </div>
      <p className="frame-footnote">a = airborne · c = crouching · g = guardable recovery · i = impact frame</p>
    </section>
  );
};

const StatsPanel = ({ stats, move }: { stats: LabStats; move: MoveDefinition }) => {
  const accuracy = stats.attempts > 0 ? Math.round((stats.successes / stats.attempts) * 100) : 0;
  return (
    <section className="panel stats-panel">
      <div className="panel-heading compact-heading">
        <span className="section-kicker"><Trophy size={13} /> Local session</span>
        <small>saved in browser</small>
      </div>
      <div className="stats-grid">
        <div><strong>{accuracy}%</strong><small>accuracy</small></div>
        <div><strong>{stats.streak}</strong><small>streak</small></div>
        <div><strong>{stats.moveSuccesses[move.id] ?? 0}</strong><small>this move</small></div>
      </div>
    </section>
  );
};

interface MoveSidebarProps {
  mode: TrainingMode;
  onModeChange: (mode: TrainingMode) => void;
  selectedMoveId: string;
  onSelectMove: (id: string) => void;
  selectedDrillId: string;
  onSelectDrill: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  category: "All" | MoveCategory;
  onCategoryChange: (value: "All" | MoveCategory) => void;
}

const MoveSidebar = ({
  mode,
  onModeChange,
  selectedMoveId,
  onSelectMove,
  selectedDrillId,
  onSelectDrill,
  search,
  onSearchChange,
  category,
  onCategoryChange,
}: MoveSidebarProps) => {
  const filteredMoves = filterKazuyaMoves(PUBLIC_KAZUYA_MOVES, search, category);

  return (
    <aside className="move-sidebar">
      <div className="character-card">
        <div className="character-monogram"><span>K</span><Zap size={15} /></div>
        <div><small>ACTIVE ROSTER</small><strong>Kazuya Mishima</strong><span>Left-side stance · Mishima</span></div>
        <ChevronRight size={17} />
      </div>

      <div className="mode-switch">
        <button type="button" className={mode === "move" ? "is-active" : ""} onClick={() => onModeChange("move")}>
          <Target size={14} /> Moves
        </button>
        <button type="button" className={mode === "drill" ? "is-active" : ""} onClick={() => onModeChange("drill")}>
          <Sparkles size={14} /> Routes
        </button>
      </div>

      {mode === "move" ? (
        <>
          <label className="search-field">
            <Search size={15} />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Move or notation…" />
            <kbd>/</kbd>
          </label>
          <div className="category-scroll">
            {categories.map((value) => (
              <button type="button" className={category === value ? "is-active" : ""} onClick={() => onCategoryChange(value)} key={value}>
                {value}
              </button>
            ))}
          </div>
          <div className="sidebar-list" aria-label="Kazuya moves">
            {filteredMoves.map((move) => (
              <button
                type="button"
                className={`move-row${selectedMoveId === move.id ? " is-active" : ""}`}
                onClick={() => onSelectMove(move.id)}
                key={move.id}
              >
                <span className={`move-index difficulty-${difficultyClass(move.difficulty)}`}>{String(PUBLIC_KAZUYA_MOVES.indexOf(move) + 1).padStart(2, "0")}</span>
                <span className="move-row-copy"><strong>{move.name}</strong><code>{move.notation}</code></span>
                <span className="move-level">{move.difficulty === "Just frame" ? "1F" : move.category}</span>
              </button>
            ))}
            {filteredMoves.length === 0 && <p className="empty-list">No Kazuya move matches that filter.</p>}
          </div>
        </>
      ) : (
        <div className="sidebar-list drill-list" aria-label="Kazuya drills">
          {KAZUYA_DRILLS.map((drill, index) => (
            <button
              type="button"
              className={`drill-row${selectedDrillId === drill.id ? " is-active" : ""}`}
              onClick={() => onSelectDrill(drill.id)}
              key={drill.id}
            >
              <span className="drill-number">0{index + 1}</span>
              <span><small>{drill.type}</small><strong>{drill.name}</strong><code>{drill.notation}</code></span>
              <ChevronRight size={16} />
            </button>
          ))}
          <div className="route-note"><CircleHelp size={14} /><p>Routes validate commands in order. They do not simulate airborne timing, axis, walls, or pushback.</p></div>
        </div>
      )}

      <div className="roster-preview">
        <span><LockKeyhole size={13} /> ROSTER EXPANSION</span>
        <div><i>J</i><i>R</i><i>D</i><small>Other characters use the same data schema.</small></div>
      </div>
    </aside>
  );
};

const DrillProgress = ({ drill, segmentIndex, complete }: { drill: DrillDefinition; segmentIndex: number; complete: boolean }) => (
  <div className="drill-progress" aria-label={`Step ${segmentIndex + 1} of ${drill.segments.length}`}>
    {drill.segments.map((segment, index) => {
      const move = getMoveById(segment.moveId);
      return (
        <div className={`drill-node${index < segmentIndex || complete ? " is-done" : ""}${index === segmentIndex && !complete ? " is-active" : ""}`} key={`${segment.moveId}-${index}`}>
          <span>{index < segmentIndex || complete ? "✓" : index + 1}</span>
          <small>{segment.label ?? move.notation}</small>
        </div>
      );
    })}
  </div>
);

interface LibraryViewProps {
  onPractice: (id: string) => void;
}

const LibraryView = ({ onPractice }: LibraryViewProps) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | MoveCategory>("All");
  const moves = filterKazuyaMoves(PUBLIC_KAZUYA_MOVES, query, filter);

  return (
    <main className="page-view library-view">
      <div className="page-hero">
        <span className="section-kicker"><LibraryBig size={14} /> Kazuya database</span>
        <h1>Move library</h1>
        <p>{PUBLIC_KAZUYA_MOVES.length} keyboard-trainable techniques with current frame references and execution notes.</p>
      </div>
      <div className="library-toolbar">
        <label className="search-field large-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, command, or property" /></label>
        <div className="category-scroll">
          {categories.map((value) => <button type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)} key={value}>{value}</button>)}
        </div>
        <span>{moves.length} results</span>
      </div>
      <div className="library-table" role="table">
        <div className="library-table-head" role="row">
          <span>Technique</span><span>Command</span><span>Frames</span><span>Properties</span><span />
        </div>
        {moves.map((move) => (
          <div className="library-row" role="row" key={move.id}>
            <div><small>{move.category}</small><strong>{move.name}</strong><em>{move.frames.hitLevel}</em></div>
            <div><CommandStrip move={move} compact /></div>
            <div className="library-frames"><span><small>i</small>{move.frames.startup.replace(/^i/, "")}</span><span><small>B</small>{move.frames.onBlock}</span><span><small>H</small>{move.frames.onHit}</span></div>
            <div className="property-list">{move.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
            <button className="practice-button" type="button" onClick={() => onPractice(move.id)}>Practice <ChevronRight size={14} /></button>
          </div>
        ))}
      </div>
    </main>
  );
};

interface GuideViewProps {
  strict: boolean;
  onStrictChange: (strict: boolean) => void;
  side: "P1" | "P2";
  onSideChange: (side: "P1" | "P2") => void;
  stats: LabStats;
  onResetStats: () => void;
}

const GuideView = ({ strict, onStrictChange, side, onSideChange, stats, onResetStats }: GuideViewProps) => (
  <main className="page-view guide-view">
    <div className="page-hero guide-hero">
      <span className="section-kicker"><BookOpen size={14} /> Lab manual</span>
      <h1>Train what the browser can measure.</h1>
      <p>Key order, neutral transitions, chords, and sub-frame timestamps are measured locally. Hitboxes, axis, wall distance, recovery animation, and combo connection still belong in Tekken 8.</p>
    </div>

    <div className="guide-grid">
      <section className="guide-card guide-controls">
        <span className="card-number">01</span><h2>Keyboard layout</h2>
        <p>Movement follows screen direction. On P2, forward and back invert automatically.</p>
        <KeyboardMap />
        <div className="side-choice"><span>PLAY SIDE</span><button type="button" className={side === "P1" ? "is-active" : ""} onClick={() => onSideChange("P1")}>P1 · facing right</button><button type="button" className={side === "P2" ? "is-active" : ""} onClick={() => onSideChange("P2")}>P2 · facing left</button></div>
      </section>

      <section className="guide-card">
        <span className="card-number">02</span><h2>Timing model</h2>
        <p>Tekken runs at 60 Hz, so one frame is {FRAME_MS.toFixed(2)} ms. Browser event timestamps are compared against that window.</p>
        <div className="timing-choice">
          <button type="button" className={strict ? "is-active" : ""} onClick={() => onStrictChange(true)}><strong>Strict · 1 frame</strong><small>{FRAME_MS.toFixed(2)} ms chord window · recommended</small></button>
          <button type="button" className={!strict ? "is-active" : ""} onClick={() => onStrictChange(false)}><strong>Laptop diagnosis · 2 frames</strong><small>{(FRAME_MS * 2).toFixed(2)} ms capture; the pass threshold stays 1F</small></button>
        </div>
        <div className="warning-note"><ShieldAlert size={17} /><p>Operating-system scheduling, wireless keyboards, and browser throttling can add latency. Strict mode measures the event stream it receives—not the game process.</p></div>
      </section>

      <section className="guide-card notation-guide">
        <span className="card-number">03</span><h2>Notation</h2>
        <dl>
          <div><dt>f / b</dt><dd>Forward / back, relative to play side</dd></div>
          <div><dt>n</dt><dd>Neutral: fully release the direction</dd></div>
          <div><dt>df</dt><dd>Down-forward diagonal</dd></div>
          <div><dt>1 · 2</dt><dd>Left punch · right punch</dd></div>
          <div><dt>3 · 4</dt><dd>Left kick · right kick</dd></div>
          <div><dt>+</dt><dd>Inputs held together</dd></div>
          <div><dt>:</dt><dd>Just frame; direction and button on the same frame</dd></div>
          <div><dt>i14</dt><dd>Impact/startup on frame 14</dd></div>
        </dl>
      </section>

      <section className="guide-card data-guide">
        <span className="card-number">04</span><h2>Data & scope</h2>
        <p><strong>{DATA_VERSION}</strong><br />Checked {DATA_CHECKED_AT}. Move facts are transcribed selectively, not scraped at runtime.</p>
        <div className="source-list">
          {DATA_SOURCES.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.label}<ExternalLink size={13} /></a>)}
        </div>
        <div className="warning-note official-warning"><Database size={17} /><p>Bandai Namco reports a v3.01.01 issue where some in-game Practice descriptions do not match actual properties. Re-check critical setups after the next patch.</p></div>
      </section>

      <section className="guide-card session-guide">
        <span className="card-number">05</span><h2>Your local record</h2>
        <div className="big-stats"><div><strong>{stats.successes}</strong><span>clean commands</span></div><div><strong>{stats.bestStreak}</strong><span>best streak</span></div><div><strong>{stats.attempts}</strong><span>settled attempts</span></div></div>
        <button className="secondary-button" type="button" onClick={onResetStats}>Reset local statistics</button>
      </section>

      <section className="guide-card legal-guide">
        <span className="card-number">06</span><h2>Independent practice tool</h2>
        <p>Mishima Lab is an unofficial educational input trainer. TEKKEN™8 and its characters are property of Bandai Namco Entertainment Inc. No game assets or game code are included.</p>
        <div className="shortcut-list"><span><kbd>Backspace</kbd> clear inputs</span><span><kbd>WASD</kbd> movement</span><span><kbd>U I J K</kbd> attacks 1–4</span></div>
      </section>
    </div>
  </main>
);

export default function App() {
  const [view, setView] = useState<AppView>("train");
  const [mode, setMode] = useState<TrainingMode>("move");
  const [selectedMoveId, setSelectedMoveId] = useState("ewgf");
  const [selectedDrillId, setSelectedDrillId] = useState(KAZUYA_DRILLS[0].id);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | MoveCategory>("All");
  const [strict, setStrict] = useState(true);
  const [side, setSide] = useState<"P1" | "P2">("P1");
  const [combatState, setCombatState] = useState<CombatState>("neutral");
  const [enabled, setEnabled] = useState(true);
  const [outcome, setOutcome] = useState<Outcome>("block");
  const [pulse, setPulse] = useState(0);
  const [stats, setStats] = useState<LabStats>(loadStats);
  const [drillComplete, setDrillComplete] = useState(false);
  const processedTokensRef = useRef(new Set<number>());
  const advanceTimerRef = useRef<number | null>(null);
  const pendingMissTimerRef = useRef<number | null>(null);

  const selectedDrill = KAZUYA_DRILLS.find((drill) => drill.id === selectedDrillId) ?? KAZUYA_DRILLS[0];
  const activeMove = mode === "move"
    ? getMoveById(selectedMoveId)
    : getMoveById(selectedDrill.segments[segmentIndex]?.moveId ?? selectedDrill.segments[0].moveId);

  const { tokens, heldDirection, heldButtons, clear } = useTekkenInput({ side, strict, enabled: enabled && view === "train" });
  const evaluation = useMemo(
    () => evaluateMove(activeMove, tokens, FRAME_MS, combatState),
    [activeMove, combatState, tokens],
  );

  const resetAttempt = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (pendingMissTimerRef.current !== null) {
      window.clearTimeout(pendingMissTimerRef.current);
      pendingMissTimerRef.current = null;
    }
    clear();
    processedTokensRef.current.clear();
    setSegmentIndex(0);
    setDrillComplete(false);
  };

  useEffect(() => {
    window.localStorage.setItem("mishima-lab-stats", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => () => {
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    if (pendingMissTimerRef.current !== null) window.clearTimeout(pendingMissTimerRef.current);
  }, []);

  useEffect(() => {
    if (pendingMissTimerRef.current !== null) {
      window.clearTimeout(pendingMissTimerRef.current);
      pendingMissTimerRef.current = null;
    }
    if (tokens.length === 0 || drillComplete) return;
    const completionToken = activeMove.steps.at(-1)?.buttons
      ? [...tokens].reverse().find((token) => token.buttons.length > 0)
      : tokens.at(-1);
    const lastAttackToken = [...tokens].reverse().find((token) => token.buttons.length > 0);

    if (evaluation.status === "success" && completionToken && !processedTokensRef.current.has(completionToken.id)) {
      processedTokensRef.current.add(completionToken.id);
      setPulse((value) => value + 1);
      setStats((previous) => ({
        ...previous,
        attempts: previous.attempts + 1,
        successes: previous.successes + 1,
        streak: previous.streak + 1,
        bestStreak: Math.max(previous.bestStreak, previous.streak + 1),
        moveSuccesses: {
          ...previous.moveSuccesses,
          [activeMove.id]: (previous.moveSuccesses[activeMove.id] ?? 0) + 1,
        },
      }));

      if (activeMove.id === "heat-burst" && mode === "drill") {
        setCombatState("heat");
      }

      if (mode === "drill") {
        if (segmentIndex >= selectedDrill.segments.length - 1) {
          setDrillComplete(true);
        } else if (advanceTimerRef.current === null) {
          advanceTimerRef.current = window.setTimeout(() => {
            setSegmentIndex((value) => value + 1);
            clear();
            advanceTimerRef.current = null;
          }, 620);
        }
      }
      return;
    }

    const settledMiss = evaluation.status === "miss"
      && lastAttackToken !== undefined
      && (evaluation.progress === 0 || evaluation.progress === evaluation.total);
    if (settledMiss && lastAttackToken && !processedTokensRef.current.has(lastAttackToken.id)) {
      const missTokenId = lastAttackToken.id;
      pendingMissTimerRef.current = window.setTimeout(() => {
        if (!processedTokensRef.current.has(missTokenId)) {
          processedTokensRef.current.add(missTokenId);
          setStats((previous) => ({ ...previous, attempts: previous.attempts + 1, streak: 0 }));
        }
        pendingMissTimerRef.current = null;
      }, 180);
    }
  }, [activeMove, clear, drillComplete, evaluation, mode, segmentIndex, selectedDrill.segments.length, tokens]);

  const selectMove = (id: string) => {
    setMode("move");
    setSelectedMoveId(id);
    setOutcome("block");
    setCombatState("neutral");
    resetAttempt();
  };

  const selectDrill = (id: string) => {
    setMode("drill");
    setSelectedDrillId(id);
    setOutcome("block");
    setCombatState("neutral");
    resetAttempt();
  };

  const changeMode = (nextMode: TrainingMode) => {
    setMode(nextMode);
    setCombatState("neutral");
    resetAttempt();
  };

  const changeCombatState = (nextState: CombatState) => {
    setCombatState(nextState);
    clear();
    processedTokensRef.current.clear();
  };

  const practiceFromLibrary = (id: string) => {
    selectMove(id);
    setView("train");
  };

  const displayedEvaluation: Evaluation = drillComplete
    ? { status: "success", progress: activeMove.steps.length, total: activeMove.steps.length, reason: "Route complete. Every command was accepted in order." }
    : evaluation;

  const moveNumber = PUBLIC_KAZUYA_MOVES.findIndex((move) => move.id === activeMove.id) + 1;

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={() => setView("train")} aria-label="Mishima Lab home">
          <span className="brand-mark"><Zap size={17} /></span>
          <span><strong>MISHIMA</strong><em>LAB // 8</em></span>
        </button>
        <nav className="primary-nav" aria-label="Primary navigation">
          <button type="button" className={view === "train" ? "is-active" : ""} onClick={() => setView("train")}><Crosshair size={15} /> Train</button>
          <button type="button" className={view === "library" ? "is-active" : ""} onClick={() => setView("library")}><LibraryBig size={15} /> Library</button>
          <button type="button" className={view === "guide" ? "is-active" : ""} onClick={() => setView("guide")}><BookOpen size={15} /> Manual</button>
        </nav>
        <div className="header-status">
          <span className="patch-status"><i /> {DATA_VERSION}</span>
          <button className="side-toggle" type="button" onClick={() => setSide((current) => current === "P1" ? "P2" : "P1")} title="Switch play side">{side}<small>side</small></button>
          <button className="header-icon-button" type="button" onClick={() => setView("guide")} title="Lab settings"><Settings2 size={17} /></button>
        </div>
      </header>

      {view === "train" && (
        <main className="train-layout">
          <MoveSidebar
            mode={mode}
            onModeChange={changeMode}
            selectedMoveId={selectedMoveId}
            onSelectMove={selectMove}
            selectedDrillId={selectedDrillId}
            onSelectDrill={selectDrill}
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
          />

          <div className="lab-workspace">
            <div className="execution-column">
              <section className="target-header">
                <div className="target-meta">
                  <span>{mode === "move" ? `MOVE ${String(moveNumber).padStart(2, "0")} / ${PUBLIC_KAZUYA_MOVES.length}` : `${selectedDrill.type.toUpperCase()} · STEP ${segmentIndex + 1}/${selectedDrill.segments.length}`}</span>
                  <div className="target-controls">
                    <div className="target-tags"><i>{activeMove.frames.hitLevel}</i>{activeMove.tags.slice(0, 2).map((tag) => <i key={tag}>{tag}</i>)}</div>
                    <div className="combat-state-switch" aria-label="Lab combat state">
                      {(["neutral", "heat", "rage"] as CombatState[]).map((state) => (
                        <button
                          type="button"
                          className={`${combatState === state ? "is-active" : ""}${activeMove.state === state ? " is-required" : ""}`}
                          onClick={() => changeCombatState(state)}
                          key={state}
                        >
                          {state === "neutral" ? "N" : state === "heat" ? "H" : "R"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="target-title-row">
                  <div><h1>{activeMove.name}</h1><p>{mode === "drill" ? selectedDrill.summary : activeMove.summary}</p></div>
                  <span className={`difficulty-badge difficulty-${difficultyClass(activeMove.difficulty)}`}><Activity size={13} /> {activeMove.difficulty}</span>
                </div>
                <CommandStrip move={activeMove} progress={displayedEvaluation.progress} />
                {mode === "drill" && <DrillProgress drill={selectedDrill} segmentIndex={segmentIndex} complete={drillComplete} />}
              </section>

              <FighterStage
                move={activeMove}
                evaluation={displayedEvaluation}
                pulse={pulse}
                heldDirection={heldDirection}
                heldButtons={heldButtons}
                side={side}
                enabled={enabled}
                onToggleEnabled={() => setEnabled((value) => !value)}
                onClear={resetAttempt}
              />
              <InputTimeline tokens={tokens} strict={strict} />

              <section className="keyboard-dock">
                <div className="keyboard-dock-copy"><span className="section-kicker"><Keyboard size={13} /> Keyboard map</span><p>Click outside text fields, then play. <kbd>Backspace</kbd> clears.</p></div>
                <KeyboardMap heldButtons={heldButtons} />
                <div className={`latency-mode${strict ? " is-strict" : ""}`}><span>{strict ? "1F" : "2F"}</span><small>{strict ? "strict grade" : "diagnostic capture"}</small></div>
              </section>
            </div>

            <aside className="intel-column">
              <FrameTruth move={activeMove} outcome={outcome} onOutcomeChange={setOutcome} />
              <section className="panel coach-panel">
                <div className="panel-heading compact-heading"><span className="section-kicker"><Zap size={13} /> Execution coach</span><span className="coach-status">LIVE</span></div>
                <p>{activeMove.coach}</p>
                {activeMove.notes && <div className="technical-note"><strong>FRAME NOTE</strong>{activeMove.notes}</div>}
                {activeMove.state && <div className="state-note"><Flame size={15} /><span><strong>{activeMove.state.toUpperCase()} state required in-game</strong>The keyboard command can still be drilled here.</span></div>}
                <a href={`https://tekkendocs.com/t8/kazuya/${activeMove.sourcePath ?? ""}`} target="_blank" rel="noreferrer">Open source frame entry <ExternalLink size={13} /></a>
              </section>
              <StatsPanel stats={stats} move={activeMove} />
              <section className="scope-panel">
                <ShieldAlert size={16} />
                <p><strong>Command lab, not a game simulation.</strong> Exact input ordering and timing are checked. Connection, range, axis, and opponent state are reference-only.</p>
              </section>
            </aside>
          </div>
        </main>
      )}

      {view === "library" && <LibraryView onPractice={practiceFromLibrary} />}
      {view === "guide" && (
        <GuideView
          strict={strict}
          onStrictChange={setStrict}
          side={side}
          onSideChange={setSide}
          stats={stats}
          onResetStats={() => setStats(DEFAULT_STATS)}
        />
      )}
    </div>
  );
}
