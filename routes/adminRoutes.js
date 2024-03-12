const router = require("express").Router();

const { adminLabController, adminClinicController, adminCommonController } = require("../controller");
const { isAuthenticateAdmin } = require("../middleware/auth");

router.get("/getAdminProfile", isAuthenticateAdmin, adminCommonController.getAdminProfile);
router.get("/getAllUsers", isAuthenticateAdmin, adminCommonController.getAllUsers);
router.post("/activateAccount", isAuthenticateAdmin, adminCommonController.activateAccount);
router.post("/changeStatus", isAuthenticateAdmin, adminCommonController.changeStatus);
router.put("/updateAdminProfile", isAuthenticateAdmin, adminCommonController.updateAdminProfile);
router.put("/changeAdminPassword", isAuthenticateAdmin, adminCommonController.changeAdminPassword);
router.delete("/deleteUser/:Id", isAuthenticateAdmin, adminCommonController.deleteUser);
router.post("/addServiceCategory", isAuthenticateAdmin, adminCommonController.addServiceCategory);
router.get("/getAllServiceCategory", isAuthenticateAdmin, adminCommonController.getAllServiceCategory);

// Labs
router.post("/getallLabs", isAuthenticateAdmin, adminLabController.getallLabs);
router.get("/getSingleLab/:Id", isAuthenticateAdmin, adminLabController.getSingleLab);
router.post("/getAllLabService", isAuthenticateAdmin, adminLabController.getAllLabService);
router.get("/getSingleService/:serviceId", isAuthenticateAdmin, adminLabController.getSingleService);
router.post("/changeServiceStatus", isAuthenticateAdmin, adminLabController.changeServiceStatus);

// clinic 
router.post("/getallClinics", isAuthenticateAdmin, adminClinicController.getclinicList);
router.get("/getSingleClinic/:Id", isAuthenticateAdmin, adminClinicController.getSingleClinic);
router.post("/getAllQuotes", isAuthenticateAdmin, adminClinicController.getAllQuotes);
router.get("/getSingleQuote/:Id", isAuthenticateAdmin, adminClinicController.getSingleQuote);
router.post("/getQuoteProposals", isAuthenticateAdmin, adminClinicController.getQuoteProposals);

module.exports = router;