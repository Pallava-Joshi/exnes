import WebSocket from 'ws';

const ws = new WebSocket('wss://fstream.binance.com/stream?streams=btcusdt@markPrice');

ws.on('error', console.error);

ws.on('message', function message(data) {
  console.log('received: %s', data);
});