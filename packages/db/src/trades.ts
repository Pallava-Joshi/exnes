import { pool } from "./pool";

type MarkPriceData = {
  E: number; // event time
  s: string; // symbol
  p: string; // price
};

export async function pushTradeDataToDb(data: MarkPriceData) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO trades (event_time, symbol, price)
       VALUES ($1, $2, $3)
       ON CONFLICT (symbol, event_time) DO NOTHING;`,
      [new Date(data.E), data.s, parseFloat(data.p)]
    );
  } finally {
    client.release();
  }
}

export async function getCandles(symbol: string, interval: string = "1 minute") {
  const res = await pool.query(
    `
    SELECT
      time_bucket($1, event_time) AS interval,
      first(price, event_time) AS open,
      max(price) AS high,
      min(price) AS low,
      last(price, event_time) AS close
    FROM trades
    WHERE symbol = $2
      AND event_time > NOW() - INTERVAL '1 day'
    GROUP BY interval
    ORDER BY interval;
    `,
    [interval, symbol]
  );

  return res.rows;
}
