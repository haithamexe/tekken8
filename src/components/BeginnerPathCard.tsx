import { CheckCircle2, GraduationCap } from "lucide-react";
import type { BeginnerApproach } from "../domain/types";

interface BeginnerPathCardProps {
  approach: BeginnerApproach;
}

export const BeginnerPathCard = ({ approach }: BeginnerPathCardProps) => (
  <section className="beginner-path-card">
    <span className="path-rank">{String(approach.rank).padStart(2, "0")}</span>
    <div>
      <span className="section-kicker"><GraduationCap size={13} /> Starter path</span>
      <h2>{approach.name}</h2>
      <p>{approach.goal}</p>
      <small>{approach.why}</small>
    </div>
    <div className="path-checkpoint"><CheckCircle2 size={15} /><span><small>CHECKPOINT</small>{approach.checkpoint}</span></div>
  </section>
);
