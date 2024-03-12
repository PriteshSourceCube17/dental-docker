const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    // sender
    senderId: {
        type: mongoose.Schema.ObjectId,
        ref: "clinic",
    },
    // receiver
    reciverId:[{
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
    }],
    title:{
        type:String,
    },
    description:{
        type:String
    },
}, { timestamps: true })

module.exports = mongoose.model("Notification", notificationSchema);