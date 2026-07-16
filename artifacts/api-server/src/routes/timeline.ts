import { Router } from "express";
import { timelineEntries } from "../mockData";

const router = Router();

router.get("/timeline", (_req, res) => {
  res.json([...timelineEntries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
});

export default router;
