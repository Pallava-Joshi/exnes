import axiosInstance from "../lib/axios";

type OrderType = "long" | "short";

export const orderService = {
  createOrder: async (
    quantity: number,
    price: number,
    orderType: OrderType,
    symbol: string,
    takeProfit?: number,
    stopLoss?: number,
    leverage?: number
  ) => {
    const payload: {
      quantity: number;
      price: number;
      orderType: OrderType;
      symbol: string;
      takeProfit?: number;
      stopLoss?: number;
      leverage?: number;
    } = { quantity, price, orderType, symbol };

    if (takeProfit !== undefined) payload.takeProfit = takeProfit;
    if (stopLoss !== undefined) payload.stopLoss = stopLoss;
    if (leverage !== undefined) payload.leverage = leverage;

    const response = await axiosInstance.post("/trades/orders", payload);
    return response.data;
  },
  getOrders: async () => {
    const response = await axiosInstance.get("/trades/orders");
    return response.data;
  },
  closeOrder: async (id: string) => {
    const response = await axiosInstance.post(`/trades/orders/${id}/close`);
    return response.data;
  },
};
