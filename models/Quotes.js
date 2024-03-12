const mongoose = require("mongoose");

const quoteSchema = mongoose.Schema({
    clinicId: {
        type: mongoose.Schema.ObjectId,
        ref: "clinic",
        require: [true, "clinic id Required"]
    },
    quoteNumber: {
        type: String,
        unique: true
    },
    serviceIds: [{
        type: mongoose.Schema.ObjectId,
        ref: "serviceCategory",
        // require: [true, "serviceCategory id Required"]
    }],
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    // serviceIds: [{
    //     type: mongoose.Schema.ObjectId,
    //     ref: "services",
    // }],
    priority: {
        enum: ["normal", "urgent"],
        type: String,
    },
    chooseFor: {
        enum: ["labList", "public"],
        type: String,
    },
    tillDate: {
        type: Date
    },
    labs: [{
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
    }],
    quoteImages: {
        type: [String],
        default: []
    },
    quoteStatus: {
        enum: ["new", "accepted", "completed"],
        default: "new",
        type: String,
    },
    status: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = deacive, 1= active',
    },
    isAceptedLab: {
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
    }
}, { timestamps: true });

module.exports = mongoose.model("Quote", quoteSchema);