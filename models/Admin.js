const mongoose = require("mongoose");

const adminSchema = mongoose.Schema({
    firstName:{
        type: String,
    },
    lastName:{
        type: String,
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Email is Required"]
    },
    profileImage:{
        type:String,
    },
    password: {
        type: String,
        required: [true, "Password is Required"],
        minLength: [6, "Password must be 6 character"],
    },
}, { timestamps: true })

module.exports = mongoose.model("Admin", adminSchema);