const catchAsyncError = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { default: mongoose } = require("mongoose");
const Clinic = require("../../models/Clinic");
const Quotes = require("../../models/Quotes");
const Proposal = require("../../models/Proposal");

//  API for get all clinic details
const getclinicList = catchAsyncError(async (req, res, next) => {
    const { offset, limit } = req.body;
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let clinicData = await Clinic.aggregate([
        { $match: { screenStatus: 4 } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: "_id",
                pipeline: [
                    { $project: { firstName: 1, lastName: 1, email: 1, role: 1, isActiveClinic: 1, isDeleted: 1 } },
                    { $match: { isDeleted: 0 } }
                ],
                as: 'userDetails',
            },
        },
        {
            $lookup: {
                from: 'quotes',
                localField: '_id',
                foreignField: "clinicId",
                pipeline: [
                    { $project: { clinicId: 1 } },
                ],
                as: 'quoteDetails',
            },
        },
        { $match: { userDetails: { $gt: [] } } },
    ]);

    if (clinicData?.length) {
        clinicData?.forEach((val) => {
            if (val.quoteDetails) {
                if (val?.quoteDetails?.length) {
                    val.isPossibleDelete = false
                } else {
                    val.isPossibleDelete = true;
                }
            }
        });
    }
    let count = clinicData.length;
    clinicData = clinicData.slice(offsetData, limitData + offsetData);

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, clinicData } });
});

// API for get single clinic details
const getSingleClinic = catchAsyncError(async (req, res, next) => {
    const { Id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(Id)) {
        throw new ErrorHandler("Please Enter Clinic Id", HttpStatus.BAD_REQUEST);
    }

    const clinicData = await Clinic.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(Id) } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: "_id",
                pipeline: [
                    { $project: { firstName: 1, lastName: 1, email: 1, role: 1, isActiveClinic: 1 } }
                ],
                as: 'userDetails',
            },
        },
    ]);

    if (!clinicData.length) {
        throw new ErrorHandler("clinic details not found", HttpStatus.BAD_REQUEST);
    }

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, clinicData });
});

// API for get all Quote Details
const getAllQuotes = catchAsyncError(async (req, res, next) => {
    const { offset, limit, status } = req.body;
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;
    let serching = {};

    if (status) {
        if (status !== "") {
            if (status !== "new" && status !== "accepted" && status !== "completed") {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Plaese Enter valid Status" });
            }
            serching = { quoteStatus: status }
        }
    }

    let quotesData = await Quotes.aggregate([
        { $sort: { createdAt: -1 } },
        { $match: serching },
        {
            $lookup: {
                from: 'clinics',
                localField: 'clinicId',
                foreignField: "_id",
                as: 'clinicDetails',
            },
        },
        {
            $lookup: {
                from: 'quotemasterstatuses',
                localField: '_id',
                foreignField: "quoteId",
                pipeline: [
                    { $project: { quoteId: 1, clinicStatus: 1, labStatus: 1 } }
                ],
                as: 'quoteStatus',
            },
        },
        { $match: { quoteStatus: { $gt: [] } } },
    ]);

    let count = quotesData.length;
    quotesData = quotesData.slice(offsetData, limitData + offsetData);

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, quotesData } });
});

// API for get single Quote Details
const getSingleQuote = catchAsyncError(async (req, res, next) => {

    const { Id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(Id)) {
        throw new ErrorHandler("Please Enter Quote Id", HttpStatus.BAD_REQUEST);
    }

    const quoteData = await Quotes.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(Id) } },
        {
            $lookup: {
                from: 'clinics',
                localField: 'clinicId',
                foreignField: "_id",
                as: 'clinicDetails',
            },
        },
        {
            $lookup: {
                from: 'labs',
                localField: 'labs',
                foreignField: "_id",
                as: 'chooseForLab',
                pipeline: [
                    { $project: { labName: 1 } }
                ],
            },
        },
        {
            $lookup: {
                from: 'servicecategories',
                localField: 'serviceIds',
                foreignField: "_id",
                as: 'serviceDetails',
                pipeline: [
                    { $project: { title: 1 } }
                ],
            },
        },
        {
            $lookup: {
                from: 'quotemasterstatuses',
                localField: '_id',
                foreignField: "quoteId",
                pipeline: [
                    { $project: { quoteId: 1, clinicStatus: 1, } }
                ],
                as: 'quoteMasterStatus',
            },
        },
        {
            $lookup: {
                from: 'proposals',
                localField: '_id',
                foreignField: "quoteId",
                pipeline: [
                    { $project: { updatedAt: 0, __v: 0, clinicId: 0, } },
                ],
                as: 'proposlas',
            },
        },
        {
            $lookup: {
                from: 'labs',
                localField: 'proposlas.labId',
                foreignField: "_id",
                pipeline: [
                    { $project: { labName: 1, countryCode: 1, mobileNumber: 1 } },
                ],
                as: 'labdetails',
            },
        },
        {
            $lookup: {
                from: 'labs',
                localField: 'isAceptedLab',
                foreignField: "_id",
                pipeline: [
                    { $project: { labName: 1, countryCode: 1, mobileNumber: 1, description: 1 } },
                ],
                as: 'acceptProposalLab',
            },
        },
        {
            $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: "quoteId",
                pipeline: [
                    { $project: { __v: 0, updatedAt: 0, clinicId: 0, } },
                ],
                as: 'orderDetails',
            },
        },
        {
            $lookup: {
                from: 'quotestatuses',
                localField: '_id',
                foreignField: "quoteId",
                pipeline: [
                    { $project: { quoteId: 1, clinicStatus: 1, createdAt: 1, } },
                ],
                as: 'quoteStatusDetails',
            }
        },
        {
            $project: {
                clinicId: 1, quoteNumber: 1, title: 1, description: 1, serviceIds: 1, priority: 1, quoteStatus: 1, chooseFor: 1, labs: 1, quoteImages: 1, quoteMasterStatus: 1, status: 1, createdAt: 1, isAceptedLab: 1,
                clinicDetails: 1, chooseForLab: 1, serviceDetails: 1,
                acceptedLab: {
                    $map: {
                        input: "$acceptProposalLab",
                        as: "labs",
                        in: {
                            $mergeObjects: [
                                "$$labs",
                                {
                                    orderDetails: {
                                        $arrayElemAt: [{
                                            $filter: {
                                                input: "$orderDetails",
                                                as: "orders",
                                                cond: { $eq: ["$$orders.labId", "$$labs._id"] }
                                            }
                                        }, 0]

                                    },
                                }
                            ]
                        }
                    },
                },
                labPropsal: {
                    $map: {
                        input: "$proposlas",
                        as: "proposalDetails",
                        in: {
                            $mergeObjects: [
                                "$$proposalDetails",
                                {
                                    labDetails: {
                                        $arrayElemAt: [{
                                            $filter: {
                                                input: "$labdetails",
                                                as: "labs",
                                                cond: { $eq: ["$$labs._id", "$$proposalDetails.labId"] }
                                            }
                                        }, 0]

                                    },
                                }
                            ]
                        }
                    },
                },
                quoteHistory: {
                    $map: {
                        input: "$quoteStatusDetails",
                        as: "quotesStatsas",
                        in: {
                            $mergeObjects: [
                                "$$quotesStatsas",
                                {
                                    orderDetails: {
                                        $arrayElemAt: [{
                                            $filter: {
                                                input: "$orderDetails",
                                                as: "orderas",
                                                cond: { $eq: ["$$orderas.quoteId", "$$quotesStatsas.quoteId"] }
                                            }
                                        }, 0]
                                    },
                                    labName: {
                                        $arrayElemAt: ['$acceptProposalLab.labName', 0],
                                    },
                                }
                            ]
                        }
                    },
                },
            }
        }
    ]);

    // const quoteHistory = await Quotes.aggregate([
    //     { $match: { _id: new mongoose.Types.ObjectId(Id) } },
    //     {
    //         $lookup: {
    //             from: 'labs',
    //             localField: 'isAceptedLab',
    //             foreignField: "_id",
    //             pipeline: [
    //                 { $project: { labName:1,} },
    //             ],
    //             as: 'labDetails',
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: 'quotestatuses',
    //             localField: '_id',
    //             foreignField: "quoteId",
    //             pipeline: [
    //                 { $project: { quoteId:1,clinicStatus: 1, createdAt: 1,} },
    //             ],
    //             as: 'quoteStatusDetails',
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: 'orders',
    //             localField: '_id',
    //             foreignField: "quoteId",
    //             pipeline: [
    //                 { $project: { __v: 0, updatedAt: 0,orderId:0, clinicId: 0, } },
    //             ],
    //             as: 'orderDetails',
    //         },
    //     },
    //     {$project:{
    //         // quoteStatusDetails:1,orderDetails:1,
    //         quoteHistory: {
    //             $map: {
    //                 input: "$quoteStatusDetails",
    //                 as: "quotesStatsas",
    //                 in: {
    //                     $mergeObjects: [
    //                         "$$quotesStatsas",
    //                         {
    //                             orderDetails: {
    //                                 $arrayElemAt: [{
    //                                     $filter: {
    //                                         input: "$orderDetails",
    //                                         as: "orderas",
    //                                         cond: { $eq: ["$$orderas.quoteId", "$$quotesStatsas.quoteId"] }
    //                                     }
    //                                 }, 0]
    //                             },
    //                             labDetails: {
    //                                  $arrayElemAt: ['$labDetails.labName', 0] ,
    //                             },
    //                         }
    //                     ]
    //                 }
    //             },
    //         },
    //     }}
    // ])

    if (!quoteData.length) {
        throw new ErrorHandler("quote details not found", HttpStatus.BAD_REQUEST);
    }

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, quoteData });
    // return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true,quoteHistory, quoteData });
});

// API for get single quote proposals
const getQuoteProposals = catchAsyncError(async (req, res, next) => {
    const { quoteId, limit, offset } = req.body;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote id", HttpStatus.BAD_REQUEST);
    }

    let proposalData = await Proposal.aggregate([
        { $match: { quoteId: new mongoose.Types.ObjectId(quoteId) } },
    ]);

    if (!proposalData.length) {
        throw new ErrorHandler("Proposal details not found", HttpStatus.BAD_REQUEST);
    }

    const count = proposalData.length;
    proposalData = proposalData.slice(offsetData, limitData + offsetData);

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, proposalData } })
});

module.exports = { getclinicList, getSingleClinic, getAllQuotes, getSingleQuote, getQuoteProposals }