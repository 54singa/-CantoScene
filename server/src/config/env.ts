import process from "node:process";

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  databaseUrl: string;
  frontendOrigin: string;
  jwtAccessSecret: string;
};

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  if (!jwtAccessSecret || jwtAccessSecret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must contain at least 32 characters");
  }

  return {
    nodeEnv: nodeEnv as AppConfig["nodeEnv"],
    host: process.env.HOST ?? "127.0.0.1",
    port: parsePort(process.env.PORT),
    databaseUrl,
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:5173",
    jwtAccessSecret,
  };
}
