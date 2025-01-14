const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  manufacturer_name: {
    type: String,
  },
  username: {
    type: String,
  },
  manufacturer_CEO: {
    type: String,
  },
  manufacturer_phone_no: {
    type: Number,
  },
  address: {
    type: String,
  },
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);
