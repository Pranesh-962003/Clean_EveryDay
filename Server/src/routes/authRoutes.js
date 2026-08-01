import express from "express";
import verifyToken from "../middlewares/auth.js";
import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.js";
import { getCurrentUser, login, logout, register, sendPasswordResetOtp, verifyOtpAndResetPassword } from "../controllers/authController.js";
import verifySession from "../middlewares/verifySession.js";

const authRouter = express.Router();

authRouter.post("/register", verifyFirebaseToken, register);
authRouter.post("/login", verifyToken, login);
authRouter.post("/logout", logout);
authRouter.get("/me", getCurrentUser);
authRouter.post("/send-otp", sendPasswordResetOtp);
authRouter.post("/verify-otp-reset-password", verifyOtpAndResetPassword);

export default authRouter;