const { labProfileController, labServiceController, labQuotesController } = require("../controller");
const { isAunticatedUser, isAunticatedLab } = require("../middleware/auth");
const { labValidation, proposalValidation } = require("../middleware/validations");

const router = require("express").Router();

router.post("/addLabDetails", isAunticatedUser, isAunticatedLab, labValidation, labProfileController.addLabDetails);
router.post("/labadditionalDetails", isAunticatedUser, isAunticatedLab, labProfileController.labadditionalDetails);
router.post("/addLabMangersDetails", isAunticatedUser, isAunticatedLab, labProfileController.addLabMangersDetails);
router.post("/addLabWorkHours", isAunticatedUser, isAunticatedLab, labProfileController.addLabWorkHours);
router.post("/addAboutLab", isAunticatedUser, isAunticatedLab, labProfileController.addAboutLab);
router.post("/labPaymentMethods", isAunticatedUser, isAunticatedLab, labProfileController.labPaymentMethods);

router.get("/getlabProfile", isAunticatedUser, isAunticatedLab, labProfileController.getlabProfile);
router.get("/getLabPaymentDetails", isAunticatedUser, isAunticatedLab, labProfileController.getLabPaymentDetails);
router.get("/getLabNotification", isAunticatedUser, isAunticatedLab, labProfileController.getLabNotification);

router.put("/editProfile", isAunticatedUser, labProfileController.editProfile);
router.put("/editLabDetails", isAunticatedUser, labValidation, labProfileController.editLabDetails);
router.put("/editAdditionalDetails", isAunticatedUser, labProfileController.editAdditionalDetails);
router.put("/editMangersDetails", isAunticatedUser, labProfileController.editMangersDetails);
router.put("/editPaymenthod", isAunticatedUser, labProfileController.editPaymenthod);
router.put("/editLabWorkingHour", isAunticatedUser, labProfileController.editLabWorkingHour);

router.get("/getAllLabServiceCategory", isAunticatedUser, labServiceController.getAllLabServiceCategory);
router.post("/addServices", isAunticatedUser, isAunticatedLab, labServiceController.addServices);
router.get("/getAllServices", isAunticatedUser, isAunticatedLab, labServiceController.getAllServices);
router.get("/serviceDetails/:serviceId", isAunticatedUser, isAunticatedLab, labServiceController.serviceDetails);
router.get("/getSingleService/:serviceId", isAunticatedUser, isAunticatedLab, labServiceController.getSingleService);
router.put("/editService", isAunticatedUser, isAunticatedLab, labServiceController.editService);
router.delete("/deleteService/:serviceId", isAunticatedUser, isAunticatedLab, labServiceController.deleteService);

router.post("/getAllLabQuotes", isAunticatedUser, isAunticatedLab, labQuotesController.getAllLabQuotes);
router.post("/getFeeds", isAunticatedUser, isAunticatedLab, labQuotesController.getFeeds);
router.get("/getSingleFeedQuote/:quoteId", isAunticatedUser, isAunticatedLab, labQuotesController.getSingleFeedQuote);
router.post("/addProposal", isAunticatedUser, isAunticatedLab, proposalValidation, labQuotesController.addProposal);
router.post("/acceptAdvancePayment", isAunticatedUser, isAunticatedLab, labQuotesController.acceptAdvancePayment);
router.post("/quoteStartedAgain", isAunticatedUser, isAunticatedLab, labQuotesController.quoteStartedAgain);
router.post("/outForDelivery", isAunticatedUser, isAunticatedLab, labQuotesController.outForDelivery);

module.exports = router;