const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/ErrorHandling");
const catchAsyncError = require("./catchAsyncError");
const Admin = require("../models/Admin");
const User = require("../models/User");

exports.isAunticatedUser = catchAsyncError(async (req, res, next) => {

    const headers = req.headers.authorization;

    if (!headers) {
        throw new ErrorHandler("Please login to access this resource", 401);
    }

    const token = headers.split(" ")[1];

    if (!token) {
        throw new ErrorHandler("Please Enter valid Token", 401);
    }

    const data = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(data.id);

    if (!user) {
        throw new ErrorHandler("Token is expired or Invalid.", 401);
    }
    req.user = data.id;

    next();
});

exports.isAunticatedLab = catchAsyncError(async (req, res, next) => {
    const id = req.user;
    const user = await User.findById(id);
    if (user.role === "lab") {
        if (user.isActiveLab === 0 || user.isActived === 0) {
            throw new ErrorHandler("Your account is deactivated.", 401);
        }
        next();
    } else {
        throw new ErrorHandler("Please Register your self as Lab", 401);
    }
})

exports.isAunticatedClinic = catchAsyncError(async (req, res, next) => {
    const id = req.user;
    const user = await User.findById(id);
    if (user.role === "clinic") {
        if (user.isActiveClinic === 0 || user.isActived === 0) {
            throw new ErrorHandler("Your account is deactivated.", 401);
        }
        next();
    } else {
        throw new ErrorHandler("Please Register your self as Clinic", 401);
    }
})


exports.isAuthenticateAdmin = catchAsyncError(async (req, res, next) => {

    const headers = req.headers.authorization;

    if (!headers) {
        throw new ErrorHandler("Please login to access this resource", 401);
    }

    const token = headers.split(" ")[1];

    if (!token) {
        throw new ErrorHandler("Please Enter valid Token", 401);
    }

    const data = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const admin = await Admin.findById(data._id);

    if (!admin) {
        throw new ErrorHandler("Token is expired or Invalid.", 401);
    }
    req.admin = data._id;

    next();
});