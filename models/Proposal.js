const mongoose = require("mongoose");

const proposalSchema = mongoose.Schema({
    quoteId: {
        type: mongoose.Schema.ObjectId,
        ref: "Quote",
        require: [true, "Quote is required"]
    },
    clinicId:{
        type: mongoose.Schema.ObjectId,
        ref: "Clinic",
    },
    labId:{
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
    },
    amount:{
        type:Number,
    },
    coverLetter:{
        type:String
    },
    deliverIn:{
        type:String
    },
    status:{
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = not accepted by clinic, 1= accepted by clinic',
    }
}, { timestamps: true });

module.exports = mongoose.model("Proposal", proposalSchema);