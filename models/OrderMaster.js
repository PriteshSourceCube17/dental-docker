const mongoose = require("mongoose");

const OrderMasterSchema = mongoose.Schema({
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: "Order",
    },
    clinicId: {
        type: mongoose.Schema.ObjectId,
        ref: "Clinic",
    },
    quoteId: {
        type: mongoose.Schema.ObjectId,
        ref: "Quote",
    },
    labId: {
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
    },
    type: {
        enum: ["advance", "complete"],
        type: String,
    },
    // advanceAmount:{
    //     type:Number
    // },
    // advancePaymentDate:{
    //     type:Date
    // },
    // advancePaymentStatus:{
    //     enum: [0, 1],
    //     type: Number,
    //     default: 0,
    //     Comment:"0 for pending and 1 for completed"
    // // },
    // remainingAmount:{
    //     type:Number
    // },
    // remainingPaymentDate:{
    //     type:Date
    // },
    // remainingPaymentStatus:{
    //     enum: [0, 1],
    //     type: Number,
    //     default: 0,
    //     Comment:"0 for pending and 1 for completed"
    // },
    totalAmount: {
        type: Number
    },
    paymentMethod: {
        enum: ["onlinePayment", "cash", "cheque"],
        type: String,
    },
    status: {
        enum: [0, 1],
        type: Number,
        default: 0,
        Comment: "0 for fail and 1 for sucess"
    },
    reference: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("OrderMaster", OrderMasterSchema);