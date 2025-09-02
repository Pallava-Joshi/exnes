import { Router } from "express";
import { candles } from "../controller/candles.controller";
import { symbols } from "../controller/candles.controller";

export const candleRouter: Router = Router();

candleRouter.get("/", candles);
candleRouter.get("/symbols", symbols);
