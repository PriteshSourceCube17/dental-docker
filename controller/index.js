module.exports.authController = require("../controller/auth/authController");
module.exports.clinicProfileController = require("./clinic/clinicProfileController");

module.exports.labProfileController = require("./lab/labProfileController");
module.exports.labServiceController = require("./lab/labServiceController");
module.exports.labQuotesController = require("./lab/labQuotesController");

module.exports.clinicQuotes = require("./clinic/quotesController");

module.exports.adminLabController = require("../controller/admin/labController");
module.exports.adminClinicController = require("../controller/admin/clinicController");
module.exports.adminCommonController = require("../controller/admin/commonController");
