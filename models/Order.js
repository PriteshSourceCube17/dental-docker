const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema({
    quoteId: {
        type: mongoose.Schema.ObjectId,
        ref: "Quote",
    },
    clinicId: {
        type: mongoose.Schema.ObjectId,
        ref: "Clinic",
    },
    labId: {
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
    },
    proposalId: {
        type: mongoose.Schema.ObjectId,
        ref: "Proposal",
    },
    advanceAmount: {
        type: Number
    },
    advancePaymentDate: {
        type: Date
    },
    advancepaymentMethod: {
        enum: ["onlinePayment", "cash", "cheque"],
        type: String,
    },
    advancePaymentStatus: {
        enum: [0, 1],
        type: Number,
        default: 0,
        Comment: "0 for pending and 1 for completed"
    },
    remainingAmount: {
        type: Number
    },
    remainingPaymentDate: {
        type: Date
    },
    remainingPaymentStatus: {
        enum: [0, 1],
        type: Number,
        default: 0,
        Comment: "0 for pending and 1 for completed"
    },
    remainingpaymentMethod: {
        enum: ["onlinePayment", "cash", "cheque"],
        type: String,
    },
    totalAmount: {
        type: Number
    },
    status: {
        enum: ["pening", "advanceCompleted", "completed"],
        type: String,
        default: "pening",
    },
    reference: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);