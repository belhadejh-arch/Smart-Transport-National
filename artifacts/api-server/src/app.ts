import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
  skipSuccessfulRequests: true,
});

app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api", router);

// ── Serve Expo web static build (production single-service deploy, e.g. Render) ──
// Resolve the mobile dist folder. In production, the api-server is run from `artifacts/api-server`,
// so the mobile build is at `../mobile/dist`. WEB_DIST env var overrides this if needed.
const webDistDir = process.env["WEB_DIST"]
  ? path.resolve(process.env["WEB_DIST"])
  : path.resolve(process.cwd(), "../mobile/dist");

if (fs.existsSync(webDistDir)) {
  logger.info({ webDistDir }, "Serving Expo web static build");
  app.use(express.static(webDistDir, { maxAge: "1h", index: false }));

  // SPA fallback: any non-/api route returns index.html
  app.get(/^(?!\/api).*/, (_req: Request, res: Response, next: NextFunction) => {
    const indexHtml = path.join(webDistDir, "index.html");
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      next();
    }
  });
} else {
  logger.warn({ webDistDir }, "Mobile web dist not found — API will only serve /api routes");
}

export default app;
