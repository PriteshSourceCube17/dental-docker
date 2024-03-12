const mongoose = require("mongoose");

const workHourSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        unique : true,
        require: [true, "user id Required"]
    },
    labId: {
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
        unique : true,
        require: [true, "lab id Required"]
    },
    dayStatus:{
        type: String,
    },
    dayDetails: [
        {
            day: {
                enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                type: String,
                require: [true, "Day is required."]
            },
            startTime: {
                type: String 
            },
            endTime: {
                type: String 
            },
            isOpen: {
                type: Boolean,
                require: [true, "isOpen value is required."]
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("LabWorkHour", workHourSchema);