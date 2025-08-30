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
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/candles", candleRouter);
app.use("/api/v1/user", authRouter);
app.use("/api/v1/order", orderRouter);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
