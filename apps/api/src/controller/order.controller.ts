import { Response } from "express";
import { authRequest } from "../middleware/auth";
import { prismaClient, Prisma } from "@repo/db/prisma";

type status = "OPEN" | "CLOSED";
type type = "LONG" | "PUT";

export const openOrder = async (req: authRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return console.log("Cookie expired - relogin");
    const user = await prismaClient.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        balance: true,
      },
    });
    if (!user)
      return res.json({
        message: "Database error - please signup",
      });
    // make order status open if balance > 0
    // PnL calculated at the time of ws connection from sub
    const {
      type,
      asset,
      leverage,
      margin,
      buyPrice,
      qty,
      stopLoss,
      takeProfit,
    } = req.body;

    let boughtAmount = qty * buyPrice;
    let leveragedAmount = boughtAmount * leverage;

    // console.log(user.balance?.balance);

    if (!user.balance?.balance)
      return res.status(400).json({
        error: "insuffient funds",
      });

    if (boughtAmount > user.balance?.balance.toNumber())
      return res.status(400).json({
        error: "insufficient funds",
      });
    const order = prismaClient.order.create({
      data: {
        status: "OPEN",
        type: "LONG",
        asset: asset,
        leverage: leverage,
        margin: new Prisma.Decimal(margin),
        buyPrice: new Prisma.Decimal(buyPrice),
        qty: new Prisma.Decimal(qty),
        stopLoss: new Prisma.Decimal(stopLoss),
        takeProfit: new Prisma.Decimal(takeProfit),
        userId,
      },
    });
    return res.json({
      order,
    });
  } catch (e) {
    console.log(e);
  }
};

export const closeOrder = async (req: authRequest, res: Response) => {};
