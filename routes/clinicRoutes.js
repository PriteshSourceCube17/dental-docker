const { clinicProfileController } = require("../controller");
const { isAunticatedClinic, isAunticatedUser } = require("../middleware/auth");
const { clinicValidation } = require("../middleware/validations");

const router = require("express").Router();

router.post("/addClinicDetails",isAunticatedUser,clinicValidation,clinicProfileController.addClinicDetails);
router.post("/addaditionalClinicDetails",isAunticatedUser,clinicProfileController.addaditionalClinicDetails);
router.post("/addClinicMangerDetails",isAunticatedUser,clinicProfileController.addClinicMangerDetails);
router.get("/getClinicProfile",isAunticatedUser,isAunticatedClinic,clinicProfileController.getClinicProfile);
router.get("/getClinicNotification",isAunticatedUser,isAunticatedClinic,clinicProfileController.getClinicNotification);

router.put("/editProfileImage",isAunticatedUser,clinicProfileController.editProfileImage);
router.put("/editClinicDetails",isAunticatedUser,isAunticatedClinic,clinicValidation,clinicProfileController.editClinicDetails);
router.put("/editaditionalClinicDetails",isAunticatedUser,isAunticatedClinic,clinicProfileController.editaditionalClinicDetails);
router.put("/editClinicMangerDetails",isAunticatedUser,isAunticatedClinic,clinicProfileController.editClinicMangerDetails);

router.get("/getPaymentDetails",isAunticatedUser,isAunticatedClinic,clinicProfileController.getPaymentDetails);


module.exports = router;