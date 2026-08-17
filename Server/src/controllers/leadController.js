import { addLeadActivityService, addLeadCommentService, addLeadReminderService, addLeadTaskService, createAdminLeadService, getAllLeadsService, updateLeadProfileStatusService, updateLeadStatusService, updateLeadTaskService } from "../services/leadService.js";
import { createLeadService } from "../services/leadService.js";
import { emitToAdmin } from "../socket/index.js";

/* =========================================================
   CREATE LEAD FROM CUSTOMER ENQUIRY
========================================================= */


export const createLead = async (req, res) => {

    try {

        const result = await createLeadService(req);

        // Real-time synchronization
        emitToAdmin("lead:created", { lead: result });

        return res.status(201).json({

            success: true,

            message: "Your enquiry has been submitted successfully.",

            lead: result

        });

    } catch (error) {

        console.error(
            "[CREATE LEAD ERROR]",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message || "Failed to submit enquiry."

        });

    }

};




export const getAllLeads = async (req, res) => {

    try {

        const leads = await getAllLeadsService();

        return res.status(200).json({

            success: true,

            count: leads.length,

            leads

        });

    } catch (error) {

        console.error(
            "[GET ALL LEADS ERROR]",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch leads."

        });

    }

};


// =====================================================
// CREATE LEAD FROM ADMIN PANEL
// =====================================================

export const createAdminLead = async (req, res) => {

    try {

        const lead =
            await createAdminLeadService(req);

        // Real-time synchronization
        emitToAdmin("lead:created", { lead });

        return res.status(201).json({

            success: true,

            message:
                "Lead created successfully.",

            lead

        });

    } catch (error) {

        console.error(
            "[ADMIN CREATE LEAD ERROR]",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

};




export const updateLeadStatus = async (req, res) => {

    try {

        const lead =
            await updateLeadStatusService(req);

        // Real-time synchronization
        emitToAdmin("lead:updated", { lead });

        return res.status(200).json({

            success: true,

            message:
                "Lead status updated successfully.",

            lead

        });

    } catch (error) {

        console.error(
            "[UPDATE LEAD STATUS ERROR]",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

};


export const updateLeadProfile = async (req, res) => {

    try {

        const lead =
            await updateLeadProfileStatusService(req);

        // Real-time synchronization
        emitToAdmin("lead:updated", { lead });

        return res.status(200).json({

            success: true,

            message:
                "Lead profile updated successfully.",

            lead

        });

    } catch (error) {

        console.error(
            "[UPDATE LEAD PROFILE ERROR]",
            error
        );


        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


export const addLeadActivity = async (req, res) => {

    try {

        const activity =
            await addLeadActivityService(req);

        // Real-time synchronization
        emitToAdmin("lead:activityAdded", { leadId: req.params.id, activity });
        emitToAdmin("lead:updated", { leadId: req.params.id });

        return res.status(201).json({

            success: true,

            message:
                "Activity added successfully.",

            activity

        });

    } catch (error) {

        console.error(
            "[ADD LEAD ACTIVITY ERROR]",
            error
        );


        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};



export const addLeadTask = async (req, res) => {

    try {

        const task =
            await addLeadTaskService(req);

        // Real-time synchronization
        emitToAdmin("lead:taskUpdated", { leadId: req.params.id, task });
        emitToAdmin("lead:updated", { leadId: req.params.id });

        return res.status(201).json({

            success: true,

            message: "Task added successfully.",

            task

        });

    } catch (error) {

        console.error(
            "[ADD LEAD TASK ERROR]",
            error
        );


        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


export const updateLeadTask = async (req, res) => {

    try {

        const task =
            await updateLeadTaskService(req);

        // Real-time synchronization
        emitToAdmin("lead:taskUpdated", { leadId: req.params.leadId, task });
        emitToAdmin("lead:updated", { leadId: req.params.leadId });

        return res.status(200).json({

            success: true,

            message:
                task.completed
                    ? "Task completed successfully."
                    : "Task marked as incomplete.",

            task

        });

    } catch (error) {

        console.error(
            "[UPDATE LEAD TASK ERROR]",
            error
        );


        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


export const addLeadReminder = async (req, res) => {

    try {

        const reminder =
            await addLeadReminderService(req);

        // Real-time synchronization
        emitToAdmin("lead:reminderAdded", { leadId: req.params.id, reminder });
        emitToAdmin("lead:updated", { leadId: req.params.id });

        return res.status(201).json({

            success: true,

            message: "Reminder scheduled successfully.",

            reminder

        });

    } catch (error) {

        console.error(
            "[ADD LEAD REMINDER ERROR]",
            error
        );


        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


export const addLeadComment = async (req, res) => {

    try {

        const comment =
            await addLeadCommentService(req);

        return res.status(201).json({

            success: true,

            message: "Comment added successfully.",

            comment

        });

    } catch (error) {

        console.error(
            "[ADD LEAD COMMENT ERROR]",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};