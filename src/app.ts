import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import configs from "./app/config/configs";
import globalErrorHandler from "./app/middlware/globalErrorHandler";
import router from "./app/routers";

const app: Application = express();

app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(
  cors({
    // the bundled frontend is same-origin; extra origins come from CLIENT_URLS
    origin: configs.client_urls,
  })
);


app.use("/api/v1", router);

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});
app.use(globalErrorHandler);

export default app;
