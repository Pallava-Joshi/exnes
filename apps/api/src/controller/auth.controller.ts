import { Request, Response } from "express";
import { prismaClient } from "@repo/db/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
};
const setAuthCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, phone, password } = req.body;
    if (!email || !password || !phone)
      return res.status(400).json({
        error: "All fields req",
      });
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prismaClient.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        balance: {
          create: {},
        },
      },
      include: { balance: true },
    });

    const token = generateToken(newUser.id);
    setAuthCookie(res, token);

    return res.json({
      message: "User registered successfully",
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({
        error: "All fields req",
      });

    const user = await prismaClient.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) return res.send("User not found");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }
    const token = generateToken(user.id);
    setAuthCookie(res, token);
    return res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const signout = (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.json({ message: "Logout successful" });
};
