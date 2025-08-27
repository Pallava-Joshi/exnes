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

    CREATE TABLE IF NOT EXISTS TRADES (
      event_time timestamptz NOT NULL,
      symbol text NOT NULL,
      price double precision NOT NULL,
      PRIMARY KEY (symbol, event_time)
    );

    SELECT create_hypertable('TRADES', 'event_time', if_not_exists => TRUE);

    CREATE INDEX IF NOT EXISTS idx_TRADES_symbol_event_time
    ON TRADES(symbol, event_time DESC);
  `);
}

export async function pushTradeDataToDb(data: MarkPriceData) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO TRADES (event_time, symbol, price)
       VALUES ($1, $2, $3)
       ON CONFLICT (symbol, event_time) DO NOTHING;`,
      [new Date(data.E), data.s, parseFloat(data.p)]
    );
  } finally {
    client.release();
  }
}

async function getCandles(symbol: string, bucketSize: string) {
  const res = await pool.query(
    `
    SELECT
      bucket,
      (ARRAY_AGG(price ORDER BY event_time ASC))[1] AS open,
      MAX(price) AS high,
      MIN(price) AS low,
      (ARRAY_AGG(price ORDER BY event_time DESC))[1] AS close
    FROM (
      SELECT
        time_bucket($2, event_time) AS bucket,
        price,
        event_time
      FROM TRADES
      WHERE symbol = $1
    ) AS sub
    GROUP BY bucket
    ORDER BY bucket;
    `,
    [symbol, bucketSize]
  );
  return res.rows;
}

// Wrappers
export async function getCandles_5m(symbol: string) {
  return getCandles(symbol, "5 minutes");
}

export async function getCandles_15m(symbol: string) {
  return getCandles(symbol, "15 minutes");
}

export async function getCandles_1h(symbol: string) {
  return getCandles(symbol, "1 hour");
}

export async function getCandles_1d(symbol: string) {
  return getCandles(symbol, "1 day");
}

export async function getCandles_7d(symbol: string) {
  return getCandles(symbol, "7 days");
}
