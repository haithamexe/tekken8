import type {
  BeginnerApproach,
  CharacterId,
  ComboDefinition,
  MoveCategory,
  MoveDefinition,
} from "../domain/types";
import * as kazuya from "./kazuya";
import * as reina from "./reina";

export interface CharacterDataset {
  id: CharacterId;
  name: string;
  tagline: string;
  highlight: string;
  moves: MoveDefinition[];
  publicMoves: MoveDefinition[];
  combos: ComboDefinition[];
  beginnerApproaches: BeginnerApproach[];
  defaultMoveId: string;
  dataVersion: string;
  dataCheckedAt: string;
  dataSources: { label: string; url: string }[];
}

export const CHARACTERS: Record<CharacterId, CharacterDataset> = {
  kazuya: {
    id: "kazuya",
    name: "Kazuya Mishima",
    tagline: "Devil Gene Mishima",
    highlight: "i13 Perfect Electric Wind God Fist, the wavedash low/mid mixup, and a full Season 3 combo curriculum.",
    moves: kazuya.KAZUYA_MOVES,
    publicMoves: kazuya.PUBLIC_KAZUYA_MOVES,
    combos: kazuya.KAZUYA_COMBOS,
    beginnerApproaches: kazuya.KAZUYA_BEGINNER_APPROACHES,
    defaultMoveId: "pewgf",
    dataVersion: kazuya.DATA_VERSION,
    dataCheckedAt: kazuya.DATA_CHECKED_AT,
    dataSources: kazuya.DATA_SOURCES,
  },
  reina: {
    id: "reina",
    name: "Reina",
    tagline: "Absolute style",
    highlight: "Both a punch and a kick Electric off the same crouch dash, plus the Tatenashi parry.",
    moves: reina.REINA_MOVES,
    publicMoves: reina.PUBLIC_REINA_MOVES,
    combos: reina.REINA_COMBOS,
    beginnerApproaches: reina.REINA_BEGINNER_APPROACHES,
    defaultMoveId: "pewgf",
    dataVersion: reina.DATA_VERSION,
    dataCheckedAt: reina.DATA_CHECKED_AT,
    dataSources: reina.DATA_SOURCES,
  },
};

export const getMoveById = (characterId: CharacterId, id: string): MoveDefinition => {
  const move = CHARACTERS[characterId].moves.find((candidate) => candidate.id === id);
  if (!move) throw new Error(`Unknown ${characterId} move: ${id}`);
  return move;
};

export const getComboById = (characterId: CharacterId, id: string): ComboDefinition => {
  const combo = CHARACTERS[characterId].combos.find((candidate) => candidate.id === id);
  if (!combo) throw new Error(`Unknown ${characterId} combo: ${id}`);
  return combo;
};

export const getBeginnerApproachById = (characterId: CharacterId, id: string): BeginnerApproach => {
  const approach = CHARACTERS[characterId].beginnerApproaches.find((candidate) => candidate.id === id);
  if (!approach) throw new Error(`Unknown ${characterId} beginner approach: ${id}`);
  return approach;
};

export const filterMoves = (
  moves: MoveDefinition[],
  query: string,
  category: "All" | MoveCategory,
) => {
  const needle = query.trim().toLowerCase();
  return moves.filter((move) => {
    const searchableText = `${move.name} ${move.notation} ${move.tags.join(" ")}`.toLowerCase();
    return (category === "All" || move.category === category) && searchableText.includes(needle);
  });
};
