const catchAsyncError = require("../../middleware/catchAsyncError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const Admin = require("../../models/Admin");
const config = require("../../config/config");
const Clinic = require("../../models/Clinic");
const emailvalidator = require("email-validator");
const User = require("../../models/User");
const { verifyAuthOtp, forgotPasswordMail } = require("../../utils/emailTemplate");
const Verification = require("../../models/Verification");
const { default: mongoose } = require("mongoose");
const Lab = require("../../models/Lab");

//super-admin signUp
const adminSingUp = catchAsyncError(async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;
    const errors = validationResult(req);

    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };
    const isEmailExists = await Admin.findOne({ email });
    if (!isEmailExists) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await Admin.create({ firstName, lastName, email, password: hashedPassword });
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Admin registered successfully.." });
    } else {
        throw new ErrorHandler("Email is already exists.", HttpStatus.CONFLICT);
    }
})

//super-admin signin
const adminSignIn = catchAsyncError(async (req, res, next) => {

    const { email, password } = req.body;
    const errors = validationResult(req);

    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    const admin = await Admin.findOne({ email });
    if (admin) {
        const validPassword = await bcrypt.compare(password, admin.password);

        if (validPassword) {
            const token = await jwt.sign({ _id: admin.id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES });
            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, token, Id: admin._id, message: "Login Successfully." });
        } else {
            throw new ErrorHandler("Please enter valid password", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("Please enter valid email", HttpStatus.BAD_REQUEST);
    }
});

// Singup lab || clinic
const Singup = catchAsyncError(async (req, res, next) => {
    const { firstName, lastName, email, password, role } = req.body;

    const errors = validationResult(req);

    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (role !== "clinic" && role !== "lab" && role !== "dentist") {
        throw new ErrorHandler("Please enter valid role", HttpStatus.BAD_REQUEST);
    }

    if (email) {
        if (!emailvalidator.validate(email)) {
            throw new ErrorHandler("Invalid email", HttpStatus.BAD_REQUEST);
        }
    }

    if (!emailvalidator.validate(email)) {
        throw new ErrorHandler("Invalid email", HttpStatus.BAD_REQUEST);
    }

    const userData = await User.findOne({ email, isDeleted: 0 });

    if (userData) {
        throw new ErrorHandler("Email is alredy exists", HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        firstName, lastName, email, password: hashedPassword, role, profileImage: `https://ui-avatars.com/api/?name=${firstName}&background=0D8ABC&length=1`
    });

    if (role === "lab") {
        user.isActiveLab = 1;
        await user.save();
        Lab.create({ userId: user._id });
    }

    if (role === "clinic") {
        user.isActiveClinic = 1;
        await user.save();
        Clinic.create({ userId: user._id });
    }

    var digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }

    const userEmail = user.email;

    await Verification.findOneAndRemove({ userId: user._id });

    const otpExpires = Date.now() + 4 * 60 * 1000;
    await Verification.create({ userId: user._id, otp, otpExpires });

    await verifyAuthOtp({ email: userEmail, otp });

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Successfully Registered", UserId: user._id, OTP: otp });
});

// Singin lab || clinic
const SignIn = catchAsyncError(async (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email) {
        throw new ErrorHandler("Please Enter Email", HttpStatus.BAD_REQUEST);
    }

    if (!emailvalidator.validate(email)) {
        throw new ErrorHandler("Invalid email", HttpStatus.BAD_REQUEST);
    }

    if (!password) {
        throw new ErrorHandler("Please Enter Password", HttpStatus.BAD_REQUEST);
    }

    const userData = await User.findOne({ email: { $regex: email, $options: 'i' }, isDeleted: 0 });

    if (!userData) {
        throw new ErrorHandler("Please enter registered email", HttpStatus.BAD_REQUEST);
    }

    const verifyPassword = await bcrypt.compare(password, userData.password);
    if (!verifyPassword) {
        throw new ErrorHandler("Please enter valid password", HttpStatus.BAD_REQUEST);
    }
    let screenStatus;
    if (userData) {

        if (userData.isActived == 1) {
            if (userData.role === "lab") {
                if (userData.isActiveLab === 0) {
                    throw new ErrorHandler("Your account is deactivated.", HttpStatus.BAD_REQUEST);
                }
                const labData = await Lab.findOne({ userId: userData._id });
                if (userData.isVerified === 0) {
                    screenStatus = 0;
                } else {
                    screenStatus = labData.screenStatus;
                }
                const token = await jwt.sign({ id: userData._id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES });
                return res.status(HttpStatus.OK).json({
                    status: HttpStatus.OK, success: true, type: "lab", UserId: userData._id, screenStatus,
                    profileImage: userData.profileImage, firstName: userData.firstName, lastName: userData.lastName, dateOfEstablishment: labData.dateOfEstablishment,
                    token, message: "Login successfully"
                });

            } else if (userData.role === "clinic") {

                if (userData.isActiveClinic === 0) {
                    throw new ErrorHandler("Your account is deactivated.", HttpStatus.BAD_REQUEST);
                }
                const clicnicData = await Clinic.findOne({ userId: userData._id });
                if (userData.isVerified === 0) {
                    screenStatus = 0;
                } else {
                    screenStatus = clicnicData.screenStatus;
                }
                const token = await jwt.sign({ id: userData._id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES });
                return res.status(HttpStatus.OK).json({
                    status: HttpStatus.OK, success: true, type: "clinic", UserId: userData._id, screenStatus,
                    profileImage: userData.profileImage, firstName: userData.firstName, lastName: userData.lastName, dateOfEstablishment: clicnicData.dateOfEstablishment,
                    token, message: "Login successfully"
                });
            }
        } else {
            throw new ErrorHandler("Your account is not approved yet", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("User data not founded", HttpStatus.BAD_REQUEST);
    }
});

// Send Otp For Verification
const sendOtp = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        throw new ErrorHandler("Please Enter email", HttpStatus.BAD_REQUEST);
    }

    if (!emailvalidator.validate(email)) {
        throw new ErrorHandler("Invalid email", HttpStatus.BAD_REQUEST);
    }

    const user = await User.findOne({ email, isDeleted: 0 });

    if (!user) {
        throw new ErrorHandler("Please Register from this email", HttpStatus.BAD_REQUEST);
    }
    const { _id, isVerified } = user;

    if (isVerified === 1) {
        throw new ErrorHandler("Email is already verified", HttpStatus.BAD_REQUEST);
    }

    var digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }

    const userEmail = user.email;

    await Verification.findOneAndRemove({ userId: _id });

    const otpExpires = Date.now() + 4 * 60 * 1000;
    await Verification.create({ userId: _id, otp, otpExpires });
    const message = `This is the code for email verification ==> ${otp}`;
    try {
        // this fun is used for sending mail
        await verifyAuthOtp({ email: userEmail, otp });

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, otp, message: "OTP Sent Successfully on your Email Address", UserId: _id });

    } catch (error) {
        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong" });
    };
});

// Verity Valid Otp
const verifyOtp = catchAsyncError(async (req, res, next) => {
    const { UserId, otp } = req.body;

    if (!mongoose.Types.ObjectId.isValid(UserId)) {
        throw new ErrorHandler("Please Enter valid User Id Verification", HttpStatus.BAD_REQUEST);
    }

    if (!otp) {
        throw new ErrorHandler("Please Enter Otp for Verification", HttpStatus.BAD_REQUEST);
    }

    const data = await Verification.findOne({ otp, userId: UserId, otpExpires: { $gt: Date.now() } });

    if (!data) {
        throw new ErrorHandler("Please Enter Valid OTP", HttpStatus.BAD_REQUEST);
    }

    const { userId, _id } = data;

    if (userId) {

        const user = await User.findById({ _id: userId });

        if (!user) {
            throw new ErrorHandler("User is not exists", HttpStatus.BAD_REQUEST);
        }
        const id = user._id;
        user.isVerified = 1;

        await user.save();

        await Verification.findByIdAndDelete({ _id: _id });

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Verification Successfully" });
    }

});

// forgot Password 
const forgotPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        throw new ErrorHandler("Please Enter Valid Email.", HttpStatus.BAD_REQUEST);
    }

    if (!emailvalidator.validate(email)) {
        throw new ErrorHandler("Invalid email", HttpStatus.BAD_REQUEST);
    }

    const user = await User.findOne({ email, isDeleted: 0 });
    if (!user) {
        throw new ErrorHandler("Email not yet registered.", HttpStatus.BAD_REQUEST);
    }
    const UserId = user._id

    if (user) {
        var digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 6; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }

        const message = `This is the code for reset password ==> ${OTP}`;
        try {
            await forgotPasswordMail({ OTP, email });

            user.resetPasswordToken = OTP;
            await user.save();
            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, UserId, OTP, message: "OTP Sent Successfully on your Email Address" });

        } catch (error) {
            throw new ErrorHandler(`Something is wrong ${error}`, HttpStatus.BAD_REQUEST);
        };
    } else {
        throw new ErrorHandler("Email not yet registered.", HttpStatus.BAD_REQUEST);
    }
});

// Verify Reset Password
const verifyresetOtp = catchAsyncError(async (req, res, next) => {
    const { OTP, UserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(UserId)) {
        throw new ErrorHandler("Please Enter valid User Id Verification", HttpStatus.BAD_REQUEST);
    }

    if (!OTP) {
        throw new ErrorHandler("Please Enter reset password code", HttpStatus.BAD_REQUEST);
    }

    const user = await User.findOne({ _id: UserId, resetPasswordToken: OTP });

    if (!user) {
        throw new ErrorHandler("Your OTP is Invalid.", HttpStatus.BAD_REQUEST);
    };

    const userId = user._id;
    user.resetPasswordToken = null;
    await user.save();

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, userId, message: "Otp is correct" });
});

//Reset Password
const resetPassword = catchAsyncError(async (req, res, next) => {
    const { userId, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ErrorHandler("Please Enter valid user Id", HttpStatus.BAD_REQUEST);
    }

    const user = await User.findById({ _id: userId });

    if (!user) {
        throw new ErrorHandler("User Not Found.", HttpStatus.BAD_REQUEST);
    };
    const email = user.email;

    if (!password) {
        throw new ErrorHandler("Please Enter Password", HttpStatus.BAD_REQUEST);
    }

    if (password.length <= 5) {
        throw new ErrorHandler("Password must be 6 charcter", HttpStatus.BAD_REQUEST);
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
        user.password = hashedPassword;
        user.resetPasswordToken = null;
    }

    await user.save();
    // await resetSuccessfully({ email });
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Password Reset successfully.." });

});


module.exports = { adminSingUp, adminSignIn, Singup, SignIn, sendOtp, verifyOtp, forgotPassword, verifyresetOtp, resetPassword }