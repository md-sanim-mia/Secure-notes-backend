import { asyncCatch } from "../../utilitys/async.catch";
import { sendResponse } from "../../utilitys/sendResponse";
import { authService } from "./auth.service";

const register = asyncCatch(async (req, res) => {
  const data = await authService.registerForDb(req.body);
  sendResponse(res, { statusCode: 201, message: "Registered", data });
});

const loginUser = asyncCatch(async (req, res) => {
  const data = await authService.loginForDb(req.body);
  sendResponse(res, { message: "Logged in", data });
});

const changePassword = asyncCatch(async (req, res) => {
  const data = await authService.changePasswordForDb(req.user!.id, req.body);
  sendResponse(res, { message: "Password changed", data });
});

export const authContllor = { register, loginUser, changePassword };
