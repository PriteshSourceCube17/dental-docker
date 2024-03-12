const { clinicQuotes } = require("../controller");
const { isAunticatedUser, isAunticatedLab, isAunticatedClinic } = require("../middleware/auth");
const { quotesValidation } = require("../middleware/validations");

const router = require("express").Router();

router.post("/getServices", isAunticatedUser, clinicQuotes.getServices);
router.post("/getLabs", isAunticatedUser, isAunticatedClinic, clinicQuotes.getLabs);
router.post("/createQuotes", isAunticatedUser, isAunticatedClinic, clinicQuotes.createQuotes);
router.post("/getSingleQuote", isAunticatedUser, isAunticatedClinic, clinicQuotes.getSingleQuote);
router.put("/updateQuote", isAunticatedUser, isAunticatedClinic, clinicQuotes.editQuoteDetails);
router.post("/getAllClinicQuotes", isAunticatedUser, isAunticatedClinic, clinicQuotes.getAllClinicQuotes);

router.post("/getProposals", isAunticatedUser, isAunticatedClinic, clinicQuotes.getProposals);
router.post("/acceptProposals", isAunticatedUser, isAunticatedClinic, clinicQuotes.acceptProposals);
router.post("/getProposalLab", isAunticatedUser, isAunticatedClinic, clinicQuotes.getProposalLab);
router.post("/getAcceptedQuote", isAunticatedUser, clinicQuotes.getAcceptedQuote);
router.post("/makeAdvancePayment", isAunticatedUser, isAunticatedClinic, clinicQuotes.makeAdvancePayment);
router.post("/deliveryAccepted", isAunticatedUser, isAunticatedClinic, clinicQuotes.deliveryAccepted);
router.post("/makeAFullPayment", isAunticatedUser, isAunticatedClinic, clinicQuotes.makeAFullPayment);
router.post("/deliveryRejected", isAunticatedUser, isAunticatedClinic, clinicQuotes.deliveryRejected);

router.post("/addClinicComment", isAunticatedUser, clinicQuotes.addClinicComment);
router.post("/getComments", isAunticatedUser, clinicQuotes.getComments);

module.exports = router;