const mongoose = require("mongoose");

const clinicSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        require: [true, "UserId is Required"]
    },
    clinicName: {
        type: String,
        // unique: true,
    },
    landLineNumber: {
        type: Number,
    },
    countryCode: {
        type: String,
    },
    mobileNumber: {
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
    licensingAuthority: {
        type: String,
    },
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
    trnFile: {
        type: String
    },
    clinicMangerName: {
        type: String,
    },
    clinicMangerCountryCode: {
        type: String,
    },
    clinicMangerNumber: {
        type: Number
    },
    clinicMangerEmail: {
        type: String
    },
    medicalDirectorName: {
        type: String,
    },
    medicalDirectorCountryCode: {
        type: String,
    },
    medicalDirectorNumber: {
        type: Number,
    },
    medicalDirectorEmail: {
        type: String,
    },
    directorLicensNumber: {
        type: String,
    },
    directorLicensFile: {
        type: String,
    },
    finacialMangerName: {
        type: String,
    },
    finacialMangerCountryCode: {
        type: String,
    },
    finacialMangerNumber: {
        type: Number,
    },
    finacialMangerEmail: {
        type: String,
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = not deleted, 1= deleted',
    },
}, { timestamps: true })

module.exports = mongoose.model("Clinic", clinicSchema);