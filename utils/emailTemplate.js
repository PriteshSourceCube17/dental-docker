const path = require("path");
const ejs = require("ejs");
const sendEmail = require("./sendEmails");

// Send forgot password Email
const forgotPasswordMail = async({email,OTP}) => {
    
    const templatepath = path.join(__dirname,"../public/Templates/ForgotPassword.ejs");
    
    const data = await ejs.renderFile(templatepath,{OTP});
    await sendEmail({
        email,
        subject:`Forgot Password`,
        message:data,
    });
}

// Verify account
const verifyAuthOtp = async({email,otp}) => {
    
    const templatepath = path.join(__dirname,"../public/Templates/Verification.ejs");
    
    const data = await ejs.renderFile(templatepath,{otp});
    await sendEmail({
        email,
        subject:`Email Verification`,
        message:data,
    });
}

module.exports = {forgotPasswordMail,verifyAuthOtp}

