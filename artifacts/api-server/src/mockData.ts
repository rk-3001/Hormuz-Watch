import { randomInt } from "crypto";

// ─── Corridor Risk Scores (mutable — updated by refresh) ─────────────────────
export interface CorridorRisk {
  corridor: string;
  label: string;
  currentScore: number;
  trend: "up" | "down" | "stable";
  lastUpdated: Date;
}

export const corridorRisks: CorridorRisk[] = [
  { corridor: "hormuz", label: "Strait of Hormuz", currentScore: 62, trend: "up", lastUpdated: new Date() },
  { corridor: "redsea", label: "Red Sea / Bab-el-Mandeb", currentScore: 71, trend: "up", lastUpdated: new Date() },
  { corridor: "persian_gulf", label: "Persian Gulf", currentScore: 45, trend: "stable", lastUpdated: new Date() },
];

export function refreshRiskScores(): CorridorRisk[] {
  for (const c of corridorRisks) {
    const delta = (Math.random() * 6 - 3); // ±3 random walk
    const prev = c.currentScore;
    c.currentScore = Math.min(100, Math.max(5, c.currentScore + delta));
    c.trend = c.currentScore > prev + 0.5 ? "up" : c.currentScore < prev - 0.5 ? "down" : "stable";
    c.lastUpdated = new Date();
  }
  return corridorRisks;
}

// ─── Risk Signals ─────────────────────────────────────────────────────────────
export interface RiskSignal {
  id: string;
  corridor: string;
  source: string;
  headline: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  riskDelta: number;
}

const now = Date.now();
const h = (hrs: number) => new Date(now - hrs * 3_600_000);

export const signals: RiskSignal[] = [
  { id: "s1", corridor: "redsea", source: "Reuters", headline: "Houthi forces claim missile strike on tanker near Bab-el-Mandeb strait", severity: "critical", timestamp: h(1), riskDelta: 9.2 },
  { id: "s2", corridor: "hormuz", source: "US Treasury / OFAC", headline: "US Treasury sanctions three tankers linked to Iranian crude export network", severity: "high", timestamp: h(3), riskDelta: 6.1 },
  { id: "s3", corridor: "hormuz", source: "IHS Maritime", headline: "IRGC naval vessels conducting live-fire exercises in Strait of Hormuz approach lanes", severity: "high", timestamp: h(5), riskDelta: 5.4 },
  { id: "s4", corridor: "redsea", source: "Lloyd's List Intelligence", headline: "Major shipping lines announce 60-day Red Sea suspension following third Houthi strike", severity: "critical", timestamp: h(7), riskDelta: 11.3 },
  { id: "s5", corridor: "persian_gulf", source: "S&P Global Platts", headline: "Tanker congestion reported at Fujairah anchorage — VLCC waiting times reach 8 days", severity: "medium", timestamp: h(9), riskDelta: 3.7 },
  { id: "s6", corridor: "hormuz", source: "Bloomberg", headline: "Iran Foreign Ministry warns of 'consequences' after US carrier group enters Persian Gulf", severity: "high", timestamp: h(12), riskDelta: 4.8 },
  { id: "s7", corridor: "redsea", source: "Argus Media", headline: "Egyptian Suez Canal Authority reports 40% drop in northbound VLCC transits this week", severity: "high", timestamp: h(15), riskDelta: 7.2 },
  { id: "s8", corridor: "persian_gulf", source: "OPEC Secretariat", headline: "OPEC+ emergency meeting called for next week amid supply disruption concerns", severity: "medium", timestamp: h(18), riskDelta: 2.9 },
  { id: "s9", corridor: "hormuz", source: "Rystad Energy", headline: "Analysts warn Hormuz closure probability now at 18% — highest since 2019", severity: "high", timestamp: h(21), riskDelta: 5.8 },
  { id: "s10", corridor: "redsea", source: "Dryad Global", headline: "USS Laboon fires intercept missiles at Houthi drones over southern Red Sea", severity: "medium", timestamp: h(24), riskDelta: 4.1 },
  { id: "s11", corridor: "persian_gulf", source: "Arab News", headline: "Saudi Aramco declares force majeure on two Ras Tanura tanker loading slots", severity: "medium", timestamp: h(28), riskDelta: 3.3 },
  { id: "s12", corridor: "hormuz", source: "The Maritime Executive", headline: "Iran seizes Marshall Islands-flagged tanker in Gulf of Oman, crew detained", severity: "critical", timestamp: h(32), riskDelta: 10.5 },
  { id: "s13", corridor: "redsea", source: "Freight Wave", headline: "Container shipping rates via Cape of Good Hope 340% above pre-crisis benchmark", severity: "medium", timestamp: h(36), riskDelta: 2.6 },
  { id: "s14", corridor: "persian_gulf", source: "IEA", headline: "IEA warns India's SPR drawdown capacity may be insufficient for 15+ day Hormuz closure", severity: "high", timestamp: h(40), riskDelta: 6.7 },
  { id: "s15", corridor: "hormuz", source: "Clarksons Research", headline: "VLCC spot rates surge 28% in 48 hours as Gulf operators demand risk premiums", severity: "medium", timestamp: h(44), riskDelta: 3.9 },
  { id: "s16", corridor: "redsea", source: "Associated Press", headline: "Britain confirms two Royal Navy frigates deployed to Red Sea escort duty", severity: "low", timestamp: h(50), riskDelta: -1.2 },
  { id: "s17", corridor: "persian_gulf", source: "Gulf Intelligence", headline: "UAE declares Khorfakkan terminal as alternative crude loading point amid Fujairah delays", severity: "low", timestamp: h(58), riskDelta: -0.8 },
  { id: "s18", corridor: "hormuz", source: "Energy Intelligence", headline: "Saudi Arabia and Oman confirm overland pipeline bypass capacity of 7.5Mbpd available", severity: "low", timestamp: h(70), riskDelta: -2.1 },
];

// ─── Scenarios ────────────────────────────────────────────────────────────────
export interface Scenario {
  id: string;
  name: string;
  description: string;
  disruptionPercent: number;
  affectedCorridor: string;
  icon: string;
}

export const scenarios: Scenario[] = [
  {
    id: "hormuz-closure",
    name: "Hormuz Partial Closure",
    description: "IRGC imposes 50% capacity restriction on Strait of Hormuz shipping lanes, affecting ~18Mbpd of global crude transit. Triggered by US sanctions escalation.",
    disruptionPercent: 50,
    affectedCorridor: "hormuz",
    icon: "alert-triangle",
  },
  {
    id: "opec-emergency-cut",
    name: "OPEC+ Emergency Cut",
    description: "OPEC+ enacts an emergency 2Mbpd production cut in response to demand uncertainty. Saudi Arabia and UAE implement immediately with 30-day notice.",
    disruptionPercent: 35,
    affectedCorridor: "persian_gulf",
    icon: "trending-down",
  },
  {
    id: "redsea-suspension",
    name: "Red Sea Full Suspension",
    description: "All major shipping lines suspend Red Sea transits following coordinated Houthi drone and missile attacks. Full Cape rerouting adds 14 days transit.",
    disruptionPercent: 80,
    affectedCorridor: "redsea",
    icon: "ship",
  },
];

// ─── Procurement Options (per scenario) ──────────────────────────────────────
export interface ProcurementOption {
  id: string;
  sourceName: string;
  region: string;
  gradeType: string;
  pricePerBarrel: number;
  premiumVsBenchmark: number;
  tankerAvailability: "high" | "medium" | "low";
  transitDays: number;
  refineryCompatibilityScore: number;
  overallRank: number;
  rationale: string;
  scenarioId: string;
}

export const procurementOptions: ProcurementOption[] = [
  // HORMUZ CLOSURE
  {
    id: "p-hc-1", scenarioId: "hormuz-closure", overallRank: 1,
    sourceName: "US Gulf Coast WTI", region: "North America", gradeType: "WTI Light Sweet",
    pricePerBarrel: 84.20, premiumVsBenchmark: 3.80, tankerAvailability: "high",
    transitDays: 42, refineryCompatibilityScore: 78,
    rationale: "Highest tanker availability with zero Hormuz exposure. Refinery grade adjustment needed but manageable. US export infrastructure fully operational.",
  },
  {
    id: "p-hc-2", scenarioId: "hormuz-closure", overallRank: 2,
    sourceName: "West African Bonny Light", region: "West Africa", gradeType: "Bonny Light",
    pricePerBarrel: 82.60, premiumVsBenchmark: 2.20, tankerAvailability: "high",
    transitDays: 21, refineryCompatibilityScore: 89,
    rationale: "Excellent refinery compatibility with Indian FCCU configuration. Shorter transit than US. Nigeria NLNG export loading stable.",
  },
  {
    id: "p-hc-3", scenarioId: "hormuz-closure", overallRank: 3,
    sourceName: "Russian ESPO Blend", region: "Russia / Far East", gradeType: "ESPO Blend",
    pricePerBarrel: 72.40, premiumVsBenchmark: -7.80, tankerAvailability: "medium",
    transitDays: 12, refineryCompatibilityScore: 82,
    rationale: "Significant price discount but secondary sanctions risk. Shortest transit to east coast refineries. Tanker fleet availability constrained by shadow fleet tracking.",
  },
  {
    id: "p-hc-4", scenarioId: "hormuz-closure", overallRank: 4,
    sourceName: "Saudi Arabian Light (Bypass)", region: "Middle East", gradeType: "Arab Light",
    pricePerBarrel: 80.10, premiumVsBenchmark: -0.10, tankerAvailability: "medium",
    transitDays: 18, refineryCompatibilityScore: 95,
    rationale: "Saudi overland pipeline bypass to Yanbu available (7.5Mbpd). Near-perfect refinery compatibility. Volume allocation subject to Saudi Aramco confirmation.",
  },
  {
    id: "p-hc-5", scenarioId: "hormuz-closure", overallRank: 5,
    sourceName: "Domestic ONGC Crude", region: "India (Offshore)", gradeType: "Bombay High",
    pricePerBarrel: 78.50, premiumVsBenchmark: -1.70, tankerAvailability: "high",
    transitDays: 2, refineryCompatibilityScore: 72,
    rationale: "Zero transit risk, minimal logistics cost. Bombay High yield profile requires refinery configuration changes. Max output ~820kbpd — insufficient as standalone source.",
  },

  // OPEC EMERGENCY CUT
  {
    id: "p-oc-1", scenarioId: "opec-emergency-cut", overallRank: 1,
    sourceName: "US Gulf Coast WTI", region: "North America", gradeType: "WTI Light Sweet",
    pricePerBarrel: 87.40, premiumVsBenchmark: 4.60, tankerAvailability: "high",
    transitDays: 42, refineryCompatibilityScore: 78,
    rationale: "US is outside OPEC+ quota system. Strong spot market availability. Price premium offset by supply security.",
  },
  {
    id: "p-oc-2", scenarioId: "opec-emergency-cut", overallRank: 2,
    sourceName: "West African Bonny Light", region: "West Africa", gradeType: "Bonny Light",
    pricePerBarrel: 85.20, premiumVsBenchmark: 2.40, tankerAvailability: "high",
    transitDays: 21, refineryCompatibilityScore: 89,
    rationale: "Non-OPEC West African producers can increase output rapidly. Angola recently left OPEC+.",
  },
  {
    id: "p-oc-3", scenarioId: "opec-emergency-cut", overallRank: 3,
    sourceName: "Russian ESPO Blend", region: "Russia / Far East", gradeType: "ESPO Blend",
    pricePerBarrel: 74.30, premiumVsBenchmark: -8.50, tankerAvailability: "medium",
    transitDays: 12, refineryCompatibilityScore: 82,
    rationale: "Russia outside cut mandate effectively. Deep discount persists. Secondary sanctions monitoring required.",
  },
  {
    id: "p-oc-4", scenarioId: "opec-emergency-cut", overallRank: 4,
    sourceName: "Brazilian Pre-salt", region: "South America", gradeType: "Tupi Blend",
    pricePerBarrel: 83.60, premiumVsBenchmark: 0.80, tankerAvailability: "medium",
    transitDays: 28, refineryCompatibilityScore: 76,
    rationale: "Petrobras operating outside OPEC+ framework. Deep-water pre-salt output growing. Long transit is primary downside.",
  },
  {
    id: "p-oc-5", scenarioId: "opec-emergency-cut", overallRank: 5,
    sourceName: "Domestic ONGC Crude", region: "India (Offshore)", gradeType: "Bombay High",
    pricePerBarrel: 78.50, premiumVsBenchmark: -4.30, tankerAvailability: "high",
    transitDays: 2, refineryCompatibilityScore: 72,
    rationale: "Domestic production fully insulated from OPEC+ cuts. Limited incremental volume, but strategic buffer.",
  },

  // RED SEA SUSPENSION
  {
    id: "p-rs-1", scenarioId: "redsea-suspension", overallRank: 1,
    sourceName: "West African Bonny Light", region: "West Africa", gradeType: "Bonny Light",
    pricePerBarrel: 83.80, premiumVsBenchmark: 3.60, tankerAvailability: "high",
    transitDays: 21, refineryCompatibilityScore: 89,
    rationale: "Red Sea closure does not affect West Africa routes. Natural cape routing from Nigeria suits east India ports. Best overall option.",
  },
  {
    id: "p-rs-2", scenarioId: "redsea-suspension", overallRank: 2,
    sourceName: "Saudi Arabian Light (Hormuz)", region: "Middle East", gradeType: "Arab Light",
    pricePerBarrel: 80.20, premiumVsBenchmark: 0.00, tankerAvailability: "high",
    transitDays: 9, refineryCompatibilityScore: 95,
    rationale: "Red Sea suspension does not affect Hormuz/Indian Ocean routing for Saudi cargoes. Excellent compatibility. Standard pricing maintained.",
  },
  {
    id: "p-rs-3", scenarioId: "redsea-suspension", overallRank: 3,
    sourceName: "Russian ESPO Blend", region: "Russia / Far East", gradeType: "ESPO Blend",
    pricePerBarrel: 72.80, premiumVsBenchmark: -7.40, tankerAvailability: "medium",
    transitDays: 12, refineryCompatibilityScore: 82,
    rationale: "ESPO route via Pacific unaffected by Red Sea events. Price discount significant. Fleet availability tracking needed.",
  },
  {
    id: "p-rs-4", scenarioId: "redsea-suspension", overallRank: 4,
    sourceName: "Iraqi Basrah Light", region: "Middle East", gradeType: "Basrah Light",
    pricePerBarrel: 79.40, premiumVsBenchmark: -0.80, tankerAvailability: "high",
    transitDays: 8, refineryCompatibilityScore: 91,
    rationale: "Iraq exports via Basrah terminal route unaffected by Red Sea closure. High availability, excellent grade match.",
  },
  {
    id: "p-rs-5", scenarioId: "redsea-suspension", overallRank: 5,
    sourceName: "Domestic ONGC Crude", region: "India (Offshore)", gradeType: "Bombay High",
    pricePerBarrel: 78.50, premiumVsBenchmark: -1.70, tankerAvailability: "high",
    transitDays: 2, refineryCompatibilityScore: 72,
    rationale: "Domestic production fully insulated from Red Sea disruption. Strategic buffer.",
  },
];

// ─── Reserve Baseline ─────────────────────────────────────────────────────────
export function getReserveStatus(disruptionDays = 15): {
  currentDaysCover: number;
  maxCapacityDays: number;
  utilizationPercent: number;
  disruptionDays: number;
  drawdownSchedule: { day: number; projectedDays: number }[];
} {
  const current = 9.5;
  const max = 22.0;
  const utilizationPercent = (current / max) * 100;
  const drawdownRate = current / disruptionDays; // days-cover consumed per disruption-day
  const drawdownSchedule: { day: number; projectedDays: number }[] = [];
  for (let d = 0; d <= disruptionDays + 2; d++) {
    const remaining = Math.max(0, current - drawdownRate * d);
    drawdownSchedule.push({ day: d, projectedDays: parseFloat(remaining.toFixed(2)) });
  }
  return { currentDaysCover: current, maxCapacityDays: max, utilizationPercent: parseFloat(utilizationPercent.toFixed(1)), disruptionDays, drawdownSchedule };
}

// ─── Scenario Results ─────────────────────────────────────────────────────────
interface ScenarioResultBase {
  scenarioId: string;
  scenarioName: string;
  refineryRunRateDrop: number;
  fuelPriceDeltaPercent: number;
  sprDaysRemaining: number;
  gdpDragPercent: number;
  narrative: string;
}

const scenarioResultMap: Record<string, ScenarioResultBase> = {
  "hormuz-closure": {
    scenarioId: "hormuz-closure", scenarioName: "Hormuz Partial Closure",
    refineryRunRateDrop: 34.2, fuelPriceDeltaPercent: 28.6,
    sprDaysRemaining: 5.8, gdpDragPercent: 1.4,
    narrative: "A 50% Hormuz capacity restriction would strip ~9Mbpd from India's crude supply pipeline. Refineries operating at 65.8% run-rate. Fuel prices projected +28.6% within 14 days. SPR cover depleted in 5.8 days at current drawdown rates. GDP drag estimated at 1.4% annualised. Immediate activation of strategic reserve and alternative procurement is required.",
  },
  "opec-emergency-cut": {
    scenarioId: "opec-emergency-cut", scenarioName: "OPEC+ Emergency Cut",
    refineryRunRateDrop: 18.7, fuelPriceDeltaPercent: 16.3,
    sprDaysRemaining: 7.2, gdpDragPercent: 0.7,
    narrative: "An OPEC+ 2Mbpd cut reduces India's spot-market access significantly. Refinery run-rates fall 18.7% as term contract volumes tighten. Price delta of 16.3% pressures refinery margins and downstream prices. SPR provides 7.2 days of buffer. Non-OPEC sources (US, West Africa, Russia) are primary mitigation vectors.",
  },
  "redsea-suspension": {
    scenarioId: "redsea-suspension", scenarioName: "Red Sea Full Suspension",
    refineryRunRateDrop: 12.4, fuelPriceDeltaPercent: 9.8,
    sprDaysRemaining: 8.1, gdpDragPercent: 0.4,
    narrative: "Full Red Sea suspension adds 14–16 days transit via Cape of Good Hope, increasing landed cost by ~$4.20/bbl. Tanker availability tightens as vessel days consumed rise. Refinery run-rate impact (12.4%) is manageable. Price impact moderate at 9.8%. Indian Ocean routing from Middle East, East Africa and Russia ESPO unaffected.",
  },
};

export function computeScenarioResult(scenarioId: string) {
  const base = scenarioResultMap[scenarioId];
  if (!base) return null;
  return { ...base, generatedAt: new Date() };
}

// ─── Timeline Entries ─────────────────────────────────────────────────────────
export interface TimelineEntry {
  id: string;
  event: string;
  detail: string;
  timestamp: Date;
  status: "completed" | "processing" | "pending";
}

export const timelineEntries: TimelineEntry[] = [
  { id: "tl1", event: "Signal Detected", detail: "Houthi missile strike confirmed near Bab-el-Mandeb — Reuters feed ingested", timestamp: h(1), status: "completed" },
  { id: "tl2", event: "Risk Score Updated", detail: "Red Sea corridor recalculated: 63 → 71 (+8pts). Threshold breach triggered", timestamp: h(1.05), status: "completed" },
  { id: "tl3", event: "Alert Generated", detail: "High-risk threshold (70) crossed on Red Sea corridor. Analysts notified", timestamp: h(1.08), status: "completed" },
  { id: "tl4", event: "Scenario Available", detail: "Red Sea Suspension scenario auto-staged with updated input parameters", timestamp: h(1.12), status: "completed" },
  { id: "tl5", event: "OFAC Signal Ingested", detail: "US Treasury sanctions on 3 tankers — Hormuz corridor re-scored", timestamp: h(3), status: "completed" },
  { id: "tl6", event: "Risk Score Updated", detail: "Hormuz corridor recalculated: 56 → 62 (+6pts)", timestamp: h(3.05), status: "completed" },
  { id: "tl7", event: "Recommendation Generated", detail: "Top-5 procurement alternatives ranked for Hormuz Closure scenario", timestamp: h(3.1), status: "completed" },
  { id: "tl8", event: "SPR Analysis", detail: "Reserve depletion model updated: 9.5 days cover at current import rates", timestamp: h(5), status: "completed" },
  { id: "tl9", event: "Model Refresh", detail: "Procurement scoring model refreshed with latest spot prices and tanker data", timestamp: h(0.3), status: "completed" },
  { id: "tl10", event: "Live Feed Active", detail: "Monitoring 14 active data feeds across 3 corridors", timestamp: new Date(), status: "processing" },
];
