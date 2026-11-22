import { Response } from "express";
import { TPageMeta } from "./pagination";

type TSendResponse<T> = {
  statusCode?: number;
  message: string;
  data: T;
  meta?: TPageMeta;
};

export const sendResponse = <T>(res: Response, payload: TSendResponse<T>) => {
  res.status(payload.statusCode ?? 200).json({
    success: true,
    message: payload.message,
    ...(payload.meta && { meta: payload.meta }),
    data: payload.data,
  });
};
