import { Router } from "express";
import { scenarios, computeProcurementOptions, PRESET_INPUTS, type ScenarioInputs } from "../mockData";

const router = Router();

// POST /recommendations/custom — arbitrary scenario inputs
router.post("/recommendations/custom", (req, res) => {
  const { disruptionPercent, affectedCorridor, durationDays } = req.body as Partial<ScenarioInputs>;
  if (
    typeof disruptionPercent !== "number" ||
    typeof durationDays !== "number" ||
    !["hormuz", "redsea", "persian_gulf"].includes(affectedCorridor as string)
  ) {
    res.status(400).json({ error: "Invalid input: expected disruptionPercent (number), affectedCorridor (hormuz|redsea|persian_gulf), durationDays (number)" });
    return;
  }
  const options = computeProcurementOptions({
    disruptionPercent,
    affectedCorridor: affectedCorridor as ScenarioInputs["affectedCorridor"],
    durationDays,
  });
  res.json(options);
});

// GET /recommendations/:scenarioId — preset scenario IDs resolved to inputs, then computed live
router.get("/recommendations/:scenarioId", (req, res) => {
  const { scenarioId } = req.params;
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    res.status(404).json({ error: `Scenario '${scenarioId}' not found` });
    return;
  }
  const inputs = PRESET_INPUTS[scenarioId];
  if (!inputs) {
    res.status(404).json({ error: `No parametric inputs defined for scenario '${scenarioId}'` });
    return;
  }
  const options = computeProcurementOptions(inputs);
  res.json(options);
});

export default router;
