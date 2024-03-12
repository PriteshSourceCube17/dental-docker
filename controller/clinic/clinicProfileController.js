const catchAsyncError = require("../../middleware/catchAsyncError");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const config = require("../../config/config");
const Clinic = require("../../models/Clinic");
const emailvalidator = require("email-validator");
const formidable = require("formidable");
const User = require("../../models/User");
const { isDateValid, validateMobileNumber } = require("../../utils/basicValidations");
const cloudinary = require("cloudinary").v2;
const moment = require("moment/moment");
const { v4: uuidv4 } = require('uuid');
const OrderMaster = require("../../models/OrderMaster");
const { default: mongoose } = require("mongoose");
const Notification = require("../../models/Notification");
const fs = require("fs");

// This first step for add clicnic details
const addClinicDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { clinicName, countryCode, mobileNumber, landLineNumber, country, state, city, address, poBox, dateOfEstablishment } = req.body;

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

    if (isNaN(landLineNumber)) {
        throw new ErrorHandler("Please Enter valid land line number", HttpStatus.BAD_REQUEST);
    }

    const user = await User.findOne({ _id: userId });
    if (user) {
        const clinicData = await Clinic.findOne({ userId });

        if (clinicData) {
            clinicData.clinicName = clinicName;
            clinicData.countryCode = countryCode;
            clinicData.mobileNumber = mobileNumber;
            clinicData.landLineNumber = landLineNumber;
            clinicData.country = country;
            clinicData.city = city;
            clinicData.state = state;
            clinicData.address = address;
            clinicData.poBox = poBox;
            clinicData.dateOfEstablishment = dateOfEstablishment;
            clinicData.screenStatus = 2;
            await clinicData.save();
            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Clinic details added successfully." });
        } else {
            throw new ErrorHandler("Please register your self as clinic", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("User data not found", HttpStatus.BAD_REQUEST);
    }
});

// This second step for add aditional clinic details
const addaditionalClinicDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        const { licensingAuthority, medicalLicenseNumber, tradeLicenceNumber, TRN_number } = fields;

        const user = await User.findOne({ _id: userId });
        if (user) {
            const clinicData = await Clinic.findOne({ userId });

            if (clinicData) {
                if (files.licensFile) {
                    const imgName = files.licensFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    // from here cloudinary setup
                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.licensFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            clinicData.licensFile = fileName;
                            // await clinicData.save();
                        } catch (error) {
                            return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // from here local server Image uploading
                    // const fileName = (files.licensFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/licences/${fileName}`;

                    // const imageData = files.licensFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.licensFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             clinicData.licensFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(500).json({status:500,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }

                if (files.tradeFile) {
                    const imgName = files.tradeFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    // from here cloudinary setup
                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.tradeFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            clinicData.tradeFile = fileName;
                            // await clinicData.save();
                        } catch (error) {
                            return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // from here local server Image uploading
                    // const fileName = (files.tradeFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/Trades/${fileName}`;

                    // const imageData = files.tradeFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.tradeFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             clinicData.tradeFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(500).json({status:500,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }

                if (files.trnFile) {
                    const imgName = files.trnFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    // from here cloudinary setup
                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.trnFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            clinicData.trnFile = fileName;
                            // await clinicData.save();
                        } catch (error) {
                            return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // from here local server Image uploading
                    // const fileName = (files.trnFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/TRN/${fileName}`;

                    // const imageData = files.trnFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.trnFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             clinicData.trnFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(500).json({status:500,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }
                await clinicData.save();
                await Clinic.findOneAndUpdate({ userId }, { licensingAuthority, medicalLicenseNumber, tradeLicenceNumber, TRN_number, screenStatus: 3 });

                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "additional details added" });
            } else {
                throw new ErrorHandler("Please register your self as clinic", HttpStatus.BAD_REQUEST);
            }
        } else {
            throw new ErrorHandler("User data not found", HttpStatus.BAD_REQUEST);
        }
    })
});

// This third step for add clicnic mangers details
const addClinicMangerDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        const { clinicMangerName, clinicMangerCountryCode, clinicMangerNumber, clinicMangerEmail, medicalDirectorName, medicalDirectorNumber,
            medicalDirectorCountryCode, medicalDirectorEmail, directorLicensNumber, finacialMangerName, finacialMangerCountryCode, finacialMangerNumber, finacialMangerEmail } = fields;


        if (clinicMangerEmail) {
            if (!emailvalidator.validate(clinicMangerEmail)) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid clinic manger email" });
            }
        }

        if (medicalDirectorEmail) {
            if (!emailvalidator.validate(medicalDirectorEmail)) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid medical director email" });
            }
        }

        if (finacialMangerEmail) {
            if (!emailvalidator.validate(finacialMangerEmail)) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid finacial email" });
            }
        }

        // if(!clinicMangerCountryCode){
        //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Clinic manger country code is required" });
        // }

        // if (clinicMangerNumber) {
        //     const isValid = validateMobileNumber(clinicMangerNumber);
        //     if (!isValid) {
        //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid clinic manger number" });
        //     }
        // }

        // if(!medicalDirectorCountryCode){
        //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Clinic medical directory country code is required" });
        // }

        // if (medicalDirectorNumber) {
        //     const isValid = validateMobileNumber(medicalDirectorNumber);
        //     if (!isValid) {
        //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid medical director number" });
        //     }
        // }

        // if(!finacialMangerCountryCode){
        //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Clinic financial manger country code is required" });
        // }

        // if (finacialMangerNumber) {
        //     const isValid = validateMobileNumber(finacialMangerNumber);
        //     if (!isValid) {
        //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid finacial manger number" });
        //     }
        // }

        const user = await User.findOne({ _id: userId });
        if (user) {
            const clinicData = await Clinic.findOne({ userId });

            if (clinicData) {
                if (files.directorLicensFile) {
                    const imgName = files.directorLicensFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    // from here cloudinary setup
                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.directorLicensFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            clinicData.directorLicensFile = fileName;
                            // await labData.save();
                        } catch (error) {
                            return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // from here local server Image uploading
                    // const fileName = (files.directorLicensFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/licences/${fileName}`;

                    // const imageData = files.directorLicensFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.directorLicensFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             labData.directorLicensFile = imageData;
                    //         }
                    //     })                
                    // } catch (error) {
                    //     return res.status(500).json({status:500,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                }

                await Clinic.findOneAndUpdate({ userId }, {
                    clinicMangerName, clinicMangerCountryCode, clinicMangerNumber, clinicMangerEmail, medicalDirectorName, medicalDirectorCountryCode, medicalDirectorNumber,
                    medicalDirectorEmail, directorLicensNumber, finacialMangerName, finacialMangerCountryCode, finacialMangerNumber, finacialMangerEmail, screenStatus: 4
                });
                await clinicData.save();

                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Mangers details added successfully." });
            } else {
                throw new ErrorHandler("Please register your self as clinic", HttpStatus.BAD_REQUEST);
            }
        } else {
            throw new ErrorHandler("User data not found", HttpStatus.BAD_REQUEST);
        }
    })
});

// For get clinic profile information
const getClinicProfile = catchAsyncError(async (req, res, next) => {
    const userId = req.user;

    const data = await Clinic.findOne({ userId })
        .populate({
            path: "userId", select: "firstName lastName email profileImage"
        });

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data });
});

// Api for Payment history of clinic
const getPaymentDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { limit, offset } = req.query;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    const clicnicData = await Clinic.findOne({ userId });

    let paymentData = await OrderMaster.aggregate([
        { $match: { clinicId: new mongoose.Types.ObjectId(clicnicData._id) } },
        {
            $lookup: {
                from: 'labs',
                localField: 'labId',
                foreignField: "_id",
                pipeline: [
                    { $project: { labName: 1 } }
                ],
                as: 'labDetails',
            },
        },

        {
            $project: { orderId: 1, type: 1, totalAmount: 1, paymentMethod: 1, status: 1, reference: 1, createdAt: 1, labDetails: 1 }
        }
    ]);

    const count = paymentData.length;
    paymentData = paymentData.slice(offsetData, limitData + offsetData);
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, count, paymentData });
});

// get notifications
const getClinicNotification = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { limit, offset } = req.query;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    const clinicData = await Clinic.findOne({ userId });

    let notificationData = await Notification.aggregate([
        { $match: { reciverId: new mongoose.Types.ObjectId(clinicData._id) } },
        { $project: { updatedAt: 0, __v: 0, senderId: 0, reciverId: 0 } },
        { $sort: { createdAt: -1 } }
    ]);
    const count = notificationData.length;
    notificationData = notificationData.slice(offsetData, limitData + offsetData);
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, notificationData } });
});

//edit clinic details 
const editClinicDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;

    const clinicData = await Clinic.findOne({ userId });

    const { clinicName, countryCode, mobileNumber, landLineNumber, country, state, city, address, poBox, dateOfEstablishment } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (clinicName) {
        const clinicData = await Clinic.findOne({ clinicName });
        if (clinicData) {
            const clinicNameData = clinicData.clinicName;
            const Id = clinicData.userId;
            if (clinicNameData && userId !== Id.valueOf()) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Clinic name is already exists" });
            }
        }
    }

    if (dateOfEstablishment) {
        if (!isDateValid(dateOfEstablishment)) {
            throw new ErrorHandler("Please Enter valid date format", HttpStatus.BAD_REQUEST);
        }
        if (moment().format('YYYY-MM-DD') <= dateOfEstablishment) {
            throw new ErrorHandler("Date of Establishment is not valid", HttpStatus.BAD_REQUEST);
        }
    }

    if (landLineNumber) {
        if (isNaN(landLineNumber)) {
            throw new ErrorHandler("Please Enter valid land line number", HttpStatus.BAD_REQUEST);
        }
    }

    if (mobileNumber) {
        if (isNaN(mobileNumber)) {
            throw new ErrorHandler("Please Enter valid mobile number", HttpStatus.BAD_REQUEST);
        }
    }

    const data = await Clinic.findOneAndUpdate({ userId }, { clinicName, countryCode, mobileNumber, landLineNumber, country, state, city, address, poBox, dateOfEstablishment });

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Clinic details updated successfully" })
});

// Edit clinic additional details
const editaditionalClinicDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        const { licensingAuthority, medicalLicenseNumber, tradeLicenceNumber, TRN_number, oldLicensFile, oldTradeFile, oldtrnFile } = fields;

        const clinicData = await Clinic.findOne({ userId });

        if (clinicData) {
            if (files.licensFile) {
                if (oldLicensFile) {

                    // if(oldLicensFile !== clinicData.licensFile){
                    //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `old licence file not found` });
                    // }

                    const imgName = files.licensFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    // from here cloudinary setup
                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.licensFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            clinicData.licensFile = fileName;
                            // await clinicData.save();
                        } catch (error) {
                            return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // from here local server Image uploading
                    // const fileName = (files.licensFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/licences/${fileName}`;

                    // const imageData = files.licensFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.licensFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             clinicData.licensFile = imageData;
                    //         }
                    //         const filedata = __dirname + `/../../public/Images/licences/${oldLicensFile}`
                    //         fs.unlink(filedata, (err) => {
                    //             if (err) {
                    //             }
                    //         });
                    //     })                
                    // } catch (error) {
                    //     return res.status(500).json({status:500,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                } else {
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Please Enter old licence file` });
                }
            }

            if (files.tradeFile) {
                if (oldTradeFile) {
                    const imgName = files.tradeFile.originalFilename.split(".");
                    const extension = imgName[1];

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                    }

                    // from here cloudinary setup
                    await cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_NAME,
                        api_key: process.env.CLOUDINARYAPI_KEY,
                        api_secret: process.env.CLOUDINARYAPI_SECRET
                    });
                    const result = await cloudinary.uploader.upload(files.tradeFile.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            clinicData.tradeFile = fileName;
                            // await clinicData.save();
                        } catch (error) {
                            return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // from here local server Image uploading
                    // const fileName = (files.tradeFile.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/Trades/${fileName}`;

                    // const imageData = files.tradeFile.originalFilename;
                    // try {
                    //         fs.copyFile(files.tradeFile.filepath,newPath,async(error)=>{
                    //         if(!error){
                    //             clinicData.tradeFile = imageData;
                    //         }

                    //         const filedata = __dirname + `/../../public/Images/licences/${oldTradeFile}`
                    //         fs.unlink(filedata, (err) => {
                    //             if (err) {
                    //             }
                    //         });
                    //     })                
                    // } catch (error) {
                    //     return res.status(500).json({status:500,success:false,message:"Something is wrong in Profile Image Uploading"});
                    // }
                } else {
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Please Enter last trade file` });
                }
            }

            if (files.trnFile) {
                if (!oldtrnFile) {
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Please Enter last trade file` });
                }
                const imgName = files.trnFile.originalFilename.split(".");
                const extension = imgName[1];

                if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                }

                // from here cloudinary setup
                await cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_NAME,
                    api_key: process.env.CLOUDINARYAPI_KEY,
                    api_secret: process.env.CLOUDINARYAPI_SECRET
                });
                const result = await cloudinary.uploader.upload(files.trnFile.filepath, { folder: 'dental' });
                if (result.url) {
                    const fileName = result.url;
                    try {
                        clinicData.trnFile = fileName;
                        // await clinicData.save();
                    } catch (error) {
                        return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                    }
                }

                // from here local server Image uploading
                // const fileName = (files.trnFile.originalFilename = uuidv4() + "." + extension);
                // const newPath = __dirname + `/../../public/Images/TRN/${fileName}`;

                // const imageData = files.trnFile.originalFilename;
                // try {
                //         fs.copyFile(files.trnFile.filepath,newPath,async(error)=>{
                //         if(!error){
                //             clinicData.trnFile = imageData;
                //         }

                //         const filedata = __dirname + `/../../public/Images/TRN/${removetrnFile}`
                //         fs.unlink(filedata, (err) => {
                //             if (err) {
                //             }
                //         });
                //     })                
                // } catch (error) {
                //     return res.status(500).json({status:500,success:false,message:"Something is wrong in Profile Image Uploading"});
                // }
            }
            await clinicData.save();
            await Clinic.findOneAndUpdate({ userId }, { licensingAuthority, medicalLicenseNumber, tradeLicenceNumber, TRN_number, });

            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "additional details updated successfully" });
        } else {
            throw new ErrorHandler("Please register your self as clinic", HttpStatus.BAD_REQUEST);
        }

    })
});

// Edit clinic manger details
const editClinicMangerDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        const { clinicMangerName, clinicMangerCountryCode, clinicMangerNumber, clinicMangerEmail, medicalDirectorName, medicalDirectorCountryCode, medicalDirectorNumber,
            medicalDirectorEmail, directorLicensNumber, finacialMangerName, finacialMangerCountryCode, finacialMangerNumber, finacialMangerEmail, oldLicenceFile } = fields;


        if (clinicMangerEmail) {
            if (!emailvalidator.validate(clinicMangerEmail)) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid clinic manger email" });
            }
        }

        if (medicalDirectorEmail) {
            if (!emailvalidator.validate(medicalDirectorEmail)) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid medical director email" });
            }
        }

        if (finacialMangerEmail) {
            if (!emailvalidator.validate(finacialMangerEmail)) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Invalid finacial email" });
            }
        }

        // if(!clinicMangerCountryCode){
        //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Clinic manger country code is required" });
        // }

        // if (clinicMangerNumber) {
        //     const isValid = validateMobileNumber(clinicMangerNumber);
        //     if (!isValid) {
        //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid clinic manger number" });
        //     }
        // }

        // if(!medicalDirectorCountryCode){
        //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Clinic medical directory country code is required" });
        // }

        // if (medicalDirectorNumber) {
        //     const isValid = validateMobileNumber(medicalDirectorNumber);
        //     if (!isValid) {
        //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid medical director number" });
        //     }
        // }

        // if(!finacialMangerCountryCode){
        //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Clinic financial manger country code is required" });
        // }

        // if (finacialMangerNumber) {
        //     const isValid = validateMobileNumber(finacialMangerNumber);
        //     if (!isValid) {
        //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid finacial manger number" });
        //     }
        // }

        const user = await User.findOne({ _id: userId });
        if (user) {
            const clinicData = await Clinic.findOne({ userId });

            if (clinicData) {
                if (files.directorLicensFile) {
                    if (oldLicenceFile) {

                        // if(clinicData.directorLicensFile !== oldLicenceFile){
                        //     return res.status(500).json({ status: 500, success: false, message: "Old licence file is wrong" });
                        // }
                        const imgName = files.directorLicensFile.originalFilename.split(".");
                        const extension = imgName[1];

                        if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
                        }

                        // from here cloudinary setup
                        await cloudinary.config({
                            cloud_name: process.env.CLOUDINARY_NAME,
                            api_key: process.env.CLOUDINARYAPI_KEY,
                            api_secret: process.env.CLOUDINARYAPI_SECRET
                        });
                        const result = await cloudinary.uploader.upload(files.directorLicensFile.filepath, { folder: 'dental' });
                        if (result.url) {
                            const fileName = result.url;
                            try {
                                clinicData.directorLicensFile = fileName;
                                // await labData.save();
                            } catch (error) {
                                return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                            }
                        }

                        // from here local server Image uploading
                        // const fileName = (files.directorLicensFile.originalFilename = uuidv4() + "." + extension);
                        // const newPath = __dirname + `/../../public/Images/licences/${fileName}`;

                        // const imageData = files.directorLicensFile.originalFilename;
                        // try {
                        //         fs.copyFile(files.directorLicensFile.filepath,newPath,async(error)=>{
                        //         if(!error){
                        //             labData.directorLicensFile = imageData;
                        //         }
                        //     })                
                        // } catch (error) {
                        //     return res.status(500).json({status:500,success:false,message:"Something is wrong in Profile Image Uploading"});
                        // }
                    } else {
                        return res.status(500).json({ status: 500, success: false, message: "Please enter old licence file" });
                    }
                }

                await Clinic.findOneAndUpdate({ userId }, {
                    clinicMangerName, clinicMangerCountryCode, clinicMangerNumber, clinicMangerEmail, medicalDirectorName, medicalDirectorCountryCode, medicalDirectorNumber,
                    medicalDirectorEmail, directorLicensNumber, finacialMangerName, finacialMangerCountryCode, finacialMangerNumber, finacialMangerEmail,
                });
                await clinicData.save();

                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Mangers details updated successfully." });
            } else {
                throw new ErrorHandler("Please register your self as clinic", HttpStatus.BAD_REQUEST);
            }
        } else {
            throw new ErrorHandler("User data not found", HttpStatus.BAD_REQUEST);
        }
    })
});

// edit clinic profile Image
const editProfileImage = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (files.profileImage) {
            const userData = await User.findOne({ _id: userId });

            const imgName = files.profileImage.originalFilename.split(".");
            const extension = imgName[1];
            if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} is not allowed..` });

            }

            // This for upload Images on third party cloudinary
            await cloudinary.config({
                cloud_name: process.env.CLOUDINARY_NAME,
                api_key: process.env.CLOUDINARYAPI_KEY,
                api_secret: process.env.CLOUDINARYAPI_SECRET
            });
            const result = await cloudinary.uploader.upload(files.profileImage.filepath, { folder: 'dental' });
            if (result.url) {
                const fileName = result.url;
                try {
                    userData.profileImage = fileName;
                } catch (error) {
                    return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                }
            }

            // This for upload Images on local server
            // const fileName = (files.profileImage.originalFilename = uuidv4() + "." + extension);
            // const newPath = __dirname + `/../../public/Images/Profile/${fileName}`;
            // fs.copyFile(files.profileImage.filepath, newPath, async (error) => {
            //     if (error) {
            //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in uploading file" });
            //     }
            // })
            // userData.profileImage = fileName;
            await userData.save();

            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Profile Image updated" });
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `Profile Image is required` });
        }
    })
});

module.exports = { addClinicDetails, addaditionalClinicDetails, addClinicMangerDetails, getClinicProfile, getPaymentDetails, getClinicNotification, editClinicDetails, editaditionalClinicDetails, editClinicMangerDetails, editProfileImage }