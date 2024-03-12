const mongoose = require("mongoose");

const verificationSchema = mongoose.Schema({
    userId:{
        type: mongoose.Schema.ObjectId,
        ref:"User",
    },
    otp:{
        type:Number,
        required:true
    },
    otpExpires:{
        type:Date,
    },
},{timestamps:true});

module.exports = mongoose.model("Verification",verificationSchema);