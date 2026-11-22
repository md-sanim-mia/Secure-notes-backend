import express from "express";
import rateLimit from "express-rate-limit";
import auth from "../../middlware/auth";
import { validationRequest } from "../../middlware/validationRequest";
import { authContllor } from "./authContllor";
import { authValidation } from "./authValidation";

const router = express.Router();

// brute-force protection on the credential endpoints
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again later" },
});

router.post(
  "/register",
  credentialsLimiter,
  validationRequest(authValidation.registerSchema),
  authContllor.register
);
router.post(
  "/login",
  credentialsLimiter,
  validationRequest(authValidation.loginSchema),
  authContllor.loginUser
);
router.patch(
  "/change-password",
  auth("user", "admin"),
  validationRequest(authValidation.changePasswordSchema),
  authContllor.changePassword
);

export const authRouters = router;
