import express from "express";
import verifyToken from "../middlewares/auth.js";
import { addLeadActivity, addLeadComment, addLeadReminder, addLeadTask, createAdminLead, createLead, getAllLeads, updateLeadProfile, updateLeadStatus, updateLeadTask } from "../controllers/leadController.js";
import verifyAdmin from "../middlewares/admin.js";




const leadRouter = express.Router();


//Customer Lead-Route
leadRouter.post("/create",verifyToken,createLead);


// Admin Lead-Route
leadRouter.get("/admin/leads/all",verifyToken,verifyAdmin,getAllLeads);
leadRouter.post("/admin/create-lead",verifyToken,verifyAdmin,createAdminLead);
leadRouter.patch("/admin/:id/status",verifyToken,verifyAdmin,updateLeadStatus);
leadRouter.patch("/admin/:id/profile",verifyToken,verifyAdmin,updateLeadProfile);
leadRouter.post("/admin/:id/activities",verifyToken,verifyAdmin,addLeadActivity);
leadRouter.post("/admin/:id/tasks",verifyToken,verifyAdmin,addLeadTask);
leadRouter.patch("/admin/:leadId/tasks/:taskId",verifyToken,verifyAdmin,updateLeadTask);
leadRouter.post("/admin/:id/reminders",verifyToken,verifyAdmin,addLeadReminder);
leadRouter.post("/admin/:id/comments",verifyToken,verifyAdmin,addLeadComment);

export default leadRouter;