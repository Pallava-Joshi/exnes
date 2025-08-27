## Options Trading Platform - similar to exnes

Start Docker:
`docker run -d --name some-timescaledb -p 5432:5432 -e POSTGRES_PASSWORD=password timescale/timescaledb:latest-pg17`

# connect using psql

```
docker run -it --net=host -e PGPASSWORD=password --rm timescale/timescaledb:latest-pg17 psql -h localhost -U postgres
```

\dx -> database
\dt -> tables

Binance API streaming data:
wss://fstream.binance.com/stream?streams=btcusdt@markPrice

{
"e": "markPriceUpdate", // Event type

# "E": 1562305380000, // Event time

# "s": "BTCUSDT", // Symbol

# "p": "11794.15000000", // Mark price

    "i": "11784.62659091",		// Index price
    "P": "11784.25641265",		// Estimated Settle Price, only useful in the last hour before the settlement starts
    "r": "0.00038167",       	// Funding rate
    "T": 1562306400000       	// Next funding time

}

DATABASE - 2 functions: pushTradeData(time, symbol, price), getCandles( shows data as a candle using H,L,C,O)
in db package -> the package.json file is exporting ts file - and it should be exporting js, so pnpm run dev first and export from dist folder

1m candles have real data (almost) -> no need to pull from db -> directly in memory storage
