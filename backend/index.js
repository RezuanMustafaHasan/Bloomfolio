require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

const { HoldingsModel } = require('./models/HoldingsModel');
const { PositionsModel } = require('./models/PositionsModel');
const authRoute = require("./routes/AuthRoute");
const { userVerification } = require("./middlewares/AuthMiddleware");


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/allHoldings", async (req, res) => {
  let allHoldings = await HoldingsModel.find({});
  res.json(allHoldings);
});

app.use("/", authRoute);
app.post('/',userVerification)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose.connect(uri);
  console.log('MongoDB connected');
});