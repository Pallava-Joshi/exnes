import { useQuery } from "@tanstack/react-query";
import { candlesService } from "../services/candles.service";
import { useState } from "react";
import { Candle } from "../types/candle.type";

export const useGetCandles = (
  timestamp: string,
  startTime: number,
  endTime: number,
  asset: string
) => {
  const [priceData, setPriceData] = useState<Candle[]>([]);
  return useQuery({
    queryKey: ["candles", timestamp, startTime, endTime, asset],
    queryFn: () =>
      candlesService
        .getCandles(timestamp, startTime, endTime, asset)
        .then((data) => {
          setPriceData(data);
          console.log(data.timestamp);
          return data;
        }),
  });
};

export const useGetSymbols = () => {
  return useQuery({
    queryKey: ["symbols"],
    queryFn: () => candlesService.getSymbols(),
  });
};
