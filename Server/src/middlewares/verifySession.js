import { getAuth } from "firebase-admin/auth";

const verifySession = async (req, res, next) => {

    try {

        const sessionCookie = req.cookies.session;

        if (!sessionCookie) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const decodedClaims = await getAuth().verifySessionCookie(
            sessionCookie,
            true
        );

        req.user = decodedClaims;

        next();

    } catch (error) {

        console.error(error);

        return res.status(401).json({
            success: false,
            message: "Invalid or Expired Session"
        });

    }

};

export default verifySession;