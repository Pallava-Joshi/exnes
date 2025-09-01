import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prismaClient, Prisma } from "@repo/db/prisma";

export interface authRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: authRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  if (!token) return res.status(401).json({ error: "Unauthorized user" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    // console.log(decoded.user);
    const user = await prismaClient.user.findFirst({
      where: {
        id: decoded.userId,
      },
      include: {
        balance: true,
      },
    });
    req.user = user;
    if (!user)
      res.status(401).json({
        message: "Unauthorized",
      });
    next();
  } catch (e) {
    res.status(403).json({ err: "Auth error!" });
  }
};
