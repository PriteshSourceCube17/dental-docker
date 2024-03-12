const mongoose = require("mongoose");

const serviceCategorySchema = mongoose.Schema({
    title:{
        type:String,
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = not deleted, 1= deleted',
    },
    status:{
        enum: [0, 1],
        type: Number,
        default: 1,
        comment: '0 = deacive, 1= active',
    }
}, { timestamps: true });

module.exports = mongoose.model("serviceCategory", serviceCategorySchema);