import nodemailer from "nodemailer";

export const createTransporter = () => {

    const emailUser =
        process.env.EMAIL_USER ||
        process.env.GMAIL_USER ||
        process.env.SMTP_USER;

    let emailPass =
        process.env.EMAIL_PASS ||
        process.env.GMAIL_PASS ||
        process.env.SMTP_PASS;


    if (emailPass) {
        emailPass = emailPass.replace(/\s+/g, "");
    }


    if (!emailUser || !emailPass) {

        console.warn(
            "[SMTP WARNING] EMAIL_USER or EMAIL_PASS missing in .env file."
        );

        return null;
    }


    if (process.env.SMTP_HOST) {

        return nodemailer.createTransport({

            host: process.env.SMTP_HOST,

            port:
                Number(process.env.SMTP_PORT) || 587,

            secure:
                process.env.SMTP_SECURE === "true",

            auth: {
                user: emailUser,
                pass: emailPass
            }

        });

    }


    // Gmail SMTP

    return nodemailer.createTransport({

        host: "smtp.gmail.com",

        port: 465,

        secure: true,

        auth: {
            user: emailUser,
            pass: emailPass
        }

    });

};