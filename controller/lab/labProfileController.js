const catchAsyncError = require("../../middleware/catchAsyncError");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { v4: uuidv4 } = require('uuid');
const formidable = require("formidable");
const Lab = require("../../models/Lab");
const fs = require("fs");
const User = require("../../models/User");
const cloudinary = require("cloudinary").v2;
const emailvalidator = require("email-validator");
const LabWorkHour = require("../../models/LabWorkHours");
const { validatelandlineNumber, isDateValid, validateMobileNumber } = require("../../utils/basicValidations");
const { default: mongoose } = require("mongoose");
const { pathEndpoint, Constants } = require("../../utils/Constant");
const ObjectId = require('mongodb').ObjectId;
const moment = require("moment/moment");
const Notification = require("../../models/Notification");
const OrderMaster = require("../../models/OrderMaster");


// This is the first step add lab details
const addLabDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { labName, countryCode, mobileNumber, landLineNumber, country, state, city, address, poBox, dateOfEstablishment } = req.body;
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    // if(isNaN(landLineNumber)){
    //     throw new ErrorHandler("Plaese enter valid land line number", HttpStatus.BAD_REQUEST);
    // }

    if (!isDateValid(dateOfEstablishment)) {
        throw new ErrorHandler("Please Enter valid date format", HttpStatus.BAD_REQUEST);
    }

    if (moment().format('YYYY-MM-DD') <= dateOfEstablishment) {
        throw new ErrorHandler("Date of Establishment is not valid", HttpStatus.BAD_REQUEST);
    }
    const user = await User.findOne({ _id: userId });
    if (user) {
        const labData = await Lab.findOne({ userId });

        // if(labData.screenStatus === 2){
        //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `lab details already added` });
        // }

        if (labData.labName === labName) {
            throw new ErrorHandler("Lab name is already exists", HttpStatus.BAD_REQUEST);
        }

        if (labData) {
            labData.labName = labName;
            labData.countryCode = countryCode;
            labData.mobileNumber = mobileNumber;
            labData.landLineNumber = landLineNumber;
            labData.country = country;
            labData.state = state;
            labData.city = city;
            labData.address = address;
            labData.poBox = poBox;
            labData.dateOfEstablishment = dateOfEstablishment;
            labData.screenStatus = 2;
            await labData.save();

            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "lab details and location added." })
        } else {
            throw new ErrorHandler("Please register your self as lab", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("User data not found", HttpStatus.BAD_REQUEST);
    }
});

// This is the second step add lab's additional details
const labadditionalDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        const { medicalLicenseNumber, tradeLicenceNumber, TRN_number, deviceUsed } = fields;
        const user = await User.findOne({ _id: userId });
        if (user) {
            const labData = await Lab.findOne({ userId });
            // if(labData.screenStatus === 3){
            //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `lab additional details already added` });
            // }
            if (labData) {

                if (files.licensFile) {
                    const imgName = files.licensFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.licensFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.licensFile = fileName;
                            // await labData.save();
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.licensFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/licences/${fileName}`;

                    // const imageData = files.licensFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.licensFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.licensFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }

                if (files.tradeFile) {
                    const imgName = files.tradeFile.originalFilename.split(".");
                    const extension = imgName[1];
                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.tradeFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.tradeFile = fileName;
                            // await labData.save();             
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.tradeFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/Trades/${fileName}`;

                    // const imageData = files.tradeFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.tradeFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.tradeFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }

                if (files.TRNFile) {

                    const imgName = files.TRNFile.originalFilename.split(".");
                    const extension = imgName[1];
                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.TRNFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.TRNFile = fileName;
                            // await labData.save();             
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.TRNFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/TRN/${fileName}`;

                    // const imageData = files.TRNFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.TRNFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.TRNFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }

                if (files.devicesFile) {

                    const imgName = files.devicesFile.originalFilename.split(".");
                    const extension = imgName[1];
                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.devicesFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.devicesFile = fileName;
                            await labData.save();
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.devicesFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/Devices/${fileName}`;

                    // const imageData = files.devicesFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.devicesFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.devicesFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }

                await Lab.findOneAndUpdate({ userId }, { medicalLicenseNumber, tradeLicenceNumber, TRN_number, deviceUsed, screenStatus: 3 });
                await labData.save();

                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "additonal details added successfully" });
            } else {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, message: "Please register your self as lab" })
            }
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, message: "User data not found" });
        }
    })

});

// This is the third step add lab's Manger details
const addLabMangersDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        const { labMangerName, labMangerCountryCode, labMangerNumber, labMangerEmail, techMangerName, techMangerCountryCode, techMangerNumber, techMangerEmail,
            techMangerlicensNo, finacialMangerName, finacialMangerCountryCode, finacialMangerNumber, finacialMangerEmail, totalLabTechinicians } = fields;

        const user = await User.findOne({ _id: userId });
        if (user) {
            const labData = await Lab.findOne({ userId });
            if (labData) {
                // if(labData.screenStatus === 4){
                //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `lab manger details already added` });
                // }
                if (labMangerEmail) {
                    if (!emailvalidator.validate(labMangerEmail)) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid lab manger email" });
                    }
                }

                if (techMangerEmail) {
                    if (!emailvalidator.validate(techMangerEmail)) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid techinical manger email" });
                    }
                }

                if (finacialMangerEmail) {
                    if (!emailvalidator.validate(finacialMangerEmail)) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid finacial email" });
                    }
                }

                // if(!labMangercountryCode){
                //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Lab manger country code is required" });
                // }

                // if (labMangerNumber) {
                //     const isValid = validateMobileNumber(labMangerNumber);
                //     if (!isValid) {
                //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid lab manger number" });
                //     }
                // }

                // if(!techMangercountryCode){
                //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Technical manger country code is required" });
                // }

                // if (techMangerNumber) {
                //     const isValid = validateMobileNumber(techMangerNumber);
                //     if (!isValid) {
                //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid techinical manger number" });
                //     }
                // }

                // if(!finacialMangercountryCode){
                //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Finacial manger country code is required" });
                // }

                // if (finacialMangerNumber) {
                //     const isValid = validateMobileNumber(finacialMangerNumber);
                //     if (!isValid) {
                //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid finacial manger mobile number" });
                //     }
                // }

                if (files.techlicensFile) {
                    const imgName = files.techlicensFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.techlicensFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.techlicensFile = fileName;
                            // await labData.save();
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.techlicensFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/Techincal/${fileName}`;

                    // const imageData = files.techlicensFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.techlicensFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.techlicensFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }

                if (files.labTechs) {
                    const imgName = files.labTechs.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.labTechs.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.labTechs = fileName;
                            // await labData.save();
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.labTechs.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/LabTechs/${fileName}`;

                    // const imageData = files.labTechs.originalFilename;
                    // try {
                    //         fs.copyFile(files.labTechs.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.labTechs = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }

                await Lab.findOneAndUpdate({ userId }, {
                    labMangerName, labMangerCountryCode, labMangerNumber, labMangerEmail, techMangerName, techMangerCountryCode, techMangerNumber, techMangerEmail,
                    techMangerlicensNo, finacialMangerName, finacialMangerCountryCode, finacialMangerNumber, finacialMangerEmail, totalLabTechinicians, screenStatus: 4
                });
                await labData.save();
                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Mangers details added" });
            } else {
                throw new ErrorHandler("Please register your self as lab", HttpStatus.BAD_REQUEST);
            }
        } else {
            throw new ErrorHandler("User data not found", HttpStatus.BAD_REQUEST);
        }
    });
});

// This is the fourth step add lab's working hours
const addLabWorkHours = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { dayStatus, dayDetails } = req.body;
    if (dayDetails.length) {
        const labData = await Lab.findOne({ userId });
        if (labData) {
            // if(labData.screenStatus === 5){
            //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `lab working hours already added` });
            // }
            const workDetailExist = await LabWorkHour.findOne({ labId: labData._id });
            if (!workDetailExist) {
                await LabWorkHour.create({ labId: labData._id, userId, dayStatus, dayDetails });
                labData.screenStatus = 5;
                await labData.save();
                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Working Hours added successfully.." });
            } else {
                throw new ErrorHandler("Work hour Details is Exist", HttpStatus.BAD_REQUEST);
            }
        } else {
            throw new ErrorHandler("Lab not found", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("dayDetails is missing", HttpStatus.BAD_REQUEST);
    }
});

// This is the fifth step add about lab
const addAboutLab = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { description } = req.body;

    const user = await User.findOne({ _id: userId });
    if (user) {
        const labData = await Lab.findOne({ userId });
        if (labData) {
            // if(labData.screenStatus === 6){
            //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `about lab details already added` });
            // }
            await Lab.findOneAndUpdate({ userId }, { description, screenStatus: 6 });
            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "lab description added" })
        } else {
            throw new ErrorHandler("Please register your self as lab", HttpStatus.BAD_REQUEST);
        }
    }
});

// This is the sixth step add lab's payment and delivery method
const labPaymentMethods = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { paymentMethod } = req.body;

    if (!paymentMethod.length) {
        throw new ErrorHandler("Please enter valid payment method", HttpStatus.BAD_REQUEST);
    }

    const user = await User.findOne({ _id: userId });
    if (user) {
        const labData = await Lab.findOne({ userId });
        if (labData) {
            // if(labData.screenStatus === 7){
            //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `lab payment and delivery details already added` });
            // }
            paymentMethod.map((val) => {
                if (val !== "onlinePayment" && val !== "cash" && val !== "cheque") {
                    throw new ErrorHandler("Please enter valid payment method", HttpStatus.BAD_REQUEST);
                }
            });

            await Lab.findOneAndUpdate({ userId }, { paymentMethod, screenStatus: 7 });
            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "payment and delivery method added" });
        } else {
            throw new ErrorHandler("Please register your self as lab", HttpStatus.BAD_REQUEST);
        }
    }
});

// Lab Profile data 
const getlabProfile = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const baseServicePath = Constants.serviceImgBase;
    const labData = await Lab.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: "_id",
                pipeline: [
                    { $project: { firstName: 1, lastName: 1, email: 1, profileImage: 1 } }
                ],
                as: 'userDetails',
            },
        },
        {
            $lookup: {
                from: 'labworkhours',
                localField: '_id',
                foreignField: "labId",
                pipeline: [
                    { $project: { labId: 1, dayStatus: 1, dayDetails: 1 } }
                ],
                as: 'workingHours',
            },
        },
        {
            $lookup: {
                from: 'services',
                localField: '_id',
                foreignField: "labId",
                pipeline: [
                    {
                        $project: {
                            title: 1, price: 1,
                            serviceImags: 1,
                            // serviceImags: {
                            //     $map: {
                            //       input: '$serviceImags',
                            //       as: 'img',
                            //       in: { $concat: [baseServicePath, '$$img'] }
                            //     }
                            // }
                        }
                    }
                ],
                as: 'labServices',
            },
        },
        {
            $project: {
                __v: 0, updatedAt: 0
            }
        }
    ])

    if (labData) {
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, labData });
    } else {
        throw new ErrorHandler("lab data not found", HttpStatus.BAD_REQUEST);
    }
});

// Edit Profile for both clinic and lab
const editProfile = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { firstName, lastName, email, oldPassword, newPassword } = req.body;

    if (email) {
        if (!emailvalidator.validate(email)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid email" });
        }
        const user = await User.findOne({ email });
        if (user) {
            const emailData = user.email;
            const Id = user._id;
            if (emailData && userId !== Id.valueOf()) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "This email already exists! Use a different email id" });
            }
        }
    }

    if (newPassword && oldPassword) {

        if (newPassword.length < 6) {
            throw new ErrorHandler("Password must be six charcter", HttpStatus.BAD_REQUEST);
        }
        const userData = await User.findById({ _id: userId });
        const verifyPassword = await bcrypt.compare(oldPassword, userData.password);

        if (!verifyPassword) {
            throw new ErrorHandler("Please Enter old valid password", HttpStatus.BAD_REQUEST);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        userData.password = hashedPassword;
        await userData.save();
    }

    await User.findByIdAndUpdate({ _id: userId }, { firstName, lastName, email });

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Profile updated successfully" });
});

// get notifications at lab side
const getLabNotification = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { limit, offset } = req.query;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    const labData = await Lab.findOne({ userId });

    let notificationData = await Notification.aggregate([
        { $match: { reciverId: new mongoose.Types.ObjectId(labData._id) } },
        { $project: { updatedAt: 0, __v: 0, senderId: 0, reciverId: 0 } },
        { $sort: { createdAt: -1 } }
    ]);

    const count = notificationData.length;
    notificationData = notificationData.slice(offsetData, limitData + offsetData);
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, notificationData } });
});

// get lab's payment history
const getLabPaymentDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { limit, offset } = req.query;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    const labData = await Lab.findOne({ userId });

    let paymentData = await OrderMaster.aggregate([
        { $match: { labId: new mongoose.Types.ObjectId(labData._id) } },
        {
            $lookup: {
                from: 'clinics',
                localField: 'clinicId',
                foreignField: "_id",
                pipeline: [
                    { $project: { clinicName: 1 } }
                ],
                as: 'clinicDetails',
            },
        },
        {
            $project: { orderId: 1, type: 1, totalAmount: 1, paymentMethod: 1, status: 1, reference: 1, createdAt: 1, clinicDetails: 1 }
        }
    ]);

    const count = paymentData.length;
    paymentData = paymentData.slice(offsetData, offsetData + limitData);
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, count, paymentData });
});

// Edit lab details 
const editLabDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { labName, countryCode, mobileNumber, landLineNumber, country, state, city, address, poBox, dateOfEstablishment } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (!isDateValid(dateOfEstablishment)) {
        throw new ErrorHandler("Please Enter valid date format", HttpStatus.BAD_REQUEST);
    }

    if (moment().format('YYYY-MM-DD') <= dateOfEstablishment) {
        throw new ErrorHandler("Date of Establishment is not valid", HttpStatus.BAD_REQUEST);
    }
    const user = await User.findOne({ _id: userId });
    if (user) {
        const labData = await Lab.findOne({ userId });

        // if(labData.screenStatus === 2){
        //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `lab details already added` });
        // }

        if (labName) {
            const labData = await Lab.findOne({ labName });
            if (labData) {
                const labNameData = labData.labName;
                const Id = labData.userId;
                if (labNameData && userId !== Id.valueOf()) {
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Lab name is already exists" });
                }
            }
        }

        if (labData) {
            await Lab.findOneAndUpdate({ userId }, {
                labName, countryCode, mobileNumber, landLineNumber, country, state, city, address, poBox, dateOfEstablishment
            });
            await labData.save();

            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "lab and location details updated." });
        } else {
            throw new ErrorHandler("Please register your self as lab", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("User data not found", HttpStatus.BAD_REQUEST);
    }
});

// Edit lab's additional details
const editAdditionalDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        const { medicalLicenseNumber, tradeLicenceNumber, TRN_number, deviceUsed, removelicensFile, removetradeFile, removeTRNFile, removedevicesFile } = fields;
        const user = await User.findOne({ _id: userId });
        if (user) {
            const labData = await Lab.findOne({ userId });

            if (labData) {

                if (files.licensFile) {
                    if (!removelicensFile) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Please enter old licenece file` });
                    }
                    const imgName = files.licensFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.licensFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.licensFile = fileName;
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.licensFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/licences/${fileName}`;

                    // const imageData = files.licensFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.licensFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.licensFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }

                    //         const filedata = __dirname + `/../../public/Images/licences/${removelicensFile}`
                    //         fs.unlink(filedata, (err) => {
                    //             if (err) {
                    //             }
                    //         });
                }

                if (files.tradeFile) {
                    if (!removetradeFile) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Please enter old trade file` });
                    }
                    const imgName = files.tradeFile.originalFilename.split(".");
                    const extension = imgName[1];
                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.tradeFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.tradeFile = fileName;
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.tradeFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/Trades/${fileName}`;

                    // const imageData = files.tradeFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.tradeFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.tradeFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }

                    //         const filedata = __dirname + `/../../public/Images/Trades/${removetradeFile}`
                    //         fs.unlink(filedata, (err) => {
                    //             if (err) {
                    //             }
                    //         });
                }

                if (files.TRNFile) {
                    if (!removeTRNFile) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Please enter old TRN file` });
                    }
                    const imgName = files.TRNFile.originalFilename.split(".");
                    const extension = imgName[1];
                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.TRNFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.TRNFile = fileName;
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.TRNFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/TRN/${fileName}`;

                    // const imageData = files.TRNFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.TRNFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.TRNFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }

                    //         const filedata = __dirname + `/../../public/Images/TRN/${removeTRNFile}`
                    //         fs.unlink(filedata, (err) => {
                    //             if (err) {
                    //             }
                    //         });
                }

                if (files.devicesFile) {
                    if (!removedevicesFile) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Please enter old device file` });
                    }
                    const imgName = files.devicesFile.originalFilename.split(".");
                    const extension = imgName[1];
                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.devicesFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.devicesFile = fileName;
                            // await labData.save();
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.devicesFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/Devices/${fileName}`;

                    // const imageData = files.devicesFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.devicesFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.devicesFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }

                    //         const filedata = __dirname + `/../../public/Images/Devices/${devicesFile}`
                    //         fs.unlink(filedata, (err) => {
                    //             if (err) {
                    //             }
                    //         });
                }

                await Lab.findOneAndUpdate({ userId }, { medicalLicenseNumber, tradeLicenceNumber, TRN_number, deviceUsed });
                await labData.save();

                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "additonal details updated successfully" });
            } else {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, message: "Please register your self as lab" })
            }
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, message: "User data not found" });
        }
    })
});

// Edit lab's Manger Details
const editMangersDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        const { labMangerName, labMangerCountryCode, labMangerNumber, labMangerEmail, techMangerName, techMangerCountryCode, techMangerNumber, techMangerEmail,
            techMangerlicensNo, finacialMangerName, finacialMangerCountryCode, finacialMangerNumber, finacialMangerEmail, totalLabTechinicians, removetechlicensFile, removelabTechs } = fields;

        const user = await User.findOne({ _id: userId });
        if (user) {
            const labData = await Lab.findOne({ userId });
            if (labData) {

                if (labMangerEmail) {
                    if (!emailvalidator.validate(labMangerEmail)) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid lab manger email" });
                    }
                }

                if (techMangerEmail) {
                    if (!emailvalidator.validate(techMangerEmail)) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid techinical manger email" });
                    }
                }

                if (finacialMangerEmail) {
                    if (!emailvalidator.validate(finacialMangerEmail)) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid finacial email" });
                    }
                }

                if (files.techlicensFile) {
                    if (!removetechlicensFile) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Please Enter old techinical licence file` });
                    }
                    const imgName = files.techlicensFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.techlicensFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.techlicensFile = fileName;
                            // await labData.save();
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.techlicensFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/Techincal/${fileName}`;

                    // const imageData = files.techlicensFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.techlicensFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.techlicensFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }

                    //         const filedata = __dirname + `/../../public/Images/Techincal/${removetechlicensFile}`
                    //         fs.unlink(filedata, (err) => {
                    //             if (err) {
                    //             }
                    //         });
                }

                if (files.labTechs) {
                    if (!removelabTechs) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Please Enter old Tech file` });
                    }
                    const imgName = files.labTechs.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.labTechs.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            labData.labTechs = fileName;
                            // await labData.save();
                        } catch (error) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // const fileName = (files.labTechs.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/LabTechs/${fileName}`;

                    // const imageData = files.labTechs.originalFilename;
                    // try {
                    //         fs.copyFile(files.labTechs.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.labTechs = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(HttpStatus.BAD_REQUEST).json({status:HttpStatus.BAD_REQUEST,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }

                    //         const filedata = __dirname + `/../../public/Images/LabTechs/${removelabTechs}`
                    //         fs.unlink(filedata, (err) => {
                    //             if (err) {
                    //             }
                    //         });
                }

                await Lab.findOneAndUpdate({ userId }, {
                    labMangerName, labMangerCountryCode, labMangerNumber, labMangerEmail, techMangerName, techMangerCountryCode, techMangerNumber, techMangerEmail,
                    techMangerlicensNo, finacialMangerName, finacialMangerCountryCode, finacialMangerNumber, finacialMangerEmail, totalLabTechinicians,
                });
                await labData.save();
                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Mangers details updated successfully" });
            } else {
                throw new ErrorHandler("Please register your self as lab", HttpStatus.BAD_REQUEST);
            }
        } else {
            throw new ErrorHandler("User data not found", HttpStatus.BAD_REQUEST);
        }
    })
});

// Edit lab description and delivery method
const editPaymenthod = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { description, paymentMethod } = req.body;

    if (!paymentMethod.length || !Array.isArray(paymentMethod)) {
        throw new ErrorHandler("Please enter valid payment method", HttpStatus.BAD_REQUEST);
    }

    const user = await User.findOne({ _id: userId });
    if (user) {
        const labData = await Lab.findOne({ userId });
        if (labData) {

            if (!description) throw new ErrorHandler("Please enter description", HttpStatus.BAD_REQUEST);

            paymentMethod.map((val) => {
                if (val !== "onlinePayment" && val !== "cash" && val !== "cheque") {
                    throw new ErrorHandler("Please enter valid payment method", HttpStatus.BAD_REQUEST);
                }
            });

            await Lab.findOneAndUpdate({ userId }, { description, paymentMethod });
            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Payment and description update successfully" });
        } else {
            throw new ErrorHandler("Please register your self as lab", HttpStatus.BAD_REQUEST);
        }
    }
});

// Edit lab working hour 
const editLabWorkingHour = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { dayStatus, dayDetails } = req.body;

    if (dayDetails.length) {
        const labData = await Lab.findOne({ userId });
        const labWork = await LabWorkHour.findOne({ labId: labData._id });

        if (labWork) {

            await LabWorkHour.findOneAndUpdate({ labId: labWork.labId }, { dayStatus, dayDetails });

            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Working Hours updated successfully.." });

        } else {
            throw new ErrorHandler("Lab Details not found", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("dayDetails is missing", HttpStatus.BAD_REQUEST);
    }
});

module.exports = { addLabDetails, labadditionalDetails, addLabMangersDetails, addLabWorkHours, addAboutLab, labPaymentMethods, getlabProfile, editPaymenthod, editLabDetails, editProfile, editMangersDetails, getLabNotification, editAdditionalDetails, getLabPaymentDetails, editLabWorkingHour }