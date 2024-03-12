const catchAsyncError = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const Lab = require("../../models/Lab");
const { validatelandlineNumber, isDateValid, validateMobileNumber } = require("../../utils/basicValidations");
const { default: mongoose } = require("mongoose");
const Quotes = require("../../models/Quotes");
const Clinic = require("../../models/Clinic");
const Proposal = require("../../models/Proposal");
const QuoteStatus = require("../../models/QuoteStatus");
const QuoteMasterStatus = require("../../models/QuoteMasterStatus");
const Notification = require("../../models/Notification");
const { validationResult } = require("express-validator");
const moment = require("moment/moment");

// get quotion list 
const getFeeds = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { limit, offset, type } = req.body;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    const labData = await Lab.findOne({ userId }).select('serviceIds').populate({ path: 'serviceIds', select: "serivceCategoryId" });
    let serching = { chooseFor: "public" };

    if (type === "invited") {
        serching = { labs: labData._id }
    }
    if (labData) {
        let quotesdata = await Quotes.aggregate([
            { $match: serching },
            { $match: { quoteStatus: "new" } },
            {
                $project: { title: 1, description: 1, serviceIds: 1, tillDate: 1, createdAt: 1 }
            },
            { $sort: { createdAt: -1 } },
        ]);

        let tempVal = [];
        if (quotesdata && labData) {
            labData.serviceIds.forEach((val) => {
                quotesdata.forEach((ele) => {
                    ele?.serviceIds.forEach((ser) => {
                        if (ser.toString() === val.serivceCategoryId.toString()) {
                            ele.matched = true
                        }
                    })
                })
            });
        }

        
        if (quotesdata) {
            quotesdata = quotesdata?.filter((val) => val.matched === true)
            // This for each loop for check lab send proposal already
            const proposalData = await Proposal.aggregate([
                { $match: { labId: labData._id } },
            ]);

            quotesdata?.forEach((val) => {
                if (val) {
                    val.isSend = 0;
                    proposalData.forEach((ele) => {
                        if (val._id.valueOf() == ele.quoteId.valueOf() && ele.labId.valueOf() == labData._id.valueOf()) {
                            val.isSend = 1;
                        }
                    });
                }
            });

        }
        const count = quotesdata.length;
        quotesdata = quotesdata.slice(offsetData, limitData + offsetData);
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, quotesdata } })
    }
});

// get Quote details
const getSingleFeedQuote = catchAsyncError(async (req, res, next) => {
    const { quoteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote Id", HttpStatus.BAD_REQUEST);
    }

    const quoteData = await Quotes.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(quoteId) } },
        {
            $lookup: {
                from: 'clinics',
                localField: 'clinicId',
                foreignField: "_id",
                pipeline: [
                    { $project: { createdAt: 1, address: 1, city: 1, clinicName: 1, country: 1, dateOfEstablishment: 1, landLineNumber: 1, mobileNumber: 1, poBox: 1, state: 1 } }
                ],
                as: 'clinicDetails',
            },
        },
        {
            $lookup: {
                from: 'servicecategories',
                localField: 'serviceIds',
                foreignField: "_id",
                pipeline: [
                    { $project: { title: 1 } }
                ],
                as: 'serviceDetails',
            },
        },
    ]);


    if (quoteData.length) {
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, quoteData });

    } else {
        throw new ErrorHandler("Quote details not found", HttpStatus.BAD_REQUEST);
    }
});

// add propsal on quote 
const addProposal = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { quoteId, amount, coverLetter, deliverIn } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Plaese Enter valid Quotation Id", HttpStatus.BAD_REQUEST);
    }

    if (isNaN(amount)) {
        throw new ErrorHandler("Please enter valid amount", HttpStatus.BAD_REQUEST);
    }

    const labData = await Lab.findOne({ userId });
    const quoteData = await Quotes.findOne({ _id: quoteId });

    if (quoteData) {
        if (quoteData.quoteStatus === "new") {
            const isAlreadyProposal = await Proposal.find({ quoteId, labId: labData._id });

            if (isAlreadyProposal.length) {
                throw new ErrorHandler("Proposal already sended", HttpStatus.BAD_REQUEST);
            }

            if (labData) {
                if (quoteData.chooseFor === "labList") {
                    const quoteLab = await Quotes.findOne({ labs: labData._id });

                    if (!quoteLab) {
                        throw new ErrorHandler("You are not invited for this quote", HttpStatus.BAD_REQUEST);
                    }
                }

                const clinicId = quoteData.clinicId;
                const findClinic = await Clinic.findById({ _id: clinicId });

                if (!findClinic) {
                    throw new ErrorHandler("Clinic details not found", HttpStatus.BAD_REQUEST);
                }

                const proposalData = await Proposal.create({
                    quoteId, clinicId, labId: labData._id, amount, coverLetter, deliverIn
                });

                if (proposalData) {
                    await Notification.create({ senderId: labData._id, reciverId: clinicId, title: "Get Proposals", description: `Get Proposals from ${labData.labName}` });
                    // const quoteStatusData = await QuoteStatus.findOne({quoteId});
                    // const quoteStausMaster = await QuoteMasterStatus.findOne({quoteId});

                    // if(quoteStatusData){
                    //     quoteStatusData.labId = proposalData.labId;
                    //     quoteStatusData.propsalId = proposalData._id;
                    //     await quoteStatusData.save();
                    // }
                    // if(quoteStausMaster){
                    //     quoteStausMaster.labId = proposalData.labId;
                    //     quoteStausMaster.propsalId = proposalData._id;
                    //     await quoteStausMaster.save();
                    // }
                    // await QuoteStatus.create({ quoteId, proposalId: proposalData._id, labId: proposalData.labId });
                    // await QuoteMasterStatus.create({ quoteId, proposalId: proposalData._id, labId: proposalData.labId });
                }
                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Proposal sended sucessfully" });
            }
        } else {
            throw new ErrorHandler("This quote is alreday accepted", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("Quote data not found", HttpStatus.BAD_REQUEST);
    }
});

// get all quotes details related to quote
const getAllLabQuotes = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { limit, offset, type } = req.body;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    const labData = await Lab.findOne({ userId });
    let serching = { quoteStatus: "accepted" };
    if (labData) {
        if (type === "accepted") {
            serching = { quoteStatus: type };
        }
        if (type === "completed") {
            serching = { quoteStatus: type };
        }
        let quotedata = await Quotes.aggregate([
            { $match: { isAceptedLab: labData._id } },
            { $match: serching },
            {
                $lookup: {
                    from: 'servicecategories',
                    localField: 'serviceIds',
                    foreignField: "_id",
                    pipeline: [
                        { $project: { title: 1 } }
                    ],
                    as: 'serviceDetails',
                },
            },
            {
                $lookup: {
                    from: 'quotemasterstatuses',
                    localField: '_id',
                    foreignField: "quoteId",
                    pipeline: [
                        { $project: { labStatus: 1 } }
                    ],
                    as: 'quoteStatus',
                },
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: { labs: 0, status: 0, __v: 0, updatedAt: 0, tillDate: 0, chooseFor: 0, }
            }
        ]);
        let message;

        if (!quotedata.length) {
            message = "No Quotes available"
        }
        const count = quotedata.length;
        quotedata = quotedata.slice(offsetData, offsetData + limitData);
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message, data: { count, quotedata } });
    } else {
        throw new ErrorHandler("lab data not found", HttpStatus.BAD_REQUEST);
    }
})

// accept advance Payment
const acceptAdvancePayment = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { proposalId, labStatus } = req.bdoy;

    if (!mongoose.Types.ObjectId.isValid(proposalId)) {
        throw new ErrorHandler("Please enter valid propsal Id", HttpStatus.BAD_REQUEST);
    }

    const propsaldata = await Proposal.findOne({ _id: proposalId });

    // labStatus will be waitForPayment
    if (propsaldata) {
        if (labStatus !== "paymentRecived") {
            throw new ErrorHandler("Please enter valid lab status", HttpStatus.BAD_REQUEST);
        }

        await QuoteStatus.create({ proposalId, labId: propsaldata.labId, labStatus });
        const statusMaster = await QuoteMasterStatus.findOne({ proposalId });

        if (statusMaster) {
            statusMaster.labStatus = labStatus;
            await statusMaster.save();
        }

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Paymnet done successfully" });
    } else {
        throw new ErrorHandler("This type of quote not found", HttpStatus.BAD_REQUEST);
    }
});

// work strated from the lab side
const quoteStartedAgain = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { quoteId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid propsal Id", HttpStatus.BAD_REQUEST);
    }
    const quoteData = await Quotes.findOne({ _id: quoteId });
    const propsaldata = await Proposal.findOne({ quoteId, status: 1 });
    const statusMaster = await QuoteMasterStatus.findOne({ quoteId });

    if (propsaldata) {

        if (statusMaster.clinicStatus !== "needModification" && statusMaster.labStatus !== "needModification") {
            throw new ErrorHandler("This delivery is not rejected yet", HttpStatus.BAD_REQUEST);
        }

        const quoteMasterStatus = await QuoteStatus.find({
            quoteId, clinicStatus: "deliveryRejected", labStatus: "deliveryRejected"
        });

        // if(quoteMasterStatus.length >2){
        //     throw new ErrorHandler("Clinic reject you delivery now you can't work on this quote", HttpStatus.BAD_REQUEST);
        // }

        await QuoteStatus.create({ quoteId, labId: quoteData.isAceptedLab, labStatus: "workStarted", clinicStatus: "inProgress" });

        if (statusMaster) {
            statusMaster.labStatus = "workStarted";
            statusMaster.clinicStatus = "inProgress";
            await statusMaster.save();
            const labData = await Lab.findOne({ _id: quoteData.isAceptedLab });
            await Notification.create({ senderId: quoteData.isAceptedLab, reciverId: quoteData.clinicId, title: `Work started again`, description: `${quoteData.title} related to quote work started agian by ${labData.labName}` });
        }

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Quote work started again" });
    } else {
        throw new ErrorHandler("This type of quote not found", HttpStatus.BAD_REQUEST);
    }
});

// out for delivery from lab side
const outForDelivery = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { proposalId, quoteId } = req.body;

    // if (!mongoose.Types.ObjectId.isValid(proposalId)) {
    //     throw new ErrorHandler("Please enter valid propsal Id", HttpStatus.BAD_REQUEST);
    // }
    const labData = await Lab.findOne({ userId });

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid Quote Id", HttpStatus.BAD_REQUEST);
    }
    const quoteData = await Quotes.findOne({ _id: quoteId });
    const propsaldata = await Proposal.findOne({ quoteId, status: 1 });

    if (propsaldata) {
        const statusMaster = await QuoteMasterStatus.findOne({ quoteId });

        if (statusMaster.labStatus === "outForDelivery" && statusMaster.clinicStatus === "outForDelivery") {
            throw new ErrorHandler("Quote already out for delivery", HttpStatus.BAD_REQUEST);
        }

        await QuoteStatus.create({ quoteId, labId: quoteData.isAceptedLab, labStatus: "outForDelivery", clinicStatus: "outForDelivery" });

        if (statusMaster) {
            statusMaster.labStatus = "outForDelivery";
            statusMaster.clinicStatus = "outForDelivery";
            await statusMaster.save();
        }

        await Notification.create({ senderId: labData, reciverId: propsaldata.clinicId, title: `Quote is out for delivery`, description: `Your Quote ${quoteData.title} is out for delivery` })
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Quote out for delivery" });
    } else {
        throw new ErrorHandler("This type of quote not found", HttpStatus.BAD_REQUEST);
    }
});

module.exports = { getFeeds, addProposal, acceptAdvancePayment, quoteStartedAgain, outForDelivery, getAllLabQuotes, getSingleFeedQuote }