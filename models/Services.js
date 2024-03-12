const mongoose = require("mongoose");

const serviceSchema = mongoose.Schema({
    labId: {
        type: mongoose.Schema.ObjectId,
        ref: "Lab",
        require: [true, "lab id Required"]
    },
    serivceCategoryId:{
        type: mongoose.Schema.ObjectId,
        ref: "serviceCategory",
        require: [true, "serviceCategory id Required"]
    },
    title:{
        type:String,
    },
    description:{
        type:String,
    },
    price:{
        type:Number,
    },
    serviceImags: {
        type: [String],
        default: []
    },
    status:{
        enum: [0, 1],
        type: Number,
        default: 1,
        comment: '0 = deacive, 1= active',
    }
}, { timestamps: true });

module.exports = mongoose.model("services", serviceSchema);