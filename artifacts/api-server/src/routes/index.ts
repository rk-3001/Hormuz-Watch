import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signalsRouter from "./signals";
import riskRouter from "./risk";
import scenariosRouter from "./scenarios";
import recommendationsRouter from "./recommendations";
import reservesRouter from "./reserves";
import timelineRouter from "./timeline";
import assistantRouter from "./assistant";
import anthropicRouter from "./anthropic/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(signalsRouter);
router.use(riskRouter);
router.use(scenariosRouter);
router.use(recommendationsRouter);
router.use(reservesRouter);
router.use(timelineRouter);
router.use(assistantRouter);
router.use("/anthropic", anthropicRouter);

export default router;
