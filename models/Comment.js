const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
    quoteId: {
        type: mongoose.Schema.ObjectId,
        ref: "Quote",
    },
    clinicId:{
        type: mongoose.Schema.ObjectId,
        ref: "Clinic",
    },
    labId: {
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
    },
    title:{
        type:String
    },
    comment:{
        type:String
    },
    isMessage:{
        enum: ["lab", "clinic"],
        type: String,
    },
    status:{
        enum: [0, 1],
        type: Number,
        default: 1,
    }
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);