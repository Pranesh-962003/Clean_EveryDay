import mongoose from "mongoose";

/* =========================================================
   ACTIVITY SCHEMA
   =========================================================
   Stores the complete timeline of what happened to a lead.
   
   Examples:
   - Lead Created
   - Status Changed
   - Priority Changed
   - Call
   - Email
   - Note
   - Task
========================================================= */

const activitySchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                "Lead Created",
                "Status Changed",
                "Priority Changed",
                "Call",
                "Email",
                "Note",
                "Task"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        details: {
            type: String,
            default: "",
            trim: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true,
        _id: true
    }
);






/* =========================================================
   TASK / CHECKLIST SCHEMA
   =========================================================
   Used for:

   [ ] Schedule call
   [ ] Send pricing sheet
   [x] Contact customer

   When completed, frontend can show the text as crossed out.
========================================================= */

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        completed: {
            type: Boolean,
            default: false
        },

        completedAt: {
            type: Date,
            default: null
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true,
        _id: true
    }
);


/* =========================================================
   REMINDER SCHEMA
   =========================================================
   Example:

   Reminder title:
   Follow up about bulk pricing

   Target schedule:
   2026-08-15
========================================================= */

const reminderSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        scheduledFor: {
            type: Date,
            required: true
        },

        completed: {
            type: Boolean,
            default: false
        },

        completedAt: {
            type: Date,
            default: null
        },

        // Tracks automatic reminder email
        emailSent: {
            type: Boolean,
            default: false
        },

        emailSentAt: {
            type: Date,
            default: null
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);


/* =========================================================
   INTERNAL COMMENT SCHEMA
   =========================================================
   Only admin/staff should see these.

   Example:
   "CEO approved discount."
========================================================= */

const commentSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            required: true,
            trim: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true,
        _id: true
    }
);


/* =========================================================
   LEAD SCHEMA
========================================================= */

const leadSchema = new mongoose.Schema(
    {
        /* =================================================
           BASIC LEAD INFORMATION
        ================================================= */

        subject: {
            type: String,
            required: true,
            trim: true
        },

        /* =================================================
           CUSTOMER / USER
           
           If enquiry comes from a logged-in customer,
           this points to that User.

           If admin manually creates a lead for an
           external customer, this can remain null.
        ================================================= */

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },

        /* =================================================
           CLIENT CONTACT
        ================================================= */

        clientName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        phoneNumber: {
            type: String,
            default: "",
            trim: true
        },

        /* =================================================
           COMPANY
        ================================================= */

        companyName: {
            type: String,
            default: "",
            trim: true
        },

        /* =================================================
           CATEGORY
        ================================================= */

        category: {
            type: String,
            enum: [
                "General Support",
                "Floor Care",
                "Dish Care",
                "Laundry Care",
                "Partner Enquiries"
            ],
            default: "General Support",
            index: true
        },

        /* =================================================
           LEAD SOURCE
        ================================================= */

        source: {
            type: String,
            enum: [
                "Web Inquiry",
                "Google Search",
                "Referral",
                "Phone",
                "Email",
                "Social Media",
                "Direct Call",
                "Walk In",
                "Admin Created",
                "Other"
            ],
            default: "Web Inquiry"
        },

        /* =================================================
           PRIORITY
        ================================================= */

        priority: {
            type: String,
            enum: [
                "Low",
                "Medium",
                "High"
            ],
            default: "Medium",
            index: true
        },

        /* =================================================
           PIPELINE STATUS
           
           Admin can drag and drop the lead between these
           columns.
        ================================================= */

        status: {
            type: String,
            enum: [
                "New",
                "Contacted",
                "Interested",
                "Negotiation",
                "Won",
                "Lost",
                "Archived"
            ],
            default: "New",
            index: true
        },

        /* =================================================
           ENQUIRY / MESSAGE
        ================================================= */

        message: {
            type: String,
            required: true,
            trim: true
        },

        /* =================================================
           INTERNAL SALES NOTES
           
           This is the main "Internal sales follow up notes"
           section.
        ================================================= */

        internalNotes: {
            type: String,
            default: "",
            trim: true
        },

        /* =================================================
           ACTIVITIES
           
           Complete chronological history of the lead.
        ================================================= */

        activities: {
            type: [activitySchema],
            default: []
        },

        /* =================================================
           CHECKLIST TASKS
        ================================================= */

        tasks: {
            type: [taskSchema],
            default: []
        },

        /* =================================================
           CALENDAR REMINDERS
        ================================================= */

        reminders: {
            type: [reminderSchema],
            default: []
        },

        /* =================================================
           INTERNAL STAFF COMMENTS
        ================================================= */

        comments: {
            type: [commentSchema],
            default: []
        },

        /* =================================================
           LEAD CREATOR
           
           Admin who manually created the lead.
           
           For customer web enquiries this can be null.
        ================================================= */

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        /* =================================================
           SOFT DELETE
        ================================================= */

        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },

        deletedAt: {
            type: Date,
            default: null
        },

        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },

    {
        timestamps: true,
        versionKey: false
    }
);


/* =========================================================
   INDEXES
========================================================= */

// Find customer's leads quickly
leadSchema.index({
    customer: 1,
    createdAt: -1
});

// CRM pipeline filtering
leadSchema.index({
    status: 1,
    createdAt: -1
});

// Category filtering
leadSchema.index({
    category: 1,
    createdAt: -1
});

// Priority filtering
leadSchema.index({
    priority: 1,
    createdAt: -1
});

// Search/filter by email
leadSchema.index({
    email: 1
});





/* =========================================================
   MODEL
========================================================= */

export const Lead = mongoose.model(
    "Lead",
    leadSchema
);