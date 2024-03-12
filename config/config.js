const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");

dotenv.config({ path: path.join(__dirname, "../.env") });
const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number().default(9000),
    BASE_URL: Joi.string().required().description("Base url"),
    MONGO_URL: Joi.string().required().description("Mongo DB url"),
    JWT_SECRET_KEY: Joi.string().required().description("jwt secret key"),
    JWT_EXPIRES: Joi.string().required().description("jwt expired")
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  port: envVars.PORT,
  baseUrl: envVars.BASE_URL,
  jwtSecretKey: envVars.JWT_SECRET_KEY,
  jwtExpiry: envVars.JWT_EXPIRES,
  mongoose: {
    url: envVars.MONGO_URL,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
};
