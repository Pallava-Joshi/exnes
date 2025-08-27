import WebSocket from 'ws';
import { pushTradeDataToDb, schema } from '@repo/db/trades'

const ws = new WebSocket('wss://fstream.binance.com/stream?streams=btcusdt@markPrice');

ws.on('error', console.error);

ws.on('message', async function message(data) {
  const parseData = JSON.parse(data.toString());
  const marketData = parseData.data;

  // const time = marketData.E;
  // const symbol = marketData.s;
  // const marketPrice = marketData.p;

  await schema();
  await pushTradeDataToDb(marketData);
  console.log('Data sent to db');
});