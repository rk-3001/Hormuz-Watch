import { Router } from "express";
import { corridorRisks, refreshRiskScores } from "../mockData";

const router = Router();

router.get("/risk-scores", (_req, res) => {
  res.json(corridorRisks);
});

router.post("/risk-scores/refresh", (_req, res) => {
  const updated = refreshRiskScores();
  res.json(updated);
});

export default router;
