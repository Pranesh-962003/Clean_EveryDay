import { getAuth } from "firebase-admin/auth";

const verifyFirebaseToken = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const token = authHeader.split(" ")[1];

        const decodedToken = await getAuth().verifyIdToken(token);

        req.user = decodedToken;

        next();

    } catch (error) {

        console.error(error);

        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }
};

export default verifyFirebaseToken;