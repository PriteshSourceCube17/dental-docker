const mongoose = require("mongoose");

const labSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        require: [true, "UserId is Required"]
    },
    // from here lab details starts
    labName: {
        type: String,
    },
    countryCode: {
        type: String,
    },
    mobileNumber: {
        type: Number,
    },
    landLineNumber: {
        type: Number,
    },
    country: {
        type: String,
    },
    state: {
        type: String,
    },
    city: {
        type: String,
    },
    address: {
        type: String,
    },
    poBox: {
        type: String,
    },
    dateOfEstablishment: {
        type: Date,
    },
    screenStatus: {
        type: Number,
        default: 1
    },
    // from here additional deatils Starts
    medicalLicenseNumber: {
        type: String,
    },
    licensFile: {
        type: String
    },
    tradeLicenceNumber: {
        type: String,
    },
    tradeFile: {
        type: String
    },
    TRN_number: {
        type: String,
    },
    TRNFile: {
        type: String
    },
    deviceUsed: {
        type: Number
    },
    devicesFile: {
        type: String
    },
    // form here manger details starts
    labMangerName: {
        type: String
    },
    labMangerCountryCode: {
        type: String,
    },
    labMangerNumber: {
        type: String
    },
    labMangerEmail: {
        type: String
    },
    techMangerName: {
        type: String
    },
    techMangerCountryCode: {
        type: String,
    },
    techMangerNumber: {
        type: String
    },
    techMangerEmail: {
        type: String
    },
    techMangerlicensNo: {
        type: String
    },
    techlicensFile: {
        type: String
    },
    finacialMangerName: {
        type: String
    },
    finacialMangerCountryCode: {
        type: String,
    },
    finacialMangerNumber: {
        type: String
    },
    finacialMangerEmail: {
        type: String
    },
    totalLabTechinicians: {
        type: Number
    },
    labTechs: {
        type: String
    },
    description: {
        type: String
    },
    paymentMethod: {
        enum: ['onlinePayment', 'cash', 'cheque'],
        type: [String],
    },
    serviceIds: [{
        type: mongoose.Schema.ObjectId,
        ref: "services",
    }],
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = not deleted, 1= deleted',
    },
}, { timestamps: true });

module.exports = mongoose.model("Lab", labSchema);