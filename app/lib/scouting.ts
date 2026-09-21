import type { PlayerRoleGroup } from "./player-roles";

export type ScoutingPercentiles = {
  goals?: number | null;
  assists?: number | null;
  xg?: number | null;
  xa?: number | null;
  chancesCreated?: number | null;
  keyPasses?: number | null;
  tackles?: number | null;
  interceptions?: number | null;
  progressiveCarries?: number | null;
};

export type ScoutingArchetype = { label: string; summary: string; traits: string[] };

const value = (v: number | null | undefined) => typeof v === "number" && Number.isFinite(v) ? v : null;
const average = (values: Array<number | null | undefined>) => {
  const usable = values.map(value).filter((v): v is number => v != null);
  return usable.length ? usable.reduce((sum, v) => sum + v, 0) / usable.length : null;
};

export function getScoutingArchetype(role: PlayerRoleGroup, p: ScoutingPercentiles): ScoutingArchetype {
  if (role === "GK") return { label: "Goalkeeper Profile", summary: "Goalkeeper context is benchmarked separately from field-player output.", traits: ["Goalkeeper", "Separate peer benchmark"] };
  const attack = average([p.goals, p.xg]);
  const creation = average([p.assists, p.xa, p.chancesCreated, p.keyPasses]);
  const defending = average([p.tackles, p.interceptions]);
  const progression = value(p.progressiveCarries);
  const dimensions = [
    { key: "attack", value: attack },
    { key: "creation", value: creation },
    { key: "defending", value: defending },
    { key: "progression", value: progression }
  ].filter((d): d is { key: string; value: number } => d.value != null);
  const strong = dimensions.filter((d) => d.value >= 75).sort((a, b) => b.value - a.value);
  const moderate = dimensions.filter((d) => d.value >= 60).sort((a, b) => b.value - a.value);
  const top = strong[0] || moderate[0] || dimensions.sort((a, b) => b.value - a.value)[0];
  const labels: Record<string, string> = { attack: "Goal Threat", creation: "Chance Creator", defending: "Defensive Disruptor", progression: "Ball Progressor" };
  const summaries: Record<string, string> = {
    attack: "Recorded attacking output is the strongest available peer-context dimension.",
    creation: "Recorded chance creation and passing output are the strongest available peer-context dimensions.",
    defending: "Recorded defensive disruption is the strongest available peer-context dimension.",
    progression: "Recorded progressive carrying is the strongest available peer-context dimension."
  };
  if (!top) return { label: "Developing Profile", summary: "There is not enough percentile coverage to describe a dominant recorded trait.", traits: ["Limited benchmark coverage"] };
  const secondary = (strong[1] || moderate[1])?.key;
  const label = secondary && secondary !== top.key ? labels[top.key] + " · " + labels[secondary] : labels[top.key];
  return {
    label,
    summary: summaries[top.key],
    traits: dimensions.filter((d) => d.value >= 60).sort((a, b) => b.value - a.value).slice(0, 3).map((d) => labels[d.key])
  };
}
