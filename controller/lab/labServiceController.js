const catchAsyncError = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { v4: uuidv4 } = require('uuid');
const formidable = require("formidable");
const Lab = require("../../models/Lab");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const { validatelandlineNumber, isDateValid, validateMobileNumber } = require("../../utils/basicValidations");
const Services = require("../../models/Services");
const { default: mongoose } = require("mongoose");
const { pathEndpoint, Constants } = require("../../utils/Constant");
const ServiceCategory = require("../../models/ServiceCategory");

// get all services
const getAllLabServiceCategory = catchAsyncError(async (req, res, next) => {
    const data = await ServiceCategory.find({ status: 1, isDeleted: 0 }).select("title isDeleted status");
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data });
});

// Add Lab Services 
const addServices = catchAsyncError(async (req, res, next) => {
    const userId = req.user;

    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        const { title, description, price, serivceCategoryId } = fields;
        const labData = await Lab.findOne({ userId });

        if (labData.screenStatus !== 7) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please complete your lab setup" });
        }

        if (!title) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Service title is required" });
        }

        if (!description) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Service description is required" });
        }

        if (!price) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Service price is required" });
        }

        if (price) {
            if (isNaN(price)) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid price" });
            }
        }

        if (!files.serviceImags) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Service Images is required" });
        }

        const serviceTitle = await Services.findOne({ labId: labData._id, title });

        if (serviceTitle) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "This type of service already added" });
        }

        if (serivceCategoryId) {
            if (!mongoose.Types.ObjectId.isValid(serivceCategoryId)) {
                throw new ErrorHandler("Please enter valid service category Id", HttpStatus.BAD_REQUEST);
            }
            const findCategory = await ServiceCategory.findOne({ _id: serivceCategoryId });
            if (!findCategory) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "service catetgory not found" });
            }
        }

        let Images = [];
        if (!!files.serviceImags && !files.serviceImags.length) {
            try {
                const imgName = files.serviceImags.originalFilename.split(".");
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
                const result = await cloudinary.uploader.upload(files.serviceImags.filepath, { folder: 'dental' });
                if (result.url) {
                    const fileName = result.url;
                    try {
                        Images.push(fileName);
                    } catch (error) {
                        return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                    }
                }

                // This for upload Images on local server
                // const fileName = (files.serviceImags.originalFilename = uuidv4() + "." + extension);
                // const newPath = __dirname + `/../../public/Images/Services/${fileName}`;
                // fs.copyFile(files.serviceImags.filepath, newPath, async (error) => {
                //     if (error) {
                //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in uploading file" })
                //     }
                // })
                // Images.push(fileName);

            } catch (error) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, error });
            }
        } else if (files.serviceImags.length > 0) {
            try {
                await Promise.all(files.serviceImags.map(async (newImg) => {
                    const imgName = newImg.originalFilename.split(".");
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
                    const result = await cloudinary.uploader.upload(newImg.filepath, { folder: 'dental' });
                    if (result.url) {
                        const fileName = result.url;
                        try {
                            Images.push(fileName);
                        } catch (error) {
                            console.log("🚀 ~ file: labServiceController.js:113 ~ files.serviceImags.forEach ~ error:", error)
                            // return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                        }
                    }

                    // This for upload Images on local server
                    // const fileName = (newImg.originalFilename = uuidv4() + "." + extension);
                    // const newPath = __dirname + `/../../public/Images/Services/${fileName}`;
                    // fs.copyFile(newImg.filepath, newPath, async (error) => {
                    //     if (error) {
                    //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in uploading file" })
                    //     }
                    // })
                    // Images.push(fileName);
                }));

            } catch (error) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Image uploading" });
            }
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "services images are missing." });
        }

        if (Images.length) {
            const labServices = await Services.create({ serivceCategoryId, title, description, price, labId: labData._id, serviceImags: Images });
            labData.serviceIds.push(labServices._id);
            await labData.save();
            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Services added successfully." });
        }
    })
});

// Get all lab services
const getAllServices = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { limit, offset } = req.query;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let message;
    const labData = await Lab.findOne({ userId });
    if (labData) {
        let serviceData = await Services.aggregate([
            { $match: { labId: new mongoose.Types.ObjectId(labData._id) } },
            { $sort: { createdAt: -1 } },
            { $project: { title: 1, price: 1 } }
        ]);

        if (!serviceData.length) {
            message = "Services not found"
        }

        const count = serviceData.length;
        serviceData = serviceData.slice(offsetData, offsetData + limitData);

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message, count, serviceData });
    } else {
        throw new ErrorHandler("Lab data not found", HttpStatus.BAD_REQUEST);
    }
});

// Get all service details
const serviceDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user
    const { serviceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        throw new ErrorHandler("Plaese Enter Service Id", HttpStatus.BAD_REQUEST);
    }
    const baseServicePath = Constants.serviceImgBase;

    const labData = await Lab.findOne({ userId });
    const serviceData = await Services.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(serviceId) } },
        {
            $project: {
                labId: 1, title: 1, description: 1, price: 1, status: 1, createdAt: 1,
                serviceImags: 1
                // profileImage:{
                //     $map: {
                //       input: '$serviceImags',
                //       as: 'img',
                //       in: { $concat: [baseServicePath, '$$img'] }
                //     }
                // }
            }
        }
    ]);

    const allServices = await Services.aggregate([
        { $match: { labId: labData._id } },
        { $project: { title: 1, serviceImags: 1 } }
    ])
    //{profileImage: { $concat: [baseServicePath, '$serviceImags'] }}

    if (!serviceData) {
        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Service data not found" });
    }
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, serviceData, allServices });
});

// Get single lab services
const getSingleService = catchAsyncError(async (req, res, next) => {
    const { serviceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        throw new ErrorHandler("Plaese Enter Service Id", HttpStatus.BAD_REQUEST);
    }
    const baseServicePath = Constants.serviceImgBase;


    const serviceData = await Services.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(serviceId) } },
        {
            $project: {
                labId: 1, serivceCategoryId: 1, title: 1, description: 1, price: 1, status: 1, createdAt: 1,
                serviceImags: 1
                // profileImage:{
                //     $map: {
                //       input: '$serviceImags',
                //       as: 'img',
                //       in: { $concat: [baseServicePath, '$$img'] }
                //     }
                // }
            }
        }
    ]);

    if (!serviceData) {
        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Service data not found" });
    }
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, serviceData });
});

// Delete lab service
const deleteService = catchAsyncError(async (req, res, next) => {
    const { serviceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        throw new ErrorHandler("Plaese Enter Service Id", HttpStatus.BAD_REQUEST);
    }

    const serviceData = await Services.findById({ _id: serviceId });

    if (!serviceData) {
        throw new ErrorHandler("Service not found", HttpStatus.BAD_REQUEST);
    }


    const filebase = serviceData.serviceImags;
    if (filebase) {
        filebase.map((val) => {
            const filedata = __dirname + `/../../public/Images/Services/${val}`
            if (filedata) {
                fs.unlink(filedata, (err) => {
                    if (err) {
                    }
                });
            }
        })
    }

    await Services.findByIdAndDelete({ _id: serviceId });

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Service deleted successfully." });
});

// Edit lab service
const editService = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        const { serviceId, title, description, price, removeImages, serivceCategoryId } = fields;

        const labData = await Lab.findOne({ userId });
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Plaese Enter Service Id" });
        }

        const serviceData = await Services.findOne({ _id: serviceId, labId: labData._id });

        if (!serviceData) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Service not found" });
        }

        if (price) {
            if (isNaN(price)) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid price" });
            }
        }

        if (serivceCategoryId) {
            if (!mongoose.Types.ObjectId.isValid(serivceCategoryId)) {
                throw new ErrorHandler("Please enter valid service category Id", HttpStatus.BAD_REQUEST);
            }
            const findCategory = await ServiceCategory.findOne({ _id: serivceCategoryId });
            if (!findCategory) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "service catetgory not found" });
            }
        }

        // if (removeImages) {
        //     if (removeImages.length) {
        //         const filebase = serviceData.serviceImags;
        //         if (filebase) {
        //             filebase.map((val) => {
        //                 if (removeImages.includes(val)) {
        //                     const filedata = __dirname + `/../../public/Images/Services/${val}`;
        //                     if (filedata) {
        //                         fs.unlink(filedata, (err) => {
        //                             if (err) {
        //                             }
        //                         });
        //                         serviceData.serviceImags.pull(val)
        //                     }
        //                 }
        //             })
        //         }
        //         await serviceData.save();
        //     }
        // }

        if (files.serviceImags) {
            // if (!!files.serviceImags && !files.serviceImags.length) {
            //     try {
            //         const imgName = files.serviceImags.originalFilename.split(".");
            //         const extension = imgName[1];
            //         if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
            //             return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} is not allowed..` });

            //         }

            //         // This for upload Images on third party cloudinary
            //         await cloudinary.config({
            //             cloud_name: process.env.CLOUDINARY_NAME,
            //             api_key: process.env.CLOUDINARYAPI_KEY,
            //             api_secret: process.env.CLOUDINARYAPI_SECRET
            //         });
            //         const result = await cloudinary.uploader.upload(files.serviceImags.filepath, { folder: 'dental' });
            //         if (result.url) {
            //             const fileName = result.url;
            //             try {
            //                 serviceData.serviceImags.push(fileName);
            //                 await serviceData.save();
            //             } catch (error) {
            //                 console.log("🚀 ~ file: labServiceController.js:310 ~ form.parse ~ error:", error)
            //                 return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
            //             }
            //         }

            //         // This for upload Images on local server
            //         // const fileName = (files.serviceImags.originalFilename = uuidv4() + "." + extension);
            //         // const newPath = __dirname + `/../../public/Images/Services/${fileName}`;
            //         // fs.copyFile(files.serviceImags.filepath, newPath, async (error) => {
            //         //     if (error) {
            //         //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in uploading file" })
            //         //     }
            //         // })
            //         // serviceData.serviceImags.push(fileName);
            //         // await serviceData.save();

            //     } catch (error) {
            //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, error });
            //     }
            // } else
            files.serviceImags = Array.isArray(files.serviceImags) ? files.serviceImags : [files.serviceImags];
            if (files.serviceImags.length) {
                if (removeImages.length) {
                    try {
                        await Promise.all(files.serviceImags.map(async (newImg) => {
                            const imgName = newImg.originalFilename.split(".");
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
                            const result = await cloudinary.uploader.upload(newImg.filepath, { folder: 'dental' });
                            if (result.url) {
                                const fileName = result.url;
                                try {
                                    await serviceData.serviceImags.push(fileName);
                                } catch (error) {
                                    console.log("🚀 ~ file: labServiceController.js:113 ~ files.serviceImags.forEach ~ error:", error)
                                    // return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                                }
                            }

                            // This for upload Images on local server
                            // const fileName = (newImg.originalFilename = uuidv4() + "." + extension);
                            // const newPath = __dirname + `/../../public/Images/Services/${fileName}`;
                            // fs.copyFile(newImg.filepath, newPath, async (error) => {
                            //     if (error) {
                            //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in uploading file" })
                            //     }
                            // });
                            // serviceData.serviceImags.push(fileName);
                        }));

                        await Promise.all(removeImages.map(async (val) => {
                            // This code for cloudinary Image
                            await serviceData.serviceImags.pull(val);

                            // This code for local server
                            //     const filedata = __dirname + `/../../public/Images/Services/${val}`;
                            //     console.log("🚀 ~ file: labServiceController.js:409 ~ removeImages.map ~ val:", val)
                            //     await serviceData.serviceImags.pull(val);
                            //     fs.unlink(filedata, (err) => {
                            //         if (err) {
                            //         }

                        }));

                        await serviceData.save();
                    } catch (error) {
                        console.log("🚀 ~ file: labServiceController.js:138 ~ form.parse ~ error:", error)
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Image uploading" });
                    }
                } else {
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter old service images" });
                }
            }
        }

        await Services.findByIdAndUpdate({ _id: serviceId }, { serivceCategoryId, title, description, price });

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "service updated successfully" });
    })
});

module.exports = { getAllLabServiceCategory, addServices, getAllServices, getSingleService, deleteService, editService, serviceDetails }