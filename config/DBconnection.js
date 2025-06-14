const mongoose = require("mongoose");

const DB = process.env.DATABASE.replace("<PASSWORD>", encodeURIComponent(process.env.DATABASE_PASSWORD));

const connectDB = async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to database", error);
    process.exit(1);
  }
};

module.exports = connectDB;
