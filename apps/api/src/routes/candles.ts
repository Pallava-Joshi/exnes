import { Router } from "express";
import { candles } from "../controller/candles.controller";

export const candleRouter: Router = Router();

candleRouter.get("/", candles);
