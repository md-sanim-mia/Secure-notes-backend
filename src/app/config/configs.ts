import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export default {
  port: Number(process.env.PORT) || 6001,
  node_env: process.env.NODE_ENV || "development",
  mongodb_url: required("DATABASE_URL"),
  jwt_secret: required("JWT_SECRET"),
  jwt_expires_in: process.env.JWT_EXPIRES_IN || "1d",
  bcrypt_rounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  client_urls: (process.env.CLIENT_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
};
