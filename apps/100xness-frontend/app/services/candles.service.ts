import publicAxios from "../lib/axios";

export const candlesService = {
  getCandles: async (
    timestamp: string,
    startTime: number,
    endTime: number,
    asset: string
  ) => {
    const response = await publicAxios.get(
      `/candles?ts=${timestamp}&startTime=${startTime}&endTime=${endTime}&asset=${asset}`
    );
    return response.data.candles;
  },
  getSymbols: async () => {
    const response = await publicAxios.get("/candles/symbols");
    // console.log(response.data.symbols);
    return response.data.symbols;
  },
};
