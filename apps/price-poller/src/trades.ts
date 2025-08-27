import { Pool } from "pg";

export const pool = new Pool({
  connectionString: "postgres://postgres:password@localhost:5432/postgres",
});

type MarkPriceData = {
  E: number; // event time
  s: string; // symbol
  p: string; // price
};

export async function schema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS timescaledb;

    CREATE TABLE IF NOT EXISTS trades (
      event_time timestamptz NOT NULL,
      symbol text NOT NULL,
      price double precision NOT NULL,
      PRIMARY KEY (symbol, event_time)
    );

    SELECT create_hypertable('trades', 'event_time', if_not_exists => TRUE);

    CREATE INDEX IF NOT EXISTS idx_trades_symbol_event_time
    ON trades(symbol, event_time DESC);
  `);
}


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
