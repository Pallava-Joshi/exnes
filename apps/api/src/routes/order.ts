import { Router } from "express";
import { openOrder } from "../controller/order.controller";
import { authMiddleware } from "../middleware/auth";

export const orderRouter: Router = Router();

orderRouter.post("/open", authMiddleware, openOrder);
