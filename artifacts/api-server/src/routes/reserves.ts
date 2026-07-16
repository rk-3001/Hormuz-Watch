import { Router } from "express";
import { getReserveStatus } from "../mockData";

const router = Router();

router.get("/reserves", (req, res) => {
  const { disruptionDays } = req.query;
  const days = disruptionDays ? parseInt(disruptionDays as string, 10) : 15;
  res.json(getReserveStatus(isNaN(days) ? 15 : days));
});

export default router;
