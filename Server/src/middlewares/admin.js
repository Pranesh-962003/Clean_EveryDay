import { User } from "../models/User.js";

const verifyAdmin = async (req, res, next) => {
    try {

        const { uid } = req.user;

        const user = await User.findOne({
            uid,
            isDeleted: false
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (!user.isAdmin || user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access denied."
            });
        }

        req.dbUser = user;

        next();

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Authorization failed."
        });

    }
};

export default verifyAdmin;