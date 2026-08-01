import { User } from "../models/User.js";
import { getAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";

export const register = async (req, res) => {
    try {

        const {
            uid,
            name,
            email,
            picture,
            phone_number,
            email_verified
        } = req.user;
        console.log(  uid,
            name,
            email,
            picture,
            phone_number,
            email_verified);

        const bodyName = req.body?.name || req.body?.fullName;
        const bodyPhone = req.body?.phone || req.body?.phoneNumber;

        // Check if user already exists
        const userEmail = email || req.body?.email;
        const queryConditions = [{ isDeleted: false }];
        const orConditions = [];
        if (userEmail) orConditions.push({ email: userEmail });
        if (uid) orConditions.push({ uid: uid });

        const existingUser = orConditions.length > 0
            ? await User.findOne({ isDeleted: false, $or: orConditions })
            : null;

        if (existingUser) {
            existingUser.lastLogin = new Date();
            if (!existingUser.uid && uid) {
                existingUser.uid = uid;
            }
            await existingUser.save();

            try {
                const token = req.headers.authorization?.split(" ")[1];
                if (token) {
                    const sessionCookie = await getAuth().createSessionCookie(
                        token,
                        { expiresIn: 1000 * 60 * 60 * 24 * 5 }
                    );

                    res.cookie("session", sessionCookie, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 1000 * 60 * 60 * 24 * 5,
                        path: "/"
                    });
                }
            } catch (sessionErr) {
                console.warn("Could not create session cookie for existing user:", sessionErr.message);
            }

            return res.status(200).json({
                success: true,
                message: "User already registered",
                user: existingUser,
            });
        }

        // Create new user using decoded token claims + req.body form inputs
        const user = await User.create({
            uid,
            name: bodyName || name || "User",
            email: email || req.body?.email,
            photoURL: picture || "",
            phoneNumber: bodyPhone || phone_number || "",
            isEmailVerified: email_verified,
            lastLogin: new Date(),
        });

        // Set session cookie on successful registration
        try {
            const sessionCookie = await getAuth().createSessionCookie(
                req.headers.authorization.split(" ")[1],
                { expiresIn: 1000 * 60 * 60 * 24 * 5 }
            );

            res.cookie("session", sessionCookie, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 1000 * 60 * 60 * 24 * 5,
                path: "/"
            });
        } catch (sessionErr) {
            console.warn("Could not create session cookie during registration:", sessionErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "Registration Successful",
            user,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Registration Failed",
            error: error.message,
        });

    }
};


//Login controller
export const login = async (req, res) => {

    try {

        const { uid } = req.user;

        const user = await User.findOne({
            uid,
            isDeleted: false,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please register first.",
            });
        }

        user.lastLogin = new Date();

        await user.save();
        console.log(user.email);
        
        const sessionCookie = await getAuth().createSessionCookie(
            req.token,
            {
                expiresIn: 1000 * 60 * 60 * 24 * 5 // 5 Days
            }
        );

        res.cookie("session", sessionCookie, {
            httpOnly: true,
            secure: false, // change to true in production
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 5
        });

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            user,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Login Failed",
            error: error.message,
        });

    }

};


//Logout Controller

export const logout = async (req, res) => {
    try {

        res.clearCookie("session", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Logout failed.",
            error: error.message
        });

    }
};


// authController.js

export const getCurrentUser = async (req, res) => {
    try {

        const sessionCookie = req.cookies?.session;

        if (!sessionCookie) {
            return res.status(200).json({
                success: true,
                user: null
            });
        }

        const decodedClaims = await getAuth().verifySessionCookie(
            sessionCookie,
            true
        );

        const { uid } = decodedClaims;

        const user = await User.findOne({
            uid,
            isDeleted: false,
        }).select("-__v");

        if (!user) {
            return res.status(200).json({
                success: true,
                user: null
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {

        console.error("Session verification failed in getCurrentUser:", error.message);

        return res.status(200).json({
            success: true,
            user: null
        });

    }
};

// Create nodemailer transporter
const createTransporter = () => {
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;
    let emailPass = process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.SMTP_PASS;
    
    if (emailPass) {
        emailPass = emailPass.replace(/\s+/g, "");
    }

    if (!emailUser || !emailPass) {
        console.warn("[SMTP WARNING] EMAIL_USER or EMAIL_PASS missing in .env file.");
        return null;
    }

    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });
    }

    // Gmail SMTP Transport over SSL (Port 465)
    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });
};

// Send 6-Digit OTP for Password Reset
export const sendPasswordResetOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            isDeleted: false,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No registered account found with this email address.",
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes expiration

        user.resetOtp = otp;
        user.resetOtpExpires = otpExpires;
        await user.save();

        console.log(`\n==================================================`);
        console.log(`[OTP VERIFICATION] 6-Digit OTP for ${user.email}: ${otp}`);
        console.log(`==================================================\n`);

        const transporter = createTransporter();
        if (transporter) {
            try {
                const info = await transporter.sendMail({
                    from: process.env.EMAIL_FROM || '"Clean Everyday" <noreply@cleaneveryday.in>',
                    to: user.email,
                    subject: "Your 6-Digit Password Reset OTP - Clean Everyday",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                            <h2 style="color: #10b981; margin-bottom: 10px;">Password Reset OTP</h2>
                            <p style="color: #555;">Use the following 6-digit OTP code to reset your password. This code expires in 10 minutes.</p>
                            <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                                <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111827;">${otp}</span>
                            </div>
                            <p style="color: #888; font-size: 12px;">If you did not request this password reset, please ignore this message.</p>
                        </div>
                    `,
                });
                console.log(`[SMTP SUCCESS] OTP email sent successfully to ${user.email} (MessageId: ${info.messageId})`);
            } catch (emailErr) {
                console.error("[SMTP ERROR] Could not send OTP email via SMTP:", emailErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: "A 6-digit OTP code has been sent to your email address.",
            devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
        });

    } catch (error) {
        console.error("sendPasswordResetOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP.",
            error: error.message,
        });
    }
};

// Verify OTP and Reset Password in Firebase & Database
export const verifyOtpAndResetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP, and new password are required.",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long.",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            isDeleted: false,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found.",
            });
        }

        if (!user.resetOtp || user.resetOtp.trim() !== otp.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP code. Please check and try again.",
            });
        }

        if (user.resetOtpExpires && new Date() > new Date(user.resetOtpExpires)) {
            return res.status(400).json({
                success: false,
                message: "OTP code has expired. Please request a new OTP.",
            });
        }

        // Update password in Firebase Auth via Firebase Admin SDK
        try {
            await getAuth().updateUser(user.uid, {
                password: newPassword,
            });
        } catch (fbErr) {
            console.error("Firebase Password Update Error:", fbErr);
            return res.status(500).json({
                success: false,
                message: "Failed to update password in Firebase: " + fbErr.message,
            });
        }

        // Clear OTP fields
        user.resetOtp = null;
        user.resetOtpExpires = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully! You can now log in with your new password.",
        });

    } catch (error) {
        console.error("verifyOtpAndResetPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reset password.",
            error: error.message,
        });
    }
};


