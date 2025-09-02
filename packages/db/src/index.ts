// db.ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: "postgresql://postgres:password@localhost:5432/market",
  max: 10,
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

// Candle interval config
const intervals = {
  "1m": {
    bucket: "1 minute",
    start: "2 days",
    end: "1 minute",
    schedule: "1 minute",
  },
  "5m": {
    bucket: "1 minute",
    start: "2 days",
    end: "1 minute",
    schedule: "1 minute",
  },
  "15m": {
    bucket: "15 minutes",
    start: "15 days",
    end: "5 minutes",
    schedule: "5 minutes",
  },
  "30m": {
    bucket: "30 minutes",
    start: "30 days",
    end: "15 minutes",
    schedule: "15 minutes",
  },
  "1h": {
    bucket: "1 hour",
    start: "90 days",
    end: "15 minutes",
    schedule: "15 minutes",
  },
  "4h": {
    bucket: "4 hours",
    start: "180 days",
    end: "1 hour",
    schedule: "1 hour",
  },
  "1d": {
    bucket: "1 day",
    start: "365 days",
    end: "1 hour",
    schedule: "1 hour",
  },
  "7d": {
    bucket: "7 days",
    start: "730 days",
    end: "1 day",
    schedule: "1 day",
  },
  "30d": {
    bucket: "30 days",
    start: "5 years",
    end: "1 day",
    schedule: "1 day",
  },
} as const;
type IntervalKey = keyof typeof intervals;

/**
 * Ensures schema, hypertable, and continuous aggregates exist.
 */
export async function schema() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Base table
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS timescaledb;

      CREATE TABLE IF NOT EXISTS trades (
        trade_id BIGINT NOT NULL,
        event_time TIMESTAMPTZ NOT NULL,
        trade_time TIMESTAMPTZ NOT NULL,
        symbol VARCHAR(25) NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        quantity DOUBLE PRECISION NOT NULL,
        PRIMARY KEY (event_time, trade_id)
      );

      SELECT create_hypertable('trades', 'event_time', if_not_exists => TRUE);

      CREATE INDEX IF NOT EXISTS idx_trades_symbol_event_time
        ON trades(symbol, event_time DESC);
    `);

    // Continuous aggregates
    for (const [name, cfg] of Object.entries(intervals)) {
      const viewName = `candles_${name}`;

      await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${viewName}
        WITH (timescaledb.continuous) AS
        SELECT
          time_bucket('${cfg.bucket}', event_time) AS bucket,
          symbol,
          first(price, event_time) AS open,
          max(price)                AS high,
          min(price)                AS low,
          last(price, event_time)   AS close,
          sum(quantity)             AS volume
        FROM trades
        GROUP BY bucket, symbol
        WITH NO DATA;

        CREATE INDEX IF NOT EXISTS idx_${viewName}_symbol_bucket
          ON ${viewName}(symbol, bucket DESC);
      `);

      // Add refresh policy if not exists
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM timescaledb_information.jobs j
            WHERE j.proc_name = 'policy_refresh_continuous_aggregate'
              AND j.hypertable_name = '${viewName}'
          ) THEN
            PERFORM add_continuous_aggregate_policy(
              '${viewName}',
              start_offset => INTERVAL '${cfg.start}',
              end_offset   => INTERVAL '${cfg.end}',
              schedule_interval => INTERVAL '${cfg.schedule}'
            );
          END IF;
        END$$;
      `);
    }

    await client.query("COMMIT");
    console.log("Schema & aggregates ensured ✅");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Insert a trade into the DB
 */
export async function pushTradeDataToDb(data: TradeData) {
  await pool.query(
    `INSERT INTO trades (trade_id, event_time, trade_time, symbol, price, quantity)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING;`,
    [
      data.t,
      new Date(data.E),
      new Date(data.T),
      data.s,
      parseFloat(data.p),
      parseFloat(data.q),
    ]
  );
}

/**
 * Generic candle fetcher
 */
export async function getCandles(
  symbol: string,
  interval: IntervalKey,
  start?: number,
  end?: number
) {
  const conditions: string[] = ["symbol = $1"];
  const params: any[] = [symbol];
  let idx = 2;

  if (start) {
    conditions.push(`bucket >= to_timestamp($${idx++}/1000.0)`);
    params.push(start);
  }
  if (end) {
    conditions.push(`bucket <= to_timestamp($${idx++}/1000.0)`);
    params.push(end);
  }

  const res = await pool.query(
    `SELECT bucket, open, high, low, close, volume
     FROM candles_${interval}
     WHERE ${conditions.join(" AND ")}
     ORDER BY bucket;`,
    params
  );

  return res.rows;
}

/**
 * Dynamically generated wrappers (e.g. getCandles_1m)
 */
export const candleFetchers = Object.fromEntries(
  (Object.keys(intervals) as IntervalKey[]).map((key) => [
    `getCandles_${key}`,
    (s: string, a?: number, b?: number) => getCandles(s, key, a, b),
  ])
) as Record<
  `getCandles_${IntervalKey}`,
  (s: string, a?: number, b?: number) => Promise<any>
>;

/**
 * Distinct symbols
 */
export async function getSymbols() {
  const res = await pool.query(`
    SELECT DISTINCT symbol
    FROM trades
    ORDER BY symbol
  `);
  return res.rows.map((r) => r.symbol);
}
