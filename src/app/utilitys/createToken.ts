import jwt, { SignOptions } from "jsonwebtoken";
import configs from "../config/configs";

export const createToken = (
  userId: string,
  role: string,
  tokenVersion: number
) => {
  return jwt.sign({ role, tv: tokenVersion }, configs.jwt_secret, {
    subject: userId,
    algorithm: "HS256",
    expiresIn: configs.jwt_expires_in as SignOptions["expiresIn"],
  });
};
