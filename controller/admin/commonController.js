const catchAsyncError = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const Clinic = require("../../models/Clinic");
const User = require("../../models/User");
const { default: mongoose } = require("mongoose");
const Lab = require("../../models/Lab");
const Admin = require("../../models/Admin");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const formidable = require("formidable");
const { Constants } = require("../../utils/Constant");
const Quotes = require("../../models/Quotes");
const Proposal = require("../../models/Proposal");
const ServiceCategory = require("../../models/ServiceCategory");


// get all users list of activate account
const getAllUsers = catchAsyncError(async (req, res, next) => {
    const { limit, offset } = req.query;
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let userData = await User.aggregate([
        { $match: { isDeleted: 0 } },
        {
            $lookup: {
                from: 'labs',
                localField: '_id',
                foreignField: "userId",
                pipeline: [
                    { $project: { screenStatus: 1 } },
                ],
                as: 'labDetails',
            },
        },
        {
            $lookup: {
                from: 'clinics',
                localField: '_id',
                foreignField: "userId",
                pipeline: [
                    { $project: { screenStatus: 1 } },
                ],
                as: 'clinicDetails',
            },
        },
        { $sort: { createdAt: -1 } },
        { $project: { _resetPasswordToken: 0, __v: 0, updatedAt: 0 } }
    ]);

    if (userData?.length) {
        await Promise.all(userData.map(async (val) => {
            val.isPossibleDelete = true;
            if (val?.labDetails.length) {
                if (val?.labDetails[0]?.screenStatus === 7) {
                    const quoteData = await Quotes.findOne({ isAceptedLab: val?.labDetails[0]?._id });
                    if (quoteData) {
                        val.isPossibleDelete = false;
                    }
                    const propsalData = await Proposal.findOne({ labId: val?.labDetails[0]?._id });
                    if (propsalData) {
                        val.isPossibleDelete = false;
                    }
                }
            }
            if (val?.clinicDetails.length) {
                if (val?.clinicDetails[0]?.screenStatus === 4) {
                    const quoteData = await Quotes.findOne({ clinicId: val?.clinicDetails[0]?._id });
                    if (quoteData) {
                        val.isPossibleDelete = false;
                    }
                }
            }
        }));
    }

    let count = userData.length;
    userData = userData.slice(offsetData, limitData + offsetData);
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, userData } });
});

const getAdminProfile = catchAsyncError(async (req, res, next) => {

    const Id = req.admin;
    const baseProfilePath = Constants.adminProfile;
    const data = await Admin.findOne(
        { _id: Id },
        // {profileImage: { $concat: [baseProfilePath, '$profileImage'] }}
    ).select({ _id: 1, email: 1, firstName: 1, lastName: 1, createdAt: 1, profileImage: 1 });

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data });
})

// For Edit Admin Details
// Thsi code is for update image in base 64 data
const updateAdminProfile = catchAsyncError(async (req, res, next) => {


    const Id = req.admin;
    const { firstName, lastName, email, profileImage } = req.body;

    if (!firstName) {
        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `first name is required` });
    }

    if (!lastName) {
        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `last name is required` });
    }
    if (!email) {
        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `email is required` });
    }

    const adminData = await Admin.findOne({ _id: Id });

    if (adminData) {

        if (profileImage) {
            let base64String = profileImage;
            let base64Image = base64String.split(';base64,').pop();
            let mimeType = base64String.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            const fileData = mimeType.split("/");
            const extension = fileData[1].toLowerCase();

            if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
            }


            await cloudinary.config({
                cloud_name: process.env.CLOUDINARY_NAME,
                api_key: process.env.CLOUDINARYAPI_KEY,
                api_secret: process.env.CLOUDINARYAPI_SECRET
            });
            const result = await cloudinary.uploader.upload(base64String, { folder: 'dental' });
            if (result.url) {
                const fileName = result.url;
                try {
                    adminData.profileImage = fileName;
                } catch (error) {
                    console.log("🚀 ~ file: commonController.js:88 ~ updateAdminProfile ~ error:", error)
                    return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                }
            }

            // let temp = "admin"
            // const fileName = (temp = uuidv4() + "." + extension);
            // const newPath = __dirname + `/../../public/Images/Profile/${temp}`

            // fs.writeFile(newPath, base64Image, { encoding: 'base64' }, function (err) {
            //     console.log('File created');
            // });

            // const oldImage = adminData.profileImage;

            // const filedata = __dirname + `/../../public/Images/Profile/${oldImage}`
            // fs.unlink(filedata, (err) => {
            //     if (err) {
            //     }
            // });
            // adminData.profileImage = fileName;
        }

        adminData.firstName = firstName;
        adminData.lastName = lastName;
        adminData.email = email;

        await adminData.save();
    }

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Profile updated successfully" });


});

// This code is for update admin profile image upload in form data
// const updateAdminProfile = catchAsyncError(async (req, res, next) => {
//     const Id = req.admin;
//     const form = formidable({ multiples: true });

//     form.parse(req, async (err, fields, files) => {
//         const { firstName, lastName, email } = fields;
//         if (!firstName) {
//             return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `first name is required` });
//         }

//         if (!lastName) {
//             return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `last name is required` });
//         }
//         if (!email) {
//             return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `email is required` });
//         }
//         const adminData = await Admin.findOne({ _id: Id });
//         if (adminData) {
//             adminData.firstName = firstName;
//             adminData.lastName = lastName;
//             adminData.email = email;

//             if (files.profileImage) {
//                 const imgName = files.profileImage.originalFilename.split(".");
//                 const extension = imgName[1];

//                 if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
//                     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} file is not allowed..` });
//                 }

//                 // this for cloudinary image
//                 await cloudinary.config({
//                     cloud_name: process.env.CLOUDINARY_NAME,
//                     api_key: process.env.CLOUDINARYAPI_KEY,
//                     api_secret: process.env.CLOUDINARYAPI_SECRET
//                 });
//                 const result = await cloudinary.uploader.upload(files.profileImage.filepath, { folder: 'dental' });
//                 if (result.url) {
//                     const fileName = result.url;
//                     try {
//                         adminData.profileImage = fileName;
//                         await adminData.save();
//                     } catch (error) {
//                         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
//                     }
//                 }

//                 // This for upload image in local server
//                 // const fileName = (files.profileImage.originalFilename = uuidv4() + "." + extension);
//                 // const newPath = __dirname + `/../../public/Images/Profile/${fileName}`;

//                 // const imageData = files.profileImage.originalFilename;
//                 // const oldImage = adminData.profileImage;
//                 // try {
//                 //     fs.copyFile(files.profileImage.filepath, newPath, async (error) => {
//                 //         if (!error) {
//                 //             adminData.profileImage = imageData;
//                 //             await adminData.save();

//                 //             const filedata = __dirname + `/../../public/Images/Profile/${oldImage}`
//                 //             fs.unlink(filedata, (err) => {
//                 //                 if (err) {
//                 //                 }
//                 //             });
//                 //         }
//                 //     })
//                 // } catch (error) {
//                 //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Profile Image Uploading" });
//                 // }
//             }

//             await Admin.findByIdAndUpdate({ _id: Id }, { firstName, lastName, email });

//             return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Profile updated successfully" });
//         } else {
//             return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "admin data not found" });
//         }
//     });
// });

// API for activate both clinic and Lab account

const activateAccount = catchAsyncError(async (req, res, next) => {
    const { userId, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ErrorHandler("Please Enter valid user Id", HttpStatus.BAD_REQUEST);
    }

    if (status != 0 && status != 1) throw new ErrorHandler("Please Enter valid Status", HttpStatus.BAD_REQUEST);

    const user = await User.findById({ _id: userId });

    if (!user) {
        throw new ErrorHandler("User Not Found.", HttpStatus.BAD_REQUEST);
    };

    if (user) {
        user.isActived = status;
    }

    await user.save();
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Account status changed successfully" });

});

// API for change status means activate or de activate lab or clinic account
const changeStatus = catchAsyncError(async (req, res, next) => {
    const { type, status, Id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(Id)) throw new ErrorHandler("Please Enter valid Id", HttpStatus.BAD_REQUEST);
    if (type !== "lab" && type !== "clinic") throw new ErrorHandler("Please Enter lab or clinic type  for change stataus", HttpStatus.BAD_REQUEST);
    if (status != 0 && status != 1) throw new ErrorHandler("Please Enter valid Status", HttpStatus.BAD_REQUEST);


    if (type === "lab") {
        const labData = await Lab.findOne({ _id: Id });

        if (!labData) {
            throw new ErrorHandler("Lab Details not found", HttpStatus.BAD_REQUEST);
        }
        const labDetails = await User.findOne({ _id: labData.userId });


        labDetails.isActiveLab = status;
        await labDetails.save();
    }
    if (type === "clinic") {
        const clinicData = await Clinic.findOne({ _id: Id });

        if (!clinicData) {
            throw new ErrorHandler("Clinic Details not found", HttpStatus.BAD_REQUEST);
        }

        const clinicDetails = await User.findOne({ _id: clinicData.userId });

        clinicDetails.isActiveClinic = status;
        await clinicDetails.save();
    }

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Status changed successfully" });
});

// For Edit Password
const changeAdminPassword = catchAsyncError(async (req, res, next) => {
    const userId = req.admin;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) throw new ErrorHandler("Please Enter old Password", HttpStatus.BAD_REQUEST);
    if (!newPassword) throw new ErrorHandler("Please Enter new Password", HttpStatus.BAD_REQUEST);

    const adminData = await Admin.findOne({ _id: userId });

    const valiPassword = await bcrypt.compare(oldPassword, adminData.password);

    if (!valiPassword) {
        throw new ErrorHandler("old password is not valid", HttpStatus.BAD_REQUEST);
    }

    if (newPassword.length < 6) throw new ErrorHandler("new password must be six charcter", HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    adminData.password = hashedPassword;
    await adminData.save();

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Password change successfully" });
});

// For delete users (soft delete)
const deleteUser = catchAsyncError(async (req, res, next) => {
    const { Id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(Id)) {
        throw new ErrorHandler("Please Enter valid User Id.", HttpStatus.BAD_REQUEST);
    }
    const userData = await User.findOne({ _id: Id });
    if (userData) {
        const clicnicData = await Clinic.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(Id) }
            },
            {
                $lookup: {
                    from: 'quotes',
                    localField: '_id',
                    foreignField: "clinicId",
                    as: 'quoteDetails',
                },
            },
        ]);

        if (clicnicData.length) {
            if (clicnicData[0]?.quoteDetails.length) {
                throw new ErrorHandler("You can't delete this user", HttpStatus.BAD_REQUEST);
            }
        }
        const labData = await Lab.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(Id) }
            },
            {
                $lookup: {
                    from: 'quotes',
                    localField: '_id',
                    foreignField: "isAceptedLab",
                    as: 'quoteDetails',
                },
            },
        ]);
        if (labData.length) {
            if (labData[0]?.quoteDetails.length) {
                throw new ErrorHandler("You can't delete this user", HttpStatus.BAD_REQUEST);
            }
        }
        userData.isDeleted = 1;
        if (userData.isActiveLab) {
            const labData = await Lab.findOne({ userId: userData._id });
            if (labData) {
                labData.isDeleted = 1;
                await labData.save();
            }
        }
        if (userData.isActiveClinic) {
            const clinicData = await Lab.findOne({ userId: userData._id });
            if (clinicData) {
                clinicData.isDeleted = 1;
                await clinicData.save();
            }
        }
        await userData.save();
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "User deleted successfully" });
    } else {
        throw new ErrorHandler("User Details not found", HttpStatus.BAD_REQUEST);
    }
});

// for add Service Category
const addServiceCategory = catchAsyncError(async (req, res, next) => {
    const { title } = req.body;

    if (!title) {
        throw new ErrorHandler("Please enter service name", HttpStatus.BAD_REQUEST);
    }

    const IsCategoryName = await ServiceCategory.findOne({ title, isDeleted: 0 });
    if (IsCategoryName) {
        throw new ErrorHandler("Service category alreday exists", HttpStatus.BAD_REQUEST);
    } else {
        await ServiceCategory.create({ title });

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Service category added successfully" });
    }

});

// for get All service Category
const getAllServiceCategory = catchAsyncError(async (req, res, next) => {
    const { limit, offset } = req.query;
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;
    let serviceData = await ServiceCategory.find({ isDeleted: 0 }).select("title isDeleted status createdAt");

    let count = serviceData.length;
    serviceData = serviceData.slice(offsetData, limitData + offsetData);
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, serviceData } });
});

module.exports = { getAdminProfile, getAllUsers, activateAccount, changeStatus, updateAdminProfile, changeAdminPassword, deleteUser, addServiceCategory, getAllServiceCategory }