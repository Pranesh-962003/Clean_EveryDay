import express from "express";
import verifySession from "../middlewares/verifySession.js";
import { getCurrentUser } from "../controllers/authController.js";
import upload from "../middlewares/multer.js";
import { addAddress, deleteAddress, getActiveBanners, setDefaultAddress, updateAddress, updateProfile } from "../controllers/userController.js";
import verifyToken from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.get("/current-user", verifyToken,getCurrentUser);
userRouter.post("/address", verifyToken, addAddress);
userRouter.put("/address/default/:addressId",verifyToken, setDefaultAddress);
userRouter.put("/address-update/:addressId",verifyToken,updateAddress);
userRouter.delete("/address-delete/:addressId", verifyToken, deleteAddress);
userRouter.put("/update-profile", verifyToken, upload.single("photo"), updateProfile);
userRouter.get("/banners-default", getActiveBanners);

export default userRouter;