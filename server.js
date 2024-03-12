const express = require("express");
const cors = require("cors");
const app = express();
const config = require("./config/config");

const connectDatabase = require("./config/connectDatabase");

const errorMiddleware = require("./middleware/Error");

const router = require("./routes");

// dotenv.config();
const port = config.port || 5000;

app.use('/public/Images/service', express.static(__dirname + '/public/Images/Services'));
app.use('/public/Images/Profile', express.static(__dirname + '/public/Images/Profile'));
// app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.options("*", cors());
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.status(200).json({ status: 200, message: "Hello working finely.." });
})

app.use("/api/v1", router);

app.use((req, res, next) => {
    res.status(404).json({ status: 404, success: false, message: "Page not found on the server" });
})

app.use(errorMiddleware);

app.listen(port, () => {
    console.log(`Server is listing on ${port}`);
    connectDatabase()
});

process.on("unhandledRejection", (err) => {
    console.log("Error inside the unhandledrejection", err)
    console.log(`Error:${err.message}`);
    console.log(`Shutting down due to unhandled promise rejection `);

});