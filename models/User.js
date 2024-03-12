const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    firstName:{
        type:String,
    },
    lastName:{
        type:String,
    },
    email: {
        type: String,
    },
    profileImage:{
        type: String,
    },
    password: {
        type: String,
    },
    role:{
        enum:['clinic','lab','dentist'],
        type:String,
        default:'lab'
    },
    isActived:{
        enum:[0,1],
        type:Number,
        default:0,
        comment: '0 = deactive, 1= active',
    },
    isActiveLab:{
        enum:[0,1],
        type:Number,
        default:0,
        comment: '0 = deactive, 1= active',
    },
    isActiveClinic:{
        enum:[0,1],
        type:Number,
        default:0,
        comment: '0 = deactive, 1= active',
    },
    isVerified:{
        enum:[0,1],
        type:Number,
        default:0,
        comment: '0 = not verify, 1= verifyed',
    },
    resetPasswordToken:{
        type:String
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = not deleted, 1= deleted',
    },
}, { timestamps: true })

module.exports = mongoose.model("User", userSchema);