import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { candleRouter } from "./routes/candles";
import { orderRouter } from "./routes/order";

const app = express();
const port = 3001;
dotenv.config();
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/candles", candleRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/orders", orderRouter);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
