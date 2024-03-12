const catchAsyncError = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { default: mongoose } = require("mongoose");
const Lab = require("../../models/Lab");
const Services = require("../../models/Services");

// API for get all lab details
const getallLabs = catchAsyncError(async (req, res, next) => {
    const { offset, limit } = req.body;

    const limitData = parseInt(limit, 10) || 30;
    const offsetData = parseInt(offset, 10) || 0;

    let labData = await Lab.aggregate([
        { $match: { screenStatus: 7 } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: "_id",
                pipeline: [
                    { $project: { firstName: 1, lastName: 1, email: 1, role: 1, isActiveLab: 1, isDeleted: 1 } },
                    { $match: { isDeleted: 0 } }
                ],
                as: 'userDetails',
            },
        },
        {
            $lookup: {
                from: 'quotes',
                localField: '_id',
                foreignField: "isAceptedLab",
                pipeline: [
                    { $project: { isAceptedLab: 1 } },
                ],
                as: 'quoteDetails',
            },
        },
        { $match: { userDetails: { $gt: [] } } },
    ]);

    if (labData?.length) {
        labData.forEach((val) => {
            if (val.quoteDetails) {
                if (val?.quoteDetails?.length) {
                    val.isPossibleDelete = false
                } else {
                    val.isPossibleDelete = true;
                }
            }
        });
    }
    let count = labData.length;
    labData = labData.slice(offsetData, limitData + offsetData);

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, labData } });
});

// API for get single lab details
const getSingleLab = catchAsyncError(async (req, res, next) => {
    const { Id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(Id)) {
        throw new ErrorHandler("Please Enter Lab Id", HttpStatus.BAD_REQUEST);
    }

    const labData = await Lab.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(Id) } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: "_id",
                pipeline: [
                    { $project: { firstName: 1, lastName: 1, email: 1, role: 1, isActiveLab: 1 } }
                ],
                as: 'userDetails',
            },
        },
    ]);

    if (!labData) {
        throw new ErrorHandler("Lab details not found", HttpStatus.BAD_REQUEST);
    }

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, labData });
});

// API for get all services of lab's
const getAllLabService = catchAsyncError(async (req, res, next) => {
    const { labId, offset, limit } = req.body;

    if (!mongoose.Types.ObjectId.isValid(labId)) {
        throw new ErrorHandler("Please Enter Valid Lab Id", HttpStatus.BAD_REQUEST);
    }

    const labData = await Lab.findOne({ _id: labId });

    if (!labData) {
        throw new ErrorHandler("lab details not found", HttpStatus.BAD_REQUEST);
    }
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let serviceData = await Services.aggregate([
        { $match: { labId: new mongoose.Types.ObjectId(labId) } },
        { $sort: { createdAt: -1 } },
    ]);
    let count = serviceData.length;
    serviceData = serviceData.slice(offsetData, limitData + offsetData);

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, serviceData } });
});

//API for get single service details
const getSingleService = catchAsyncError(async (req, res, next) => {
    const { serviceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        throw new ErrorHandler("Please Enter Service Id", HttpStatus.BAD_REQUEST);
    }

    const serviceData = await Services.findOne({ _id: serviceId });

    if (!serviceData) {
        throw new ErrorHandler("Service Details not found", HttpStatus.BAD_REQUEST);
    }

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, serviceData });
});

// API for change service status
const changeServiceStatus = catchAsyncError(async (req, res, next) => {
    const { serviceId, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        throw new ErrorHandler("Please Enter Service Id", HttpStatus.BAD_REQUEST);
    }

    if (status != 0 && status != 1) throw new ErrorHandler("Please Enter valid Status", HttpStatus.BAD_REQUEST);

    const serviceData = await Services.findOne({ _id: serviceId });

    if (!serviceData) {
        throw new ErrorHandler("Service Details not found", HttpStatus.BAD_REQUEST);
    }

    serviceData.status = status;
    await serviceData.save();

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Service status changed successfully" });
});


module.exports = { getallLabs, getAllLabService, getSingleLab, getSingleService, changeServiceStatus }