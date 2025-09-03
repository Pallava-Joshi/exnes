import { Router } from "express";
import { register, login, logout, user } from "../controller/auth.controller";
import { authMiddleware } from "../middleware/auth";

export const authRouter: Router = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", authMiddleware, logout);
authRouter.get("/me", authMiddleware, user);
