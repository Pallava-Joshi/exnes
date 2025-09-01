import { Response } from "express";
import { authRequest } from "../middleware/auth";
import { prismaClient, Prisma } from "@repo/db/prisma";
import { redisClient } from "@repo/redis/client";

type status = "OPEN" | "CLOSED";
type type = "LONG" | "SHORT";

function calcTrade(
  qty: number,
  buyPrice: number,
  currentPrice: number,
  orderType: type,
  leverage = 1
) {
  const positionAmount = qty * buyPrice;
  const margin = positionAmount / leverage;

  const PnL =
    orderType === "LONG"
      ? (currentPrice - buyPrice) * qty
      : (buyPrice - currentPrice) * qty;

  return { positionAmount, margin, PnL };
}

export const getOrder = async (req: authRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await prismaClient.order.findMany({
      where: {
        orderId,
      },
    });
    res.json(order);
  } catch (e) {
    return res.status(400).json({
      error: e,
    });
  }
};

export const openOrder = async (req: authRequest, res: Response) => {
  try {
    const user = req.user;
    const {
      orderType,
      asset,
      leverage,
      qty,
      stopLoss,
      takeProfit,
    }: {
      orderType: "LONG" | "SHORT";
      asset: "BTCUSDT" | "SOLUSDT" | "ETHUSDT";
      leverage: number;
      qty: number;
      stopLoss?: number;
      takeProfit?: number;
    } = req.body;

    const currData = await redisClient.get(`last:price:${asset}`);
    if (!currData) return;
    const parsed = JSON.parse(currData);
    const buyPrice = parsed.currentPrice;
    // console.log(buyPrice);

    let positonAmount = qty * buyPrice;
    let margin = positonAmount / leverage;
    let balance = user.balance?.balance;
    // console.log(margin);
    if (!balance || positonAmount > balance.toNumber())
      return res.status(400).json({
        error: "insuffient funds",
      });
    // console.log(user.balance);

    const order = await prismaClient.order.create({
      data: {
        status: "OPEN",
        orderType: orderType,
        asset: asset,
        leverage: leverage,
        margin: new Prisma.Decimal(margin),
        buyPrice: new Prisma.Decimal(buyPrice),
        qty: new Prisma.Decimal(qty),
        stopLoss: stopLoss ? new Prisma.Decimal(stopLoss) : undefined,
        takeProfit: takeProfit ? new Prisma.Decimal(takeProfit) : undefined,
        userId: user.id,
      },
    });
    const remainingBal = balance - margin;
    const newBalance = await prismaClient.balance.update({
      where: {
        userId: user.id,
      },
      data: {
        balance: remainingBal,
      },
    });
    // console.log(order, newBalance);
    return res.json({
      ...order,
      ...newBalance,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "internal error",
    });
  }
};

export const closeOrder = async (req: authRequest, res: Response) => {
  try {
    const orderId = req.params;
    const user = req.user;
    // console.log(user.balance.balance);
    const order = await prismaClient.order.findUnique({
      where: {
        orderId: orderId.id,
        status: "OPEN",
      },
    });
    if (!order) {
      return res.status(400).json({
        message: "already closed or invalid order id",
      });
    }

    const { buyPrice, qty, margin, orderType, asset } = order;

    const currData = await redisClient.get(`last:price:${asset}`);
    if (!currData)
      return res.send({
        message: "redis queue not found",
      });
    const parsed = JSON.parse(currData);
    const currentPrice: number = parsed.currentPrice;
    const PnL: number =
      orderType === "LONG"
        ? (currentPrice - buyPrice.toNumber()) * qty.toNumber()
        : (buyPrice.toNumber() - currentPrice) * qty.toNumber();

    // console.log("before updated oder");
    const updatedOrder = prismaClient.order.update({
      where: {
        orderId: orderId.id,
      },
      data: {
        status: "CLOSED",
        finalPnL: new Prisma.Decimal(PnL),
      },
    });
    const remainingBal: number =
      parseInt(user.balance.balance) + margin.toNumber() + PnL;
    // console.log(user.id);

    const updatedBalance = await prismaClient.balance.update({
      where: {
        userId: user.id,
      },
      data: {
        balance: new Prisma.Decimal(remainingBal),
      },
    });
    // console.log(updatedOrder, updatedBalance);
    return res.json({
      updatedBalance,
    });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
};
