const mongoose = require("mongoose");

const quoteMasterStatusSchema = mongoose.Schema({
    quoteId: {
        type: mongoose.Schema.ObjectId,
        ref: "Quote",
    },
    labId:{
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
    },
    proposalId: {
        type: mongoose.Schema.ObjectId,
        ref: "Proposal",
    },
    labStatus:{
        enum: ["","waitForPayment","workStarted","outForDelivery","deliverySuccess","needModification","deliveryRejected","jobSuccessfullyDone"],
        type: String,
        default:""
    },
    clinicStatus:{
        enum: ["pending","advancePending","inProgress","outForDelivery","deliveryAccepted","needModification","deliveryRejected","jobSuccessfullyDone"],
        type: String,
        default:"pending"
    },
}, { timestamps: true });

module.exports = mongoose.model("QuoteMasterStatus", quoteMasterStatusSchema);