import { Router } from "express";
import { signals } from "../mockData";

const router = Router();

router.get("/signals", (req, res) => {
  const { corridor, severity, limit } = req.query;
  let result = [...signals].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  if (corridor) result = result.filter((s) => s.corridor === corridor);
  if (severity) result = result.filter((s) => s.severity === severity);
  if (limit) result = result.slice(0, parseInt(limit as string, 10));
  res.json(result);
});

export default router;
