const mongoose = require("mongoose");
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => {
    console.log("Connection successful");
  })
  .catch((e) => {
    console.error("Connection failed:", e);
  });
