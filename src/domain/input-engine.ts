import type {
  AttackButton,
  CombatState,
  CommandStep,
  Direction,
  Evaluation,
  InputToken,
  MoveDefinition,
} from "./types";

export const FRAME_MS = 1000 / 60;

export const directionLabel: Record<Direction, string> = {
  n: "•",
  f: "→",
  b: "←",
  u: "↑",
  d: "↓",
  df: "↘",
  db: "↙",
  uf: "↗",
  ub: "↖",
};

export const buttonColor: Record<AttackButton, string> = {
  "1": "cyan",
  "2": "amber",
  "3": "magenta",
  "4": "lime",
};

const sameButtons = (actual: AttackButton[], expected: AttackButton[]) => {
  if (actual.length !== expected.length) return false;
  return [...actual].sort().every((button, index) => button === [...expected].sort()[index]);
};

export const tokenMatchesStep = (token: InputToken, step: CommandStep) => {
  if (step.direction !== undefined && token.direction !== step.direction) return false;
  if (step.buttons !== undefined && !sameButtons(token.buttons, step.buttons)) return false;
  if (step.buttons === undefined && token.buttons.length > 0) return false;
  return true;
};

const timingFailure = (
  steps: CommandStep[],
  tokens: InputToken[],
  oneFrameMs: number,
): { reason: string; precisionFrames?: number } | null => {
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const token = tokens[index];

    if (step.justFrame) {
      const spread = token.simultaneousMs ?? Number.POSITIVE_INFINITY;
      if (spread > oneFrameMs) {
        return {
          reason: `${step.label} was ${Math.max(1, Math.ceil(spread / FRAME_MS))} frames apart. It must land on one frame.`,
          precisionFrames: spread / FRAME_MS,
        };
      }
    }

    if (step.rejectSameFrame) {
      const spread = token.simultaneousMs ?? Number.POSITIVE_INFINITY;
      if (spread <= oneFrameMs) {
        return {
          reason: `${step.label} landed on the diagonal frame. Tekken would produce Electric Wind God Fist instead.`,
          precisionFrames: spread / FRAME_MS,
        };
      }
    }

    if (step.buttons && step.buttons.length > 1) {
      const chordSpread = token.chordSpreadMs ?? Number.POSITIVE_INFINITY;
      if (chordSpread > oneFrameMs) {
        return {
          reason: `${step.label} was ${Math.max(1, Math.ceil(chordSpread / FRAME_MS))} frames apart. The buttons must share one frame.`,
          precisionFrames: chordSpread / FRAME_MS,
        };
      }
    }

    if (index > 0 && step.maxGapFrames !== undefined) {
      const gap = (token.at - tokens[index - 1].at) / FRAME_MS;
      if (gap > step.maxGapFrames) {
        return {
          reason: `${step.label} arrived in ${Math.ceil(gap)}f; this window closes at ${step.maxGapFrames}f.`,
          precisionFrames: gap,
        };
      }
    }
  }

  return null;
};

export const evaluateMove = (
  move: MoveDefinition,
  tokens: InputToken[],
  oneFrameMs = FRAME_MS,
  combatState: CombatState = "neutral",
): Evaluation => {
  const { steps } = move;
  const commandEndsWithAttack = Boolean(steps.at(-1)?.buttons);
  let meaningfulLength = tokens.length;
  const hasAttackInput = tokens.some((token) => token.buttons.length > 0);
  if (commandEndsWithAttack && hasAttackInput) {
    let lastAttackIndex = -1;
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      if (tokens[index].buttons.length > 0) {
        lastAttackIndex = index;
        break;
      }
    }
    const nextAttemptTokens = tokens.slice(lastAttackIndex + 1);
    const nextAttemptUpperBound = Math.min(nextAttemptTokens.length, steps.length - 1);
    for (let length = nextAttemptUpperBound; length >= 1; length -= 1) {
      const suffix = nextAttemptTokens.slice(-length);
      const prefix = steps.slice(0, length);
      if (prefix.every((step, index) => tokenMatchesStep(suffix[index], step))) {
        return {
          status: "progress",
          progress: length,
          total: steps.length,
          reason: `Good start. Next: ${steps[length].label}.`,
        };
      }
    }

    while (meaningfulLength > 0 && tokens[meaningfulLength - 1].buttons.length === 0) {
      meaningfulLength -= 1;
    }
  }
  const effectiveTokens = commandEndsWithAttack ? tokens.slice(0, meaningfulLength) : tokens;

  if (effectiveTokens.length === 0) {
    return {
      status: "ready",
      progress: 0,
      total: steps.length,
      reason: "Waiting for your first input.",
    };
  }

  if (effectiveTokens.length >= steps.length) {
    const candidate = effectiveTokens.slice(-steps.length);
    const structuralMatch = steps.every((step, index) => tokenMatchesStep(candidate[index], step));

    if (structuralMatch) {
      const failure = timingFailure(steps, candidate, oneFrameMs);
      if (failure) {
        return {
          status: "miss",
          progress: steps.length,
          total: steps.length,
          executionFrames: (candidate.at(-1)!.at - candidate[0].at) / FRAME_MS,
          ...failure,
        };
      }

      if (move.state && move.state !== combatState) {
        return {
          status: "miss",
          progress: steps.length,
          total: steps.length,
          reason: `Command read, but ${move.state.toUpperCase()} is not active. The move is unavailable in this state.`,
        };
      }

      const justFrameToken = candidate.find((_, index) => steps[index].justFrame);
      return {
        status: "success",
        progress: steps.length,
        total: steps.length,
        reason: move.state
          ? `Command accepted. Tekken executes this while ${move.state.toUpperCase()} is active.`
          : "Command and documented input windows accepted.",
        executionFrames: (candidate.at(-1)!.at - candidate[0].at) / FRAME_MS,
        precisionFrames: justFrameToken?.simultaneousMs !== undefined
          ? justFrameToken.simultaneousMs / FRAME_MS
          : undefined,
      };
    }
  }

  let longestProgress = 0;
  const upperBound = Math.min(effectiveTokens.length, steps.length - 1);
  for (let length = 1; length <= upperBound; length += 1) {
    const suffix = effectiveTokens.slice(-length);
    const prefix = steps.slice(0, length);
    if (prefix.every((step, index) => tokenMatchesStep(suffix[index], step))) {
      longestProgress = length;
    }
  }

  if (longestProgress > 0) {
    return {
      status: "progress",
      progress: longestProgress,
      total: steps.length,
      reason: `Good start. Next: ${steps[longestProgress].label}.`,
    };
  }

  const lastToken = effectiveTokens.at(-1)!;
  const expected = steps[0].label;
  const actual = formatInputToken(lastToken);
  return {
    status: "miss",
    progress: 0,
    total: steps.length,
    reason: `Read ${actual}; this command starts with ${expected}. Reset or begin the motion again.`,
  };
};

export interface MoveDetection {
  targetEvaluation: Evaluation;
  detectedMove?: MoveDefinition;
  detectedEvaluation?: Evaluation;
}

export const detectMove = (
  targetMove: MoveDefinition,
  roster: MoveDefinition[],
  tokens: InputToken[],
  oneFrameMs = FRAME_MS,
  combatState: CombatState = "neutral",
): MoveDetection => {
  const targetEvaluation = evaluateMove(targetMove, tokens, oneFrameMs, combatState);
  if (targetEvaluation.status === "success") {
    return {
      targetEvaluation,
      detectedMove: targetMove,
      detectedEvaluation: targetEvaluation,
    };
  }
  if (targetEvaluation.status !== "miss") return { targetEvaluation };

  const detected = roster
    .filter((move) => move.id !== targetMove.id)
    .map((move) => ({
      move,
      evaluation: evaluateMove(move, tokens, oneFrameMs, combatState),
    }))
    .filter(({ evaluation }) => evaluation.status === "success")
    .sort((left, right) => right.move.steps.length - left.move.steps.length)[0];

  return {
    targetEvaluation,
    detectedMove: detected?.move,
    detectedEvaluation: detected?.evaluation,
  };
};

export const formatInputToken = (token: InputToken) => {
  const direction = token.direction === "n" ? "" : directionLabel[token.direction];
  const buttons = token.buttons.join("+");
  if (!direction && !buttons) return directionLabel.n;
  return [direction, buttons].filter(Boolean).join("+");
};

export const numericAdvantage = (value: string): number | null => {
  const match = value.replace("−", "-").match(/[+-]?\d+/);
  return match ? Number(match[0]) : null;
};

export const directionFromKeys = (keys: Set<string>, side: "P1" | "P2"): Direction => {
  const up = keys.has("KeyW");
  const down = keys.has("KeyS");
  const physicalLeft = keys.has("KeyA");
  const physicalRight = keys.has("KeyD");

  const vertical = up === down ? "" : up ? "u" : "d";
  const forwardHeld = side === "P1" ? physicalRight : physicalLeft;
  const backHeld = side === "P1" ? physicalLeft : physicalRight;
  const horizontal = forwardHeld === backHeld ? "" : forwardHeld ? "f" : "b";

  if (!vertical && !horizontal) return "n";
  return `${vertical}${horizontal}` as Direction;
};
