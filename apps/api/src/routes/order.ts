import { Router } from "express";
import {
  openOrder,
  closeOrder,
  getOrder,
} from "../controller/order.controller";
import { authMiddleware } from "../middleware/auth";

export const orderRouter: Router = Router();

orderRouter.post("/trades/orders", authMiddleware, openOrder);
orderRouter.get("/trades/orders", authMiddleware, getOrder);
orderRouter.post("/trades/orders:id/closes", authMiddleware, closeOrder);
