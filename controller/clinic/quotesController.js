const catchAsyncError = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const Clinic = require("../../models/Clinic");
const formidable = require("formidable");
const { isDateValid, validateMobileNumber } = require("../../utils/basicValidations");
const { default: mongoose } = require("mongoose");
const Services = require("../../models/Services");
const Quotes = require("../../models/Quotes");
const { generateNumericId } = require("../../utils/generateNumericId");
const Lab = require("../../models/Lab");
const Proposal = require("../../models/Proposal");
const moment = require("moment/moment");
const QuoteStatus = require("../../models/QuoteStatus");
const QuoteMasterStatus = require("../../models/QuoteMasterStatus");
const Order = require("../../models/Order");
const Comment = require("../../models/Comment");
const OrderMaster = require("../../models/OrderMaster");
const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require('uuid');
const fs = require("fs");
const { Constants } = require("../../utils/Constant");
const Notification = require("../../models/Notification");
const ServiceCategory = require("../../models/ServiceCategory");

// Get all services
const getServices = catchAsyncError(async (req, res, next) => {
    const userId = req.user;

    // const data = await Services.find({
    //     status: 1
    // }).sort({ createdAt: -1 }).select({ title: 1 });

    const data = await ServiceCategory.find({ isDeleted: 0, status: 1 }).select("title isDeleted status createdAt")
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data })
});

// Get all labs
const getLabs = catchAsyncError(async (req, res, next) => {
    const { search, serviceIds } = req.body;

    // if(!serviceIds.length){
    //     throw new ErrorHandler("Please Enter Service Id", HttpStatus.BAD_REQUEST);
    // }

    
    let searching = { screenStatus: 7, isDeleted: 0, };
    let catId = {}
    if (serviceIds?.length) {
        let ids = serviceIds.map((el) => { return new mongoose.Types.ObjectId(el) });
        catId = {
            ...catId,
            serivceCategoryId: { $in: ids }
        }
    }

    if (search) {
        if (search !== "") {
            searching = {
                ...searching,
                labName: { $regex: search, $options: 'i' },
            }
        }
    }
    const data = await Lab.aggregate([
        { $match: searching },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: "_id",
                as: 'userDetails',
            },
        },
        {
            $lookup: {
                from: 'services',
                localField: '_id',
                foreignField: "labId",
                as: 'serviceDetails',
                pipeline: [
                    { $match: catId}
                ]
            },
        },
        {
            $lookup: {
                from: 'servicecategories',
                localField: 'serviceDetails.serivceCategoryId',
                foreignField: "_id",
                as: 'servicecatDetails',
            },
        },
        { $match: { servicecatDetails: { $gt: [] } } },
        {
            $unwind: { path: "$userDetails" }
        },
        {
            $match: { "userDetails.isActiveLab": 1 },
            $match: { "userDetails.isActived": 1 }
        },
        { $sort: { createdAt: -1 } },
        { $project: { labName: 1, } }
    ]);
    let message
    if (!data.length) {
        message = "labs not found"
    }

    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data, message });
});

// Create Quote by clinic
const createQuotes = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const form = formidable({ multiples: true });
    const clinicData = await Clinic.findOne({ userId });

    if (clinicData.screenStatus !== 4) {
        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please complete your profile" });
    }
    form.parse(req, async (err, fields, files) => {
        const { title, description, serviceIds, priority, chooseFor, tillDate, labs } = fields;
        if (!title) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Title is required" });
        }

        if (!description) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Description is required" });
        }

        if (!priority) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Priority is required" });
        }

        if (priority !== "normal" && priority !== "urgent") {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select priority normal or urgent" });
        }

        if (!chooseFor) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select labList or public" });
        }

        if (chooseFor !== "labList" && chooseFor !== "public") {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select labList or public" });
        }

        if (!serviceIds) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select services" });
        }

        if (!serviceIds.length) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select services" });
        }

        let receiverList = [];

        if (chooseFor === "labList") {
            if (labs && labs.length) {
                if (labs.length) {
                    const data = await Promise.all(labs.map(async (val) => {
                        if (!mongoose.Types.ObjectId.isValid(val)) return false;

                        const labData = await Lab.findOne({ _id: val });

                        if (!labData) return false;
                        receiverList.push(labData._id);
                    }));

                    if (data.includes(false)) {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid labs" })
                    }
                }
            } else {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Plaese select Lab's" });
            }
        }

        if (chooseFor === "public") {

            const labData = await Lab.aggregate([
                { $match: { screenStatus: 7 } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: "_id",
                        as: 'userDetails',
                    },
                },
                {
                    $unwind: { path: "$userDetails" }
                },
                {
                    $match: { "userDetails.isActiveLab": 1 },
                    // $match:{"userDetails.isActived":1}
                },
                { $sort: { createdAt: -1 } },
                { $project: { _id: 1, } }
            ]);

            labData.map((val) => {
                receiverList.push(val._id);
            });
        }

        if (tillDate) {

            if (!isDateValid(tillDate)) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please Enter valid date" });
            }

            if (moment().format('YYYY-MM-DD') >= tillDate) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Date is not valid" });
            }
        }

        let Images = [];
        if (files.quoteImages) {
            if (files.quoteImages.length > 3) {
                try {
                    await Promise.all(files.quoteImages.map(async (newImg) => {
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
                                console.log("🚀 ~ file: labServiceController.js:113 ~ files.quoteImages.forEach ~ error:", error)
                                // return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                            }
                        }

                        // This for upload Images on local server
                        // const fileName = (newImg.originalFilename = uuidv4() + "." + extension);
                        // const newPath = __dirname + `/../../public/Images/Quotes/${fileName}`;
                        // fs.copyFile(newImg.filepath, newPath, async (error) => {
                        // Images.push(fileName)
                        //     if (error) {
                        //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in uploading file" })
                        //     }
                        // });
                    }));

                } catch (error) {
                    console.log("🚀 ~ file: quotesController.js:156 ~ form.parse ~ error:", error)
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Image uploading" });
                }
            } else {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "minimum four images are required for quote" });
            }
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select images related to quote" });
        }

        const uid = generateNumericId(7);
        const clinicData = await Clinic.findOne({ userId });
        const quoteTitle = await Quotes.findOne({ title });

        if (quoteTitle) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "This Quote is already created" });
        }

        const data = await Quotes.create({
            clinicId: clinicData._id, quoteNumber: `QUO${uid}`, title, description, serviceIds, priority, chooseFor, tillDate, labs, quoteImages: Images
        });

        if (data) {
            await QuoteStatus.create({ quoteId: data._id, clinicStatus: "pending" });
            await QuoteMasterStatus.create({ quoteId: data._id, clinicStatus: "pending" });
            await Notification.create({ senderId: clinicData._id, reciverId: receiverList, title: "Quote Invitation", description: `${clinicData.clinicName} sends you invitaion on this quote ${data.title}` });
        }

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Quote addded successfully.", });

    });
});

// Get all Quotes details
const getAllClinicQuotes = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { limit, offset, type } = req.body;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    const clinicData = await Clinic.findOne({ userId });
    let serching = { quoteStatus: "new" };
    if (type === "new") {
        serching = { quoteStatus: "new" };
    }
    if (type === "accepted") {
        serching = { quoteStatus: "accepted" };
    }
    if (type === "completed") {
        serching = { quoteStatus: "completed" };
    }

    let quotesdata = await Quotes.aggregate([
        { $match: { clinicId: clinicData._id } },
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
                as: 'quoteStatus',
                pipeline: [
                    { $project: { clinicStatus: 1 } }
                ]
            },
        },
        {
            $lookup: {
                from: 'proposals',
                localField: '_id',
                foreignField: "quoteId",
                as: 'proposalsDetails',
            },
        },
        {
            $lookup: {
                from: 'labs',
                localField: 'isAceptedLab',
                foreignField: "_id",
                as: 'labsDetails',
                pipeline: [
                    { $project: { labName: 1 } }
                ]
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
                ]
            },
        },
        { $addFields: { propsals: { $size: "$proposalsDetails" } } },
        { $sort: { createdAt: -1 } },
        { $project: { updatedAt: 0, __v: 0, status: 0, proposalsDetails: 0 } },
    ]);

    let message;
    if (!quotesdata.length) {
        message = "There is no quotes"
    }

    const count = quotesdata.length;
    quotesdata = quotesdata.slice(offsetData, limitData + offsetData);
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { count, quotesdata }, message });
});

// Get propsals from lab
const getProposals = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { limit, offset, quoteId } = req.body;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote Id", HttpStatus.BAD_REQUEST);
    }

    const quoteData = await Quotes.findOne({ _id: quoteId });
    if (!quoteData) {
        throw new ErrorHandler("Quotes data not found", HttpStatus.BAD_REQUEST);
    }

    const clinicData = await Clinic.findOne({ userId });

    if (clinicData) {
        const quotesData = await Quotes.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(quoteId) } },
            { $match: { clinicId: new mongoose.Types.ObjectId(clinicData._id) } },
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
                    as: 'quoteStatus',
                    pipeline: [
                        { $project: { clinicStatus: 1 } }
                    ]
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
                    ]
                },
            },
            {
                $project: {
                    quoteNumber: 1, title: 1, description: 1, priority: 1, chooseFor: 1, tillDate: 1, serviceDetails: 1, quoteStatus: 1,
                    chooseForLab: 1
                }
            }
        ]);
        let message;
        let propsaldata = await Proposal.aggregate([
            { $match: { clinicId: new mongoose.Types.ObjectId(clinicData._id) } },
            { $match: { quoteId: new mongoose.Types.ObjectId(quoteId) } },
            {
                $lookup: {
                    from: 'labs',
                    localField: 'labId',
                    foreignField: "_id",
                    pipeline: [
                        { $project: { labName: 1, landLineNumber: 1, countryCode: 1, mobileNumber: 1, city: 1, state: 1, country: 1, address: 1, createdAt: 1, description: 1 } }
                    ],
                    as: 'labDetails',
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    __v: 0, updatedAt: 0, clinicId: 0,
                }
            }
        ]);

        if (!propsaldata.length) {
            message = "There is no proposals"
        }
        const count = propsaldata.length;
        propsaldata = propsaldata.slice(offsetData, limitData + offsetData);
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, data: { quotesData, count, message, propsaldata } });
    } else {
        throw new ErrorHandler("Clinic data not founded", HttpStatus.BAD_REQUEST);
    }
});

// Accept proposals
const acceptProposals = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { quoteId, proposalId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quoation Id", HttpStatus.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(proposalId)) {
        throw new ErrorHandler("Please enter valid propsal Id", HttpStatus.BAD_REQUEST);
    }

    const quoationData = await Quotes.findOne({ _id: quoteId });
    const clinicData = await Clinic.findOne({ userId });

    if (quoationData) {
        const completedQuote = await QuoteMasterStatus.findOne({ quoteId, proposalId, labStatus: "jobSuccessfullyDone", clinicStatus: "jobSuccessfullyDone" });

        if (completedQuote) {
            throw new ErrorHandler("This Quote allready completed", HttpStatus.BAD_REQUEST);
        } else {
            const propsaldata = await Proposal.findOne({ _id: proposalId, quoteId });
            if (propsaldata) {
                const isAlreadyProposal = await QuoteMasterStatus.find({ quoteId, clinicStatus: "advancePending" });
                if (isAlreadyProposal.length) {
                    throw new ErrorHandler("Prposal already accepted", HttpStatus.BAD_REQUEST);
                } else {
                    const advanceValue = propsaldata.amount * 30 / 100;
                    const remainValue = propsaldata.amount - advanceValue;
                    const payment = Order.create({ quoteId, clinicId: clinicData._id, labId: propsaldata.labId, advanceAmount: advanceValue, remainingAmount: remainValue, totalAmount: propsaldata.amount });

                    if (payment) {
                        const statusMaster = await QuoteMasterStatus.findOneAndUpdate({ quoteId }, { labStatus: "waitForPayment", clinicStatus: "advancePending" });
                        // statusMaster.labStatus = "waitForPayment";
                        // statusMaster.clinicStatus = "advancePending";
                        // await statusMaster.save();
                        await QuoteStatus.create({ quoteId, labId: propsaldata.labId, labStatus: "waitForPayment", clinicStatus: "advancePending" });
                    }

                    quoationData.quoteStatus = "accepted";
                    quoationData.isAceptedLab = propsaldata.labId;
                    await quoationData.save();

                    propsaldata.status = 1;
                    await propsaldata.save();

                    await Notification.create({ senderId: clinicData._id, reciverId: propsaldata.labId, title: `Your proposal aceepted`, description: `Your proposal related to this ${quoationData.title} quote has been accepted` })

                    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Quote accepted" });
                }
            } else {
                throw new ErrorHandler("Proposal data not found", HttpStatus.BAD_REQUEST);
            }
        }
    } else {
        throw new ErrorHandler("Quote data not found", HttpStatus.BAD_REQUEST);
    }
});

// This API use for both side clinic and lab
const getAcceptedQuote = catchAsyncError(async (req, res, next) => {
    const { proposalId, quoteId } = req.body;


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
                    { $project: { clinicName: 1, landLineNumber: 1, countryCode: 1, mobileNumber: 1, state: 1, city: 1, country: 1, address: 1, } }
                ],
                as: 'clinicDetails',
            },
        },
        {
            $lookup: {
                from: 'labs',
                localField: 'isAceptedLab',
                foreignField: "_id",
                pipeline: [
                    { $project: { labName: 1, landLineNumber: 1, countryCode: 1, mobileNumber: 1, state: 1, city: 1, country: 1, address: 1, deliveryMethod: 1, paymentMethod: 1 } }
                ],
                as: 'labDetails',
            },
        },
        {
            $lookup: {
                from: 'proposals',
                localField: '_id',
                foreignField: "quoteId",
                pipeline: [
                    { $match: { quoteId: new mongoose.Types.ObjectId(quoteId), status: 1 } },
                    { $project: { amount: 1, quoteId: 1, labId: 1 } }
                ],
                as: 'propsalDetails',
            },
        },
        {
            $lookup: {
                from: 'quotemasterstatuses',
                localField: '_id',
                foreignField: "quoteId",
                pipeline: [
                    { $project: { labStatus: 1, clinicStatus: 1 } }
                ],
                as: 'quoteStatus',
            },
        },
        {
            $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: "quoteId",
                pipeline: [
                    { $project: { advanceAmount: 1, remainingAmount: 1, totalAmount: 1 } }
                ],
                as: 'orderDetails',
            },
        },
        {
            $project: {
                quoteNumber: 1, title: 1, description: 1, priority: 1, propsalDetails: 1, clinicDetails: 1, labDetails: 1, quoteStatus: 1, orderDetails: 1
            }
        }
    ])
    let message;
    if (!quoteData.length) {
        message = "There is no quote"
    }

    const modificationQuote = await QuoteStatus.find({
        quoteId, clinicStatus: "needModification", labStatus: "needModification"
    })
    return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, quoteReject: modificationQuote.length, message, quoteData })
});

// make advance paymnet after accept propsal
const makeAdvancePayment = catchAsyncError(async (req, res, next) => {

    const userId = req.user;
    const { proposalId, quoteId, paymentMethod, advanceAmount, reference } = req.body;
    // if (!mongoose.Types.ObjectId.isValid(proposalId)) {
    //     throw new ErrorHandler("Please enter valid propsal Id", HttpStatus.BAD_REQUEST);
    // }

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote Id", HttpStatus.BAD_REQUEST);
    }

    if (paymentMethod !== "onlinePayment" && paymentMethod !== "cash" && paymentMethod !== "cheque") {
        throw new ErrorHandler("Plaese enter valid payment method", HttpStatus.BAD_REQUEST);
    }

    if (!advanceAmount || isNaN(advanceAmount)) {
        throw new ErrorHandler("Plaese enter valid amount", HttpStatus.BAD_REQUEST);
    }

    const quoteData = await Quotes.findOne({ _id: quoteId });

    if (!quoteData) {
        throw new ErrorHandler("Quote data not found", HttpStatus.BAD_REQUEST);
    }
    const propsaldata = await Proposal.findOne({ quoteId, status: 1 });
    const clinicData = await Clinic.findOne({ userId });

    // clinicStatus will be advancePending && labStatus will be waitForPayment
    if (propsaldata) {

        const advanceValue = propsaldata.amount * 30 / 100;

        if (advanceValue != advanceAmount) {
            throw new ErrorHandler("Advance value is not valid", HttpStatus.BAD_REQUEST);
        }

        const orderData = await Order.findOne({ quoteId });
        if (orderData) {
            const advanceOrder = await Order.findOne({ orderId: orderData._id, quoteId, status: "advanceCompleted" });
            if (advanceOrder) {
                throw new ErrorHandler("advance payment is already done", HttpStatus.BAD_REQUEST);
            } else {
                await QuoteStatus.create({ quoteId, labId: quoteData.isAceptedLab, clinicStatus: "inProgress", labStatus: "workStarted" });

                const masterOrder = await OrderMaster.create({
                    orderId: orderData._id, quoteId, clinicId: clinicData._id, labId: quoteData.isAceptedLab, totalAmount: advanceAmount, paymentMethod, type: "advance", status: 1, reference
                });

                if (masterOrder) {
                    orderData.advancePaymentDate = moment();
                    orderData.advancepaymentMethod = paymentMethod;
                    orderData.advancePaymentStatus = 1;
                    orderData.status = "advanceCompleted";
                    orderData.reference = reference;
                    await orderData.save();
                }

                const statusMaster = await QuoteMasterStatus.findOne({ quoteId });
                if (statusMaster) {
                    statusMaster.clinicStatus = "inProgress";
                    statusMaster.labStatus = "workStarted";
                    await statusMaster.save();
                }

                await Notification.create({ senderId: clinicData._id, reciverId: propsaldata.labId, title: `You recieved advance payment`, description: `${clinicData.clinicName} sends you advance payment` })
            }
        } else {
            throw new ErrorHandler("Something is wrong in advance payment", HttpStatus.BAD_REQUEST);
        }

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Paymnet done successfully" });
    } else {
        throw new ErrorHandler("This type of quote not found", HttpStatus.BAD_REQUEST);
    }

});

// delivery accepted from the clinic side
const deliveryAccepted = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { proposalId, quoteId } = req.body;
    // if (!mongoose.Types.ObjectId.isValid(proposalId)) {
    //     throw new ErrorHandler("Please enter valid propsal Id", HttpStatus.BAD_REQUEST);
    // }

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote Id", HttpStatus.BAD_REQUEST);
    }

    const quoteData = await Quotes.findOne({ _id: quoteId });
    const clinicData = await Clinic.findOne({ userId });
    if (!quoteData) {
        throw new ErrorHandler("Quote data not found", HttpStatus.BAD_REQUEST);
    }

    const propsaldata = await Proposal.findOne({ quoteId, status: 1 });

    if (propsaldata) {
        const statusMaster = await QuoteMasterStatus.findOne({ quoteId });

        if (statusMaster.clinicStatus === "deliveryAccepted" && statusMaster.labStatus === "deliverySuccess") {
            throw new ErrorHandler("delivery alreday accepted", HttpStatus.BAD_REQUEST);
        }

        await QuoteStatus.create({ quoteId, labId: quoteData.isAceptedLab, labStatus: "deliverySuccess", clinicStatus: "deliveryAccepted" });

        if (statusMaster) {
            statusMaster.clinicStatus = "deliveryAccepted";
            statusMaster.labStatus = "deliverySuccess";
            await statusMaster.save();
        }

        await Notification.create({ senderId: clinicData._id, reciverId: quoteData.isAceptedLab, title: `Delivery Accepted`, description: `Delivery accepted related to ${quoteData.title} this quote` })

        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Delivery accepted" });
    } else {
        throw new ErrorHandler("This type of quote not found", HttpStatus.BAD_REQUEST);
    }
});

// add payment after delivery success
const makeAFullPayment = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { proposalId, quoteId, paymentMethod, amount, reference } = req.body;

    // if (!mongoose.Types.ObjectId.isValid(proposalId)) {
    //     throw new ErrorHandler("Please enter valid propsal Id", HttpStatus.BAD_REQUEST);
    // }

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote Id", HttpStatus.BAD_REQUEST);
    }

    const quoteData = await Quotes.findOne({ _id: quoteId });

    if (!quoteData) {
        throw new ErrorHandler("Quote data not found", HttpStatus.BAD_REQUEST);
    }

    if (paymentMethod !== "onlinePayment" && paymentMethod !== "cash" && !paymentMethod !== "cheque") {
        throw new ErrorHandler("Plaese enter valid payment method", HttpStatus.BAD_REQUEST);
    }

    if (!amount) {
        throw new ErrorHandler("Please enter valid amount", HttpStatus.BAD_REQUEST);
    }
    if (isNaN(amount)) {
        throw new ErrorHandler("Please enter valid amount", HttpStatus.BAD_REQUEST);
    }

    const propsaldata = await Proposal.findOne({ quoteId, status: 1 });
    const clinicData = await Clinic.findOne({ userId });
    const orderData = await Order.findOne({ quoteId });

    if (propsaldata) {
        if (orderData) {
            if (orderData.remainingAmount != amount) {
                throw new ErrorHandler("Please enter valid remainig amount", HttpStatus.BAD_REQUEST);
            }

            const statusMaster = await QuoteMasterStatus.findOne({ quoteId });

            if (statusMaster.clinicStatus !== "jobSuccessfullyDone" && statusMaster.labStatus !== "jobSuccessfullyDone") {
                const orderMasterData = await OrderMaster.create({ orderId: orderData._id, quoteId, clinicId: clinicData._id, labId: quoteData.isAceptedLab, totalAmount: amount, paymentMethod, type: "complete", status: 1, reference });

                if (orderMasterData) {
                    orderData.remainingpaymentMethod = paymentMethod;
                    orderData.remainingPaymentStatus = 1;
                    orderData.remainingPaymentDate = moment();
                    orderData.status = "completed";
                    orderData.reference = reference;
                    await orderData.save();
                }
                await QuoteStatus.create({ quoteId, labId: quoteData.isAceptedLab, clinicStatus: "jobSuccessfullyDone", labStatus: "jobSuccessfullyDone" });
                await Notification.create({ senderId: clinicData._id, reciverId: quoteData.isAceptedLab, title: `You recieved Full payment`, description: `${clinicData.clinicName} sends you remaining payment` });
                // const statusMaster = await QuoteMasterStatus.findOne({ quoteId });

                if (statusMaster) {
                    statusMaster.clinicStatus = "jobSuccessfullyDone";
                    statusMaster.labStatus = "jobSuccessfullyDone";
                    await statusMaster.save();

                    quoteData.quoteStatus = "completed";
                    await quoteData.save();
                }

                await Notification.create({ senderId: clinicData._id, reciverId: quoteData.isAceptedLab, title: `Job done successfully`, description: `Your job related to ${quoteData.title} quote has been done successfully` })

                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Paymnet done successfully" });
            } else {
                throw new ErrorHandler("You already pay for this quote", HttpStatus.BAD_REQUEST);
            }
        }
    } else {
        throw new ErrorHandler("This type of quote not found", HttpStatus.BAD_REQUEST);
    }

});

//delivery rejected by clinic
const deliveryRejected = catchAsyncError(async (req, res, next) => {
    const { proposalId, quoteId } = req.body;
    const userId = req.user;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote Id", HttpStatus.BAD_REQUEST);
    }

    const quoteData = await Quotes.findOne({ _id: quoteId });
    const clinicData = await Clinic.findOne({ userId });
    if (quoteData) {
        const propsaldata = await Proposal.findOne({ quoteId, status: 1 });
        if (propsaldata) {

            const quoteStatusValue = await QuoteStatus.find({
                quoteId, clinicStatus: "needModification", labStatus: "needModification"
            });

            const statusMaster = await QuoteMasterStatus.findOne({ quoteId });
            console.log("🚀 ~ file: quotesController.js:810 ~ deliveryRejected ~ quoteStatusValue:", quoteStatusValue)

            if (statusMaster.clinicStatus === "needModification" && statusMaster.labStatus === "needModification") {
                throw new ErrorHandler("Quote is already go for modification", HttpStatus.BAD_REQUEST);
            } else {
                // if (quoteStatusValue.length) {
                //     const checkReject = await QuoteMasterStatus.find({
                //         quoteId, clinicStatus: "deliveryRejected", labStatus: "deliveryRejected"
                //     });

                //     if (checkReject.length) {
                //         throw new ErrorHandler("Delivery already rejected", HttpStatus.BAD_REQUEST);
                //     } else {
                //         await QuoteStatus.create({ quoteId, labId: quoteData.isAceptedLab, clinicStatus: "deliveryRejected", labStatus: "deliveryRejected" });
                //         if (statusMaster) {
                //             statusMaster.clinicStatus = "deliveryRejected";
                //             statusMaster.labStatus = "deliveryRejected";
                //             await statusMaster.save();
                //             await Notification.create({ senderId: clinicData._id, reciverId: quoteData.isAceptedLab, title: `Delivery for modification`, description: `Your delivery related to ${quoteData.title} quote has been sended for modification` });
                //         }
                //         return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, rejected: quoteStatusValue.length, message: "Delivery rejected" });
                //     }
                // } else {

                await QuoteStatus.create({ quoteId, labId: quoteData.isAceptedLab, clinicStatus: "needModification", labStatus: "needModification" });

                if (statusMaster) {
                    statusMaster.clinicStatus = "needModification";
                    statusMaster.labStatus = "needModification";
                    await statusMaster.save();
                    await Notification.create({ senderId: clinicData._id, reciverId: quoteData.isAceptedLab, title: `Delivery for modification`, description: `Your delivery related to ${quoteData.title} quote has been sended for modification` });
                }
                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, rejected: quoteStatusValue.length, message: "Add delivery for modification" });
                // }
            }
        } else {
            throw new ErrorHandler("This type of quote not found", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("Quote data not found", HttpStatus.BAD_REQUEST);
    }
});

// get propsal lab 
const getProposalLab = catchAsyncError(async (req, res, next) => {
    const { labId } = req.body;
    const baseServicePath = Constants.serviceImgBase;

    if (!mongoose.Types.ObjectId.isValid(labId)) {
        throw new ErrorHandler("Please enter valid lab Id", HttpStatus.BAD_REQUEST);
    }

    const labData = await Lab.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(labId) } },
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
                from: 'services',
                localField: '_id',
                foreignField: "labId",
                pipeline: [
                    { $project: { title: 1, serviceImags: 1, labId: 1 } }
                ],
                as: 'serviceDetails',
            },
        },
        {
            $lookup: {
                from: 'labworkhours',
                localField: '_id',
                foreignField: "labId",
                pipeline: [
                    { $project: { labId: 1, dayDetails: 1 } }
                ],
                as: 'workingHours',
            },
        },
        {
            $project: {
                screenStatus: 1, labName: 1, landLineNumber: 1, countryCode: 1, mobileNumber: 1, description: 1, deliveryMethod: 1, paymentMethod: 1,
                userDetails: 1, workingHours: 1, serviceDetails: 1
            }
        }
    ])

    if (labData) {
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, labData });
    } else {
        throw new ErrorHandler("lab data not found", HttpStatus.BAD_REQUEST);
    }
});

// add Comment on quote delivery rejected
const addClinicComment = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { quoteId, title, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote Id", HttpStatus.BAD_REQUEST);
    }

    if (!title) {
        throw new ErrorHandler("Please enter title related to delivery", HttpStatus.BAD_REQUEST);
    }

    if (!comment) {
        throw new ErrorHandler("Please enter comments related to delivery", HttpStatus.BAD_REQUEST);
    }

    const quoteData = await Quotes.findOne({ _id: quoteId });
    if (quoteData) {
        const clinicData = await Clinic.findOne({ userId });
        const labData = await Lab.findOne({ userId });

        if (clinicData) {

            const labId = quoteData.isAceptedLab;
            // const propsaldata = await Proposal.findOne({ _id: proposalId });
            // if (propsaldata) {
            // const statusMaster = await QuoteMasterStatus.findOne({ proposalId, quoteId });
            const statusMaster = await QuoteMasterStatus.findOne({ quoteId });
            if (statusMaster.labStatus === "deliveryRejected") {
                await Comment.create({ quoteId, title, clinicId: clinicData._id, labId, comment, isMessage: "clinic" });

                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Comment sended successfully" });
            }
            // }
        } else if (labData) {

            const clinicId = quoteData.clinicId;
            // const propsaldata = await Proposal.findOne({ _id: proposalId });
            // if (propsaldata) {
            // const statusMaster = await QuoteMasterStatus.findOne({ proposalId, quoteId });
            const statusMaster = await QuoteMasterStatus.findOne({ quoteId });
            if (statusMaster.labStatus === "deliveryRejected") {
                await Comment.create({ quoteId, title, clinicId, labId: labData._id, comment, isMessage: "lab" });

                return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Comment sended successfully" });
            }
            // }
        } else {
            throw new ErrorHandler("user not found", HttpStatus.BAD_REQUEST);
        }
    } else {
        throw new ErrorHandler("quote data not found", HttpStatus.BAD_REQUEST);
    }
});

// get Comments related delivery rejected quotes
const getComments = catchAsyncError(async (req, res, next) => {
    const userId = req.user;
    const { quoteId, limit, offset } = req.body;

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote Id", HttpStatus.BAD_REQUEST);
    }

    const clinicData = await Clinic.findOne({ userId });
    const labData = await Lab.findOne({ userId });
    const quoteData = await Quotes.findOne({ _id: quoteId });
    if (quoteData) {

        let commentData = await Comment.aggregate([
            { $match: { quoteId: new mongoose.Types.ObjectId(quoteId) } },
            {
                $match: {
                    $or:
                        [
                            { clinicId: new mongoose.Types.ObjectId(clinicData?._id) },
                            { labId: new mongoose.Types.ObjectId(labData?._id) },
                        ],
                }
            },
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
                $project: {
                    updatedAt: 0, __v: 0, status: 0,
                    quoteId: 0, clinicId: 0, labId: 0
                }
            }
        ]);

        let message
        if (!commentData.length) {
            message = "There is no comment"
        }

        const count = commentData.length;
        commentData = commentData.slice(offsetData, limitData + offsetData);
        return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message, count, commentData });

    } else {
        throw new ErrorHandler("Quote data not founded", HttpStatus.BAD_REQUEST);
    }
});

// get Single Quote Details
const getSingleQuote = catchAsyncError(async (req, res, next) => {
    const { quoteId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        throw new ErrorHandler("Please enter valid quote Id", HttpStatus.BAD_REQUEST);
    }

    const quoteData = await Quotes.findOne({ _id: quoteId });

    if (quoteData) {
        if (quoteData.quoteStatus === "accepted") {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "You can not change quote details when it is accepted" });
        } else {
            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, quoteData });
        }
    } else {
        throw new ErrorHandler("Quote data not found", HttpStatus.BAD_REQUEST);
    }
});

// Edit Quote Details
const editQuoteDetails = catchAsyncError(async (req, res, next) => {
    const userId = req.user;

    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        const { quoteId, title, description, serviceIds, priority, chooseFor, tillDate, oldQuoteImages, labs } = fields;

        if (!mongoose.Types.ObjectId.isValid(quoteId)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Plaese Enter valid quote Id" });
        }
        const clinicData = await Clinic.findOne({ userId });
        const quoteData = await Quotes.findOne({ _id: quoteId, clinicId: clinicData._id });

        if (quoteData) {

            const proposalData = await Proposal.find({ quoteId: quoteData._id });
            if (proposalData.length) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "You can not change quote details" });
            }
            if (quoteData.quoteStatus === "accepted") {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "You can not change quote details when it is accepted" });
            }

            if (!title) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Title is required" });
            }

            if (!description) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Description is required" });
            }

            if (!priority) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Priority is required" });
            }

            if (priority !== "normal" && priority !== "urgent") {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select priority normal or urgent" });
            }

            if (!chooseFor) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select labList or public" });
            }

            if (chooseFor !== "labList" && chooseFor !== "public") {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select labList or public" });
            }

            if (!serviceIds) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select services" });
            }

            if (!serviceIds.length) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please select services" });
            }

            if (chooseFor === "labList") {
                if (labs && labs.length) {
                    if (labs.length) {
                        const data = await Promise.all(labs.map(async (val) => {
                            if (!mongoose.Types.ObjectId.isValid(val)) return false;

                            const labData = await Lab.findOne({ _id: val });

                            if (!labData) return false;
                        }));

                        if (data.includes(false)) {
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter valid labs" })
                        }
                    }
                } else {
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Plaese select Lab's" });
                }
            }

            if (tillDate) {

                if (!isDateValid(tillDate)) {
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please Enter valid date" });
                }

                if (moment().format('YYYY-MM-DD') >= tillDate) {
                    return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Date is not valid" });
                }
            }


            if (files.quoteImages) {
                // if (!!files.quoteImages && !files.quoteImages.length) {
                //     console.log("object");
                //     if (oldQuoteImages) {
                //         try {
                //             const imgName = files.quoteImages.originalFilename.split(".");
                //             const extension = imgName[1];
                //             if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                //                 return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: `${extension} is not allowed..` });
                //             }

                //             // This for upload Images on third party cloudinary
                //             await cloudinary.config({
                //                 cloud_name: process.env.CLOUDINARY_NAME,
                //                 api_key: process.env.CLOUDINARYAPI_KEY,
                //                 api_secret: process.env.CLOUDINARYAPI_SECRET
                //             });
                //             const result = await cloudinary.uploader.upload(files.quoteImages.filepath, { folder: 'dental' });
                //             if (result.url) {
                //                 const fileName = result.url;
                //                 try {
                //                     quoteData.quoteImages.push(fileName);
                //                     quoteData.quoteImages.pull(oldQuoteImages);
                //                     await quoteData.save();
                //                 } catch (error) {
                //                     console.log("🚀 ~ file: labServiceController.js:310 ~ form.parse ~ error:", error)
                //                     return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                //                 }
                //             }

                //             // This for upload Images on local server
                //             // const fileName = (files.quoteImages.originalFilename = uuidv4() + "." + extension);
                //             // const newPath = __dirname + `/../../public/Images/Quotes/${fileName}`;
                //             // fs.copyFile(files.quoteImages.filepath, newPath, async (error) => {
                //             //     if (error) {
                //             //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in uploading file" })
                //             //     }
                //             // })
                //             // quoteData.quoteImages.push(fileName);

                //             // const filedata = __dirname + `/../../public/Images/Quotes/${oldQuoteImages}`;
                //             // quoteData.quoteImages.pull(oldQuoteImages);
                //             // fs.unlink(filedata, (err) => {
                //             //     if (err) {
                //             //     }
                //             // });
                //             await quoteData.save();

                //         } catch (error) {
                //             return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, error });
                //         }
                //     } else {
                //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter old quote images" });
                //     }
                // }

                files.quoteImages = Array.isArray(files.quoteImages) ? files.quoteImages : [files.quoteImages];
                if (files.quoteImages.length) {
                    if (oldQuoteImages.length) {
                        // if (files.quoteImages.length > 3) {
                        try {
                            await Promise.all(files.quoteImages.map(async (newImg) => {
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
                                        quoteData.quoteImages.push(fileName);
                                    } catch (error) {
                                        console.log("🚀 ~ file: labServiceController.js:113 ~ files.quoteImages.forEach ~ error:", error)
                                        return res.status(500).json({ status: 500, success: false, message: "Something is wrong in Profile Image Uploading" });
                                    }
                                }

                                // This for upload Images on local server
                                // const fileName = (newImg.originalFilename = uuidv4() + "." + extension);
                                // const newPath = __dirname + `/../../public/Images/Quotes/${fileName}`;
                                // fs.copyFile(newImg.filepath, newPath, async (error) => {

                                //     quoteData.quoteImages.push(fileName);
                                //     console.log("after image upload quoteImages:", quoteData.quoteImages)
                                //     if (error) {
                                //         return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in uploading file" })
                                //     }
                                // });
                            }));

                            // This unlink Images on cloudinary
                            oldQuoteImages.map((val) => {
                                quoteData.quoteImages.pull(val);
                            });

                            // This for unlink Images in local server
                            // oldQuoteImages.map((val) => {
                            //     const filedata = __dirname + `/../../public/Images/Quotes/${val}`;
                            //     quoteData.quoteImages.pull(val);
                            //     fs.unlink(filedata, (err) => {
                            //         if (err) {
                            //         }
                            //     });
                            // });

                            await quoteData.save();
                        } catch (error) {
                            console.log("🚀 ~ file: quotesController.js:156 ~ form.parse ~ error:", error)
                            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Something is wrong in Image uploading" });
                        }
                        // } else {
                        //     return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "minimum four images are required for quote" });
                        // }
                    } else {
                        return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Please enter old quote images" });
                    }
                }
            }

            if (chooseFor === "public") {
                quoteData.labs = []
            }

            quoteData.title = title;
            quoteData.description = description;
            quoteData.serviceIds = serviceIds;
            quoteData.priority = priority;
            quoteData.chooseFor = chooseFor;
            quoteData.tillDate = tillDate;
            quoteData.labs = labs;

            await quoteData.save();
            return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, success: true, message: "Quote Updated sucessfully" });
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: "Quote details not found" });
        }
    });
});

module.exports = { getServices, getLabs, createQuotes, getAllClinicQuotes, getProposals, acceptProposals, makeAdvancePayment, deliveryAccepted, editQuoteDetails, getSingleQuote, makeAFullPayment, getAcceptedQuote, deliveryRejected, addClinicComment, getComments, getProposalLab }
