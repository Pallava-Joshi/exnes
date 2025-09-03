export interface Candle {
  timestamp: number; // epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number; // sometimes missing?
  symbol?: string; // if needed
}
