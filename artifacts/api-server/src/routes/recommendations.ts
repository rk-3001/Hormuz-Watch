import { Router } from "express";
import { procurementOptions, scenarios } from "../mockData";

const router = Router();

router.get("/recommendations/:scenarioId", (req, res) => {
  const { scenarioId } = req.params;
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    res.status(404).json({ error: `Scenario '${scenarioId}' not found` });
    return;
  }
  const options = procurementOptions
    .filter((p) => p.scenarioId === scenarioId)
    .sort((a, b) => a.overallRank - b.overallRank);
  res.json(options);
});

export default router;
