import { useCallback, useEffect, useRef, useState } from "react";
import type { AttackButton, Direction, InputToken } from "../domain/types";
import { directionFromKeys, FRAME_MS } from "../domain/input-engine";

const ATTACK_KEYS: Record<string, AttackButton> = {
  KeyU: "1",
  KeyI: "2",
  KeyJ: "3",
  KeyK: "4",
};

const DIRECTION_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);
const MAX_TOKENS = 28;

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches("input, textarea, select, [contenteditable='true']");
};

interface InputCaptureOptions {
  side: "P1" | "P2";
  strict: boolean;
  enabled: boolean;
}

export const useTekkenInput = ({ side, strict, enabled }: InputCaptureOptions) => {
  const [tokens, setTokens] = useState<InputToken[]>([]);
  const [heldDirection, setHeldDirection] = useState<Direction>("n");
  const [heldButtons, setHeldButtons] = useState<AttackButton[]>([]);
  const directionKeysRef = useRef(new Set<string>());
  const attackKeysRef = useRef(new Set<string>());
  const heldDirectionRef = useRef<Direction>("n");
  const tokenIdRef = useRef(0);
  const sessionStartRef = useRef<number | null>(null);
  const directionChangedAtRef = useRef(0);

  const clear = useCallback(() => {
    setTokens([]);
    sessionStartRef.current = null;
  }, []);

  const createToken = useCallback(
    (
      direction: Direction,
      buttons: AttackButton[],
      at: number,
      simultaneousMs?: number,
      chordSpreadMs?: number,
    ): InputToken => {
      if (sessionStartRef.current === null) sessionStartRef.current = at;
      tokenIdRef.current += 1;
      return {
        id: tokenIdRef.current,
        direction,
        buttons,
        at,
        frame: Math.round((at - sessionStartRef.current) / FRAME_MS),
        simultaneousMs,
        chordSpreadMs,
      };
    },
    [],
  );

  const recordDirectionTransition = useCallback((nextDirection: Direction, at: number) => {
    if (nextDirection === heldDirectionRef.current) return;
    directionChangedAtRef.current = at;
    heldDirectionRef.current = nextDirection;
    setHeldDirection(nextDirection);
    setTokens((previous) => {
      const last = previous.at(-1);
      if (last && last.direction === nextDirection && last.buttons.length === 0) return previous;
      return [...previous, createToken(nextDirection, [], at)].slice(-MAX_TOKENS);
    });
  }, [createToken]);

  useEffect(() => {
    const chordWindowMs = strict ? FRAME_MS : FRAME_MS * 2;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled || isEditableTarget(event.target) || event.repeat) return;
      const isDirection = DIRECTION_KEYS.has(event.code);
      const button = ATTACK_KEYS[event.code];
      if (!isDirection && !button) {
        if (event.code === "Backspace") {
          event.preventDefault();
          clear();
        }
        return;
      }

      event.preventDefault();
      const at = event.timeStamp;

      if (isDirection) {
        directionKeysRef.current.add(event.code);
        const nextDirection = directionFromKeys(directionKeysRef.current, side);
        recordDirectionTransition(nextDirection, at);
        return;
      }

      attackKeysRef.current.add(event.code);
      const activeButtons = Object.entries(ATTACK_KEYS)
        .filter(([code]) => attackKeysRef.current.has(code))
        .map(([, value]) => value);
      setHeldButtons(activeButtons);

      const currentDirection = directionFromKeys(directionKeysRef.current, side);
      const directionSpread = currentDirection === "n" ? undefined : at - directionChangedAtRef.current;

      setTokens((previous) => {
        const last = previous.at(-1);

        if (
          last &&
          last.buttons.length > 0 &&
          !last.buttons.includes(button) &&
          last.direction === currentDirection &&
          at - last.at <= chordWindowMs &&
          last.buttons.every((heldButton) => activeButtons.includes(heldButton))
        ) {
          const combinedButtons = [...new Set([...last.buttons, button])].sort() as AttackButton[];
          const combined = createToken(
            currentDirection,
            combinedButtons,
            at,
            directionSpread,
            at - last.at,
          );
          return [...previous.slice(0, -1), combined].slice(-MAX_TOKENS);
        }

        const token = createToken(currentDirection, [button], at, directionSpread);
        if (last && last.buttons.length === 0 && last.direction === currentDirection) {
          return [...previous.slice(0, -1), token].slice(-MAX_TOKENS);
        }
        return [...previous, token].slice(-MAX_TOKENS);
      });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const isDirection = DIRECTION_KEYS.has(event.code);
      const button = ATTACK_KEYS[event.code];
      if (!isDirection && !button) return;

      const at = event.timeStamp;
      if (isDirection) {
        directionKeysRef.current.delete(event.code);
        const nextDirection = directionFromKeys(directionKeysRef.current, side);
        recordDirectionTransition(nextDirection, at);
      }

      if (button) {
        attackKeysRef.current.delete(event.code);
        setHeldButtons(
          Object.entries(ATTACK_KEYS)
            .filter(([code]) => attackKeysRef.current.has(code))
            .map(([, value]) => value),
        );
      }
    };

    const onBlur = () => {
      directionKeysRef.current.clear();
      attackKeysRef.current.clear();
      heldDirectionRef.current = "n";
      setHeldDirection("n");
      setHeldButtons([]);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [clear, createToken, enabled, recordDirectionTransition, side, strict]);

  return { tokens, heldDirection, heldButtons, clear };
};
