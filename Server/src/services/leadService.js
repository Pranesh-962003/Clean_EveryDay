import { Lead } from "../models/Lead.js";
import { User } from "../models/User.js";



/* =========================================================
   CREATE CUSTOMER ENQUIRY
========================================================= */
export const createLeadService = async (req) => {

    const {
        fullName,
        email,
        phoneNumber,
        companyName,
        subject,
        category,
        message
    } = req.body;


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!fullName) {
        throw new Error("Full name is required.");
    }

    if (!email) {
        throw new Error("Email address is required.");
    }

    if (!message) {
        throw new Error("Enquiry description is required.");
    }


    /* =====================================================
       FIND LOGGED-IN USER
    ===================================================== */

    const { uid } = req.user || {};

    let customer = null;

    if (uid) {

        customer = await User.findOne({
            uid,
            isDeleted: false
        });

    }


    /* =====================================================
       CREATE LEAD
    ===================================================== */

    const lead = new Lead({

        /* Client details */
        customer: customer ? customer._id : null,

        clientName: fullName.trim(),

        email: email.toLowerCase().trim(),

        phoneNumber: phoneNumber
            ? phoneNumber.trim()
            : "",

        companyName: companyName
            ? companyName.trim()
            : "",


        /* Enquiry */
        subject: subject
            ? subject.trim()
            : "General Enquiry",

        category: category || "General Support",

        source: "Web Inquiry",

        message: message.trim(),


        /* CRM priority */
        priority: (req.body.priority && ["Low", "Medium", "High"].includes(req.body.priority))
            ? req.body.priority
            : "Medium",

        status: "New",


        /* Creator */
        createdBy: null,


        /* First activity */
        activities: [
            {
                type: "Lead Created",

                title: "Lead created",

                details: "Inquiry received via web form.",

                createdBy: null
            }
        ]

    });


    /* =====================================================
       SAVE
    ===================================================== */

    await lead.save();


    /* =====================================================
       RETURN
    ===================================================== */

    return lead;

};


export const getAllLeadsService = async () => {

    const leads = await Lead.find({
        isDeleted: false
    })
        .populate(
            "customer",
            "name firstName lastName email phoneNumber"
        )
        .populate(
            "createdBy",
            "name email"
        )
        .sort({
            createdAt: -1
        });

    return leads;

};


export const createAdminLeadService = async (req) => {

    const {
        subject,
        clientName,
        email,
        phoneNumber,
        companyName,
        category,
        source,
        priority,
        message
    } = req.body;


    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (!subject || !subject.trim()) {

        throw new Error(
            "Subject / enquiry title is required."
        );

    }


    if (!clientName || !clientName.trim()) {

        throw new Error(
            "Client contact name is required."
        );

    }


    if (!email || !email.trim()) {

        throw new Error(
            "Email address is required."
        );

    }


    if (!category) {

        throw new Error(
            "Lead category is required."
        );

    }


    if (!priority) {

        throw new Error(
            "Priority status is required."
        );

    }


    // =====================================================
    // CATEGORY VALIDATION
    // =====================================================

    const validCategories = [

        "Floor Care",

        "Dish Care",

        "Laundry Care"

    ];


    if (!validCategories.includes(category)) {

        throw new Error(
            "Invalid lead category."
        );

    }


    // =====================================================
    // PRIORITY VALIDATION
    // =====================================================

    const validPriorities = [

        "Low",

        "Medium",

        "High"

    ];


    if (!validPriorities.includes(priority)) {

        throw new Error(
            "Invalid priority."
        );

    }


    // =====================================================
    // SOURCE VALIDATION
    // =====================================================

    const validSources = [

        "Web Inquiry",

        "Direct Call",

        "Google Search",

        "Referral"

    ];


    const leadSource =
        source || "Web Inquiry";


    if (!validSources.includes(leadSource)) {

        throw new Error(
            "Invalid lead source."
        );

    }


    // =====================================================
    // GET ADMIN
    // =====================================================

    /*
       Your verifyAdmin middleware should put
       the authenticated admin inside req.user.

       If your middleware uses req.admin instead,
       change req.user to req.admin here.
    */

    const admin = req.user;


    if (!admin) {

        throw new Error(
            "Admin authentication required."
        );

    }


    // =====================================================
    // FIND ADMIN USER
    // =====================================================

    let adminUser = req.dbUser || null;


    if (!adminUser && admin.uid) {

        adminUser = await User.findOne({

            uid: admin.uid,

            isDeleted: false

        });

    }


    if (!adminUser && admin._id) {

        adminUser = await User.findOne({

            _id: admin._id,

            isDeleted: false

        });

    }


    if (!adminUser && admin.email) {

        adminUser = await User.findOne({

            email: admin.email.toLowerCase(),

            isDeleted: false

        });

    }


    if (!adminUser) {

        throw new Error(
            "Admin user not found."
        );

    }


    // =====================================================
    // CREATE LEAD
    // =====================================================

    const lead = new Lead({

        // -----------------------------------------------
        // Client information
        // -----------------------------------------------

        customer: null,

        clientName:
            clientName.trim(),

        email:
            email.toLowerCase().trim(),

        phoneNumber:
            phoneNumber
                ? phoneNumber.trim()
                : "",

        companyName:
            companyName
                ? companyName.trim()
                : "",


        // -----------------------------------------------
        // Enquiry information
        // -----------------------------------------------

        subject:
            subject.trim(),

        category,

        source:
            leadSource,

        message:
            message
                ? message.trim()
                : "",


        // -----------------------------------------------
        // CRM information
        // -----------------------------------------------

        priority,

        status: "New",


        // -----------------------------------------------
        // Admin who created the lead
        // -----------------------------------------------

        createdBy:
            adminUser._id,


        // -----------------------------------------------
        // First activity
        // -----------------------------------------------

        activities: [

            {

                type: "Lead Created",

                title: "Lead created",

                details:
                    "Lead manually created by admin.",

                createdBy:
                    adminUser._id

            }

        ]

    });


    // =====================================================
    // SAVE
    // =====================================================

    await lead.save();


    // =====================================================
    // RETURN
    // =====================================================

    return lead;

};



export const updateLeadStatusService = async (req) => {

    const { id } = req.params;

    const { status } = req.body;


    // =====================================================
    // VALID STATUSES
    // =====================================================

    const validStatuses = [
        "New",
        "Contacted",
        "Interested",
        "Negotiation",
        "Won",
        "Lost",
        "Archived"
    ];


    if (!status) {
        throw new Error("Lead status is required.");
    }


    if (!validStatuses.includes(status)) {
        throw new Error("Invalid lead status.");
    }


    // =====================================================
    // FIND ADMIN
    // =====================================================

    const { uid } = req.user || {};

    const admin = await User.findOne({
        uid,
        isDeleted: false
    });


    if (!admin) {
        throw new Error("Admin user not found.");
    }


    // =====================================================
    // FIND LEAD
    // =====================================================

    const lead = await Lead.findOne({
        _id: id,
        isDeleted: false
    });


    if (!lead) {
        throw new Error("Lead not found.");
    }


    // =====================================================
    // CHECK IF STATUS IS ALREADY SAME
    // =====================================================

    if (lead.status === status) {

        throw new Error(
            `Lead is already in ${status} status.`
        );

    }


    // =====================================================
    // OLD STATUS
    // =====================================================

    const oldStatus = lead.status;


    // =====================================================
    // UPDATE STATUS
    // =====================================================

    lead.status = status;


    // =====================================================
    // ADD ACTIVITY
    // =====================================================

    lead.activities.push({

        type: "Status Changed",

        title: `Status changed to ${status}`,

        details:
            `Lead status changed from ${oldStatus} to ${status} by admin.`,

        createdBy: admin._id

    });


    // =====================================================
    // SAVE
    // =====================================================

    await lead.save();


    // =====================================================
    // RETURN
    // =====================================================

    return lead;

};


export const updateLeadProfileStatusService = async (req) => {

    const { id } = req.params;

    const {
        subject,
        clientName,
        email,
        phoneNumber,
        companyName,
        category,
        source,
        priority,
        message,
        internalNotes
    } = req.body;


    // =====================================================
    // VALIDATION
    // =====================================================

    const validCategories = [
        "General Support",
        "Floor Care",
        "Dish Care",
        "Laundry Care",
        "Partner Enquiries"
    ];

    const validSources = [
        "Web Inquiry",
        "Direct Call",
        "Google Search",
        "Reference"
    ];

    const validPriorities = [
        "Low",
        "Medium",
        "High"
    ];


    if (category && !validCategories.includes(category)) {
        throw new Error("Invalid lead category.");
    }

    if (source && !validSources.includes(source)) {
        throw new Error("Invalid lead source.");
    }

    if (priority && !validPriorities.includes(priority)) {
        throw new Error("Invalid lead priority.");
    }


    // =====================================================
    // FIND LEAD
    // =====================================================

    const lead = await Lead.findOne({
        _id: id,
        isDeleted: false
    });


    if (!lead) {
        throw new Error("Lead not found.");
    }


    // =====================================================
    // UPDATE ONLY PROVIDED FIELDS
    // =====================================================

    if (subject !== undefined) {
        lead.subject = subject.trim();
    }

    if (clientName !== undefined) {
        lead.clientName = clientName.trim();
    }

    if (email !== undefined) {
        lead.email = email.toLowerCase().trim();
    }

    if (phoneNumber !== undefined) {
        lead.phoneNumber = phoneNumber.trim();
    }

    if (companyName !== undefined) {
        lead.companyName = companyName.trim();
    }

    if (category !== undefined) {
        lead.category = category;
    }

    if (source !== undefined) {
        lead.source = source;
    }

    if (priority !== undefined) {
        lead.priority = priority;
    }

    if (message !== undefined) {
        lead.message = message.trim();
    }

    if (internalNotes !== undefined) {
        lead.internalNotes = internalNotes;
    }


    // =====================================================
    // SAVE
    // =====================================================

    await lead.save();


    return lead;
};

export const addLeadActivityService = async (req) => {

    const { id } = req.params;

    const {
        type,
        title,
        details
    } = req.body;


    // =====================================================
    // VALIDATE ACTIVITY TYPE
    // =====================================================

    const validTypes = [
        "Call",
        "Email",
        "Note",
        "Task"
    ];


    if (!type) {
        throw new Error("Activity type is required.");
    }


    if (!validTypes.includes(type)) {
        throw new Error("Invalid activity type.");
    }


    // =====================================================
    // VALIDATE TITLE
    // =====================================================

    if (!title || !title.trim()) {
        throw new Error("Activity title is required.");
    }


    // =====================================================
    // VALIDATE DETAILS
    // =====================================================

    if (!details || !details.trim()) {
        throw new Error(
            "Interaction details are required."
        );
    }


    // =====================================================
    // FIND ADMIN
    // =====================================================

    const { uid } = req.user || {};


    const admin = await User.findOne({
        uid,
        isDeleted: false
    });


    if (!admin) {
        throw new Error("Admin user not found.");
    }


    // =====================================================
    // FIND LEAD
    // =====================================================

    const lead = await Lead.findOne({
        _id: id,
        isDeleted: false
    });


    if (!lead) {
        throw new Error("Lead not found.");
    }


    // =====================================================
    // ADD ACTIVITY
    // =====================================================

    lead.activities.push({

        type,

        title: title.trim(),

        details: details.trim(),

        createdBy: admin._id

    });


    // =====================================================
    // SAVE
    // =====================================================

    await lead.save();


    // =====================================================
    // RETURN NEW ACTIVITY
    // =====================================================

    const newActivity =
        lead.activities[
            lead.activities.length - 1
        ];


    return newActivity;

};


export const addLeadTaskService = async (req) => {

    const { id } = req.params;

    const { title } = req.body;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (!title || !title.trim()) {
        throw new Error("Task title is required.");
    }


    // =====================================================
    // FIND ADMIN
    // =====================================================

    const { uid } = req.user || {};

    const admin = await User.findOne({
        uid,
        isDeleted: false
    });

    if (!admin) {
        throw new Error("Admin user not found.");
    }


    // =====================================================
    // FIND LEAD
    // =====================================================

    const lead = await Lead.findOne({
        _id: id,
        isDeleted: false
    });

    if (!lead) {
        throw new Error("Lead not found.");
    }


    // =====================================================
    // ADD TASK
    // =====================================================

    lead.tasks.push({

        title: title.trim(),

        completed: false,

        createdBy: admin._id

    });


    // =====================================================
    // SAVE
    // =====================================================

    await lead.save();


    // =====================================================
    // RETURN NEW TASK
    // =====================================================

    const newTask =
        lead.tasks[
            lead.tasks.length - 1
        ];


    return newTask;

};

export const updateLeadTaskService = async (req) => {

    const { leadId, taskId } = req.params;

    const { completed } = req.body;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (typeof completed !== "boolean") {

        throw new Error(
            "Completed must be true or false."
        );

    }


    // =====================================================
    // FIND ADMIN
    // =====================================================

    const { uid } = req.user || {};

    const admin = await User.findOne({
        uid,
        isDeleted: false
    });

    if (!admin) {
        throw new Error("Admin user not found.");
    }


    // =====================================================
    // FIND LEAD
    // =====================================================

    const lead = await Lead.findOne({
        _id: leadId,
        isDeleted: false
    });

    if (!lead) {
        throw new Error("Lead not found.");
    }


    // =====================================================
    // FIND TASK
    // =====================================================

    const task = lead.tasks.id(taskId);

    if (!task) {
        throw new Error("Task not found.");
    }


    // =====================================================
    // UPDATE TASK
    // =====================================================

    task.completed = completed;


    // =====================================================
    // SAVE
    // =====================================================

    await lead.save();


    // =====================================================
    // RETURN TASK
    // =====================================================

    return task;

};

export const addLeadReminderService = async (req) => {

    const { id } = req.params;

    const {
        title,
        scheduledFor
    } = req.body;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (!title || !title.trim()) {
        throw new Error("Reminder title is required.");
    }

    if (!scheduledFor) {
        throw new Error("Reminder date and time are required.");
    }


    const reminderDate = new Date(scheduledFor);

    if (isNaN(reminderDate.getTime())) {
        throw new Error("Invalid reminder date and time.");
    }


    // Don't allow past reminders

    if (reminderDate <= new Date()) {
        throw new Error(
            "Reminder date and time must be in the future."
        );
    }


    // =====================================================
    // FIND LOGGED-IN ADMIN
    // =====================================================

    const { uid } = req.user || {};

    if (!uid) {
        throw new Error("Authentication required.");
    }


    const admin = await User.findOne({
        uid,
        isDeleted: false
    });

    if (!admin) {
        throw new Error("Admin user not found.");
    }


    // =====================================================
    // FIND LEAD
    // =====================================================

    const lead = await Lead.findOne({
        _id: id,
        isDeleted: false
    });

    if (!lead) {
        throw new Error("Lead not found.");
    }


    // =====================================================
    // ADD REMINDER
    // =====================================================

    lead.reminders.push({

        title: title.trim(),

        scheduledFor: reminderDate,

        completed: false,

        completedAt: null,

        createdBy: admin._id

    });


    // =====================================================
    // SAVE
    // =====================================================

    await lead.save();


    // =====================================================
    // GET CREATED REMINDER
    // =====================================================

    const reminder =
        lead.reminders[
            lead.reminders.length - 1
        ];


    return reminder;

};

export const addLeadCommentService = async (req) => {

    const { id } = req.params;
    const { comment } = req.body;
    const { uid } = req.user || {};

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!comment || !comment.trim()) {
        throw new Error("Comment is required.");
    }

    if (!uid) {
        throw new Error("Authentication required.");
    }


    // ==========================================
    // FIND ADMIN
    // ==========================================

    const admin = await User.findOne({
        uid,
        isDeleted: false,
        isAdmin: true
    });

    if (!admin) {
        throw new Error("Admin user not found.");
    }


    // ==========================================
    // FIND LEAD
    // ==========================================

    const lead = await Lead.findOne({
        _id: id,
        isDeleted: false
    });

    if (!lead) {
        throw new Error("Lead not found.");
    }


    // ==========================================
    // ADD COMMENT
    // ==========================================

    lead.comments.push({

        comment: comment.trim(),

        createdBy: admin._id

    });


    // ==========================================
    // SAVE
    // ==========================================

    await lead.save();


    // ==========================================
    // GET CREATED COMMENT
    // ==========================================

    const createdComment =
        lead.comments[
            lead.comments.length - 1
        ];


    return createdComment;

};