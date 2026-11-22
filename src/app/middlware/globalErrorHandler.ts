import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import mongoose from "mongoose";
import { ZodError } from "zod";
import configs from "../config/configs";
import { TErrorSource } from "../interface/interface.error";
import { AppError } from "../utilitys/AppError";

const globalErrorHandler = (
  err: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errorSources: TErrorSource = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation error";
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation error";
    errorSources = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  } else if (err?.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyPattern || {}).join(", ");
    message = `${fields || "value"} already exists`;
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Token expired, please log in again";
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token";
  } else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Malformed JSON body";
  } else if (err?.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body too large";
  }

  if (statusCode === 500) {
    console.error(err); // eslint-disable-line no-console
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    ...(configs.node_env !== "production" && statusCode === 500
      ? { stack: err?.stack }
      : {}),
  });
};

export default globalErrorHandler;
