const mongoose = require("mongoose");
const config = require("./config");

const connectDatabase = () => {
    mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
        console.log("Backend is Connected")
    }).catch((Error) => {
        console.log("Error =>", Error);
    })
};

module.exports = connectDatabase;