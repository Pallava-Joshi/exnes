import { Pool } from "pg";

export const pool = new Pool({
  connectionString: "postgresql://postgres:password@localhost:5432/postgres",
});

// Type definition for Binance trade stream
export type TradeData = {
  e: string; // "trade"
  E: number; // Event time
  s: string; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  T: number; // Trade time
};

// Initialize schema + continuous aggregates
export async function schema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS timescaledb;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trades (
      trade_id BIGINT NOT NULL,
      event_time TIMESTAMPTZ NOT NULL,
      trade_time TIMESTAMPTZ NOT NULL,
      symbol VARCHAR(25) NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      quantity DOUBLE PRECISION NOT NULL,
      PRIMARY KEY (event_time, trade_id)
    );
  `);

  await pool.query(`
    SELECT create_hypertable('trades', 'event_time', if_not_exists => TRUE);
  `);

  // Create continuous aggregates for multiple resolutions
  const intervals = [
    "1 minute",
    "5 minute",
    "15 minute",
    "30 minute",
    "1 hour",
    "4 hour",
    "1 day",
    "7 day",
    "30 day",
  ];

  for (const interval of intervals) {
    const viewName = `candles_${interval.replace(" ", "")}`;

    await pool.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${viewName}
      WITH (timescaledb.continuous) AS
      SELECT time_bucket('${interval}', event_time) AS bucket,
             symbol,
             first(price, event_time) AS open,
             max(price) AS high,
             min(price) AS low,
             last(price, event_time) AS close
      FROM trades
      GROUP BY time_bucket('${interval}', event_time), symbol;
    `);

    // await pool.query(`
    //   SELECT add_continuous_aggregate_policy('${viewName}'::regclass,
    //     start_offset => NULL,
    //     end_offset => '${interval}'::interval,
    //     schedule_interval => '${interval}'::interval
    //   );
    // `);
  }

  console.log("Schema & aggregates ensured");
}

// Insert trade data into DB
export async function pushTradeDataToDb(data: TradeData) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO trades (trade_id, event_time, trade_time, symbol, price, quantity)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [
        data.t,
        new Date(data.E),
        new Date(data.T),
        data.s,
        parseFloat(data.p),
        parseFloat(data.q),
      ]
    );
  } finally {
    client.release();
  }
}

// Generic function to fetch candles
async function getCandles(symbol: string, interval: string) {
  const res = await pool.query(
    `SELECT bucket, open, high, low, close
     FROM candles_${interval}
     WHERE symbol = $1
     ORDER BY bucket;`,
    [symbol]
  );
  return res.rows;
}

// Wrappers for common resolutions
export async function getCandles_1m(symbol: string) {
  return getCandles(symbol, "1minute");
}
export async function getCandles_5m(symbol: string) {
  return getCandles(symbol, "5minute");
}
export async function getCandles_15m(symbol: string) {
  return getCandles(symbol, "15minute");
}
export async function getCandles_30m(symbol: string) {
  return getCandles(symbol, "30minute");
}
export async function getCandles_1h(symbol: string) {
  return getCandles(symbol, "1hour");
}
export async function getCandles_4h(symbol: string) {
  return getCandles(symbol, "4hour");
}
export async function getCandles_1d(symbol: string) {
  return getCandles(symbol, "1day");
}
export async function getCandles_7d(symbol: string) {
  return getCandles(symbol, "7day");
}
export async function getCandles_30d(symbol: string) {
  return getCandles(symbol, "30day");
}
