import { Router } from "express";
import {
  openOrder,
  closeOrder,
  getOrder,
} from "../controller/order.controller";
import { authMiddleware } from "../middleware/auth";

export const orderRouter: Router = Router();

orderRouter.post("/orders", authMiddleware, openOrder);
orderRouter.get("/orders/:id", authMiddleware, getOrder);
orderRouter.post("/orders/:id", authMiddleware, closeOrder);
