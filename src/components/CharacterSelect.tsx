import { Zap } from "lucide-react";
import { CHARACTERS } from "../data/registry";
import type { CharacterId } from "../domain/types";

interface CharacterSelectProps {
  onSelect: (id: CharacterId) => void;
}

export const CharacterSelect = ({ onSelect }: CharacterSelectProps) => (
  <div className="character-select">
    <div className="character-select-heading">
      <span><Zap size={17} /></span>
      <div>
        <strong>MISHIMA LAB</strong>
        <small>Choose your fighter</small>
      </div>
    </div>
    <div className="character-select-grid">
      {Object.values(CHARACTERS).map((character) => (
        <button
          className="character-card"
          type="button"
          key={character.id}
          onClick={() => onSelect(character.id)}
        >
          <span className="character-card-tagline">{character.tagline}</span>
          <h2>{character.name}</h2>
          <p>{character.highlight}</p>
          <span className="character-card-cta">Train {character.name.split(" ")[0]} →</span>
        </button>
      ))}
    </div>
    <p className="character-select-note">Your choice is saved on this device. Switch fighters anytime from the header.</p>
  </div>
);
