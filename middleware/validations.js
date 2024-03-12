const { body, } = require("express-validator");

const emailPasswordValidation = [
    body("email").not().isEmpty().trim().withMessage("Email is required."),
    body("password").not().isEmpty().trim().withMessage("Password is required."),
];

const authValidation = [
    body("email").not().isEmpty().trim().withMessage("email is required."),
    body("password").not().isEmpty().trim().withMessage("Password is required"),
    body("password").not().isEmpty().trim().isLength(6).withMessage("Password is must be 6 charcter"),
    body("firstName").not().isEmpty().trim().withMessage("first name is required"),
    body("lastName").not().isEmpty().trim().withMessage("last name is required"),
    body("role").not().isEmpty().trim().withMessage("Please selcet role"),
]

const labValidation = [
    body("labName").not().isEmpty().trim().withMessage("lab name is required."),
    // body("countryCode").not().isEmpty().trim().withMessage("Country code is required."),
    body("mobileNumber").not().isEmpty().trim().withMessage("Mobile number is required.")
    // .custom(value => {
    //   if (!value.match(/^[0-9]+$/)) {
    //     throw new Error('Mobile number must contain only digits');
    //   }return true;
    // })
    // .isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits long')
    ,
    body("landLineNumber").not().isEmpty().trim().withMessage("land line number is required.")
    // .isLength({ min: 11, max: 11 }).withMessage('land line number must be 11 digits long')
    // .custom(value => {
    //     if (!value.match(/^[0-9]+$/)) {
    //       throw new Error('land line number must contain only digits');
    //     }return true;
    // })
    ,
    body("country").not().isEmpty().trim().withMessage("country is required."),
    body("city").not().isEmpty().trim().withMessage("city is required."),
    body("address").not().isEmpty().trim().withMessage("address is required."),
    body("poBox").not().isEmpty().trim().withMessage("post box is required."),
    body("dateOfEstablishment").not().isEmpty().trim().withMessage("date of establishment is required."),
];

const clinicValidation = [
    body("clinicName").not().isEmpty().trim().withMessage("clinic name is required."),
    body("mobileNumber").not().isEmpty().trim().withMessage("Mobile number is required.")
    // .custom(value => {
    //   if (!value.match(/^[0-9]+$/)) {
    //     throw new Error('Mobile number must contain only digits');
    //   }return true;
    // })
    // .isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits long')
    ,
    // body("countryCode").not().isEmpty().trim().withMessage("country code is required."),
    body("landLineNumber").not().isEmpty().trim().withMessage("land line number is required.")
    // .isLength({ min: 11, max: 11 }).withMessage('land line number must be 11 digits long')
    // .custom(value => {
    //     if (!value.match(/^[0-9]+$/)) {
    //       throw new Error('land line number must contain only digits');
    //     }return true;
    // })
    ,
    body("country").not().isEmpty().trim().withMessage("country is required."),
    body("city").not().isEmpty().trim().withMessage("city is required."),
    body("address").not().isEmpty().trim().withMessage("address is required."),
    body("poBox").not().isEmpty().trim().withMessage("post box is required."),
    body("dateOfEstablishment").not().isEmpty().trim().withMessage("date of establishment is required."),
];

const quotesValidation = [
    body("title").not().isEmpty().trim().withMessage("Title is required."),
    body("description").not().isEmpty().trim().withMessage("Description is required"),
    body("serviceIds").not().isEmpty().trim().withMessage("Please select services"),
    body("priority").not().isEmpty().trim().withMessage("Priority is required"),
    body("chooseFor").not().isEmpty().trim().withMessage("Please seclect lab or public"),
];

const proposalValidation = [
    body("quoteId").not().isEmpty().trim().withMessage("Quote id is required."),
    body("amount").not().isEmpty().trim().withMessage("Amount is required."),
    body("coverLetter").not().isEmpty().trim().withMessage("Cover letter is required."),
    body("deliverIn").not().isEmpty().trim().withMessage("Please select deliver In option"),
];


module.exports = { emailPasswordValidation, clinicValidation, authValidation, labValidation, quotesValidation, proposalValidation }
