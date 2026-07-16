import { Router } from "express";
import { scenarios, computeScenarioResult } from "../mockData";

const router = Router();

router.get("/scenarios", (_req, res) => {
  res.json(scenarios);
});

router.post("/scenarios/:id/run", (req, res) => {
  const { id } = req.params;
  const scenario = scenarios.find((s) => s.id === id);
  if (!scenario) {
    res.status(404).json({ error: `Scenario '${id}' not found` });
    return;
  }
  const result = computeScenarioResult(id);
  if (!result) {
    res.status(404).json({ error: `No result data for scenario '${id}'` });
    return;
  }
  res.json(result);
});

export default router;
