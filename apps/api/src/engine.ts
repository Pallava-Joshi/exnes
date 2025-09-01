import { redisClient } from "@repo/redis/client";
import { prismaClient } from "@repo/db/prisma";

async function fetchLatestOrders() {
  const orders = await prismaClient.order.findMany({
    where: { status: "OPEN" },
    include: {
      user: {
        include: {
          balance: true,
        },
      },
    },
  });
  if (orders.length === 0) console.log("no orders yet");
  return orders;
}

function isStopLoss(PnL: number, stopLoss: number): boolean {
  if (PnL < 0 && Math.abs(PnL) >= stopLoss) {
    return true;
  }
  return false;
}

function isTakeProfit(PnL: number, takeProfit: number): boolean {
  if (PnL > 0 && PnL >= takeProfit) {
    return true;
  }
  return false;
}

function isMarginCall(PnL: number, margin: number): boolean {
  if (PnL < 0 && Math.abs(PnL) >= margin) {
    return true;
  }
  return false;
}

async function closeOrder(PnL: number, processingOrder: any) {
  const updatedOrder = await prismaClient.order.update({
    where: {
      orderId: processingOrder.orderId,
    },
    data: {
      finalPnL: PnL,
    },
  });
  // const processingUser = await prismaClient.user.
  const calculatedBalance =
    processingOrder.user.balance.balance + processingOrder.margin + PnL;
  const updatedBalance = await prismaClient.balance.update({
    where: {
      id: processingOrder.userId,
    },
    data: {
      balance: calculatedBalance,
    },
  });
  return { updatedBalance, updatedOrder };
}

async function liquidator() {}
//immediate invoked funtion expression => calls itself on start
(async function tick() {
  const channels = ["trade-data"];

  try {
    await redisClient.subscribe(...channels);
    console.log("[redis] subscribed(BE): ", channels.join(", "));
  } catch (error) {
    console.error("[redis] subscription error:", error);
    process.exit(1);
  }

  redisClient.on("message", async (channel, message) => {
    const latestOrders = await fetchLatestOrders();
    const parsedData = JSON.parse(message);
    const { p: currentPrice, s: token } = parsedData;

    const relevantOrders = latestOrders.filter(
      (order) => order.asset === token
    );

    if (relevantOrders.length === 0) {
      console.log(`[${token}] No open orders for this asset`);
      return;
    }
    for (const processingOrder of latestOrders) {
      const { buyPrice, qty, margin, stopLoss, takeProfit, orderType } =
        processingOrder;
      //   if (token !== asset) continue;
      const PnL: number =
        orderType === "LONG"
          ? (currentPrice - buyPrice.toNumber()) * qty.toNumber()
          : (buyPrice.toNumber() - currentPrice) * qty.toNumber();
      const b1 = stopLoss ? isStopLoss(PnL, stopLoss.toNumber()) : false;
      const b2 = takeProfit ? isTakeProfit(PnL, takeProfit.toNumber()) : false;

      if (isMarginCall(PnL, margin.toNumber()) || b1 || b2) {
        closeOrder(PnL, processingOrder);
      }
    }
  });
})();
