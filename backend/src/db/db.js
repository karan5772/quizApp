import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();

const db = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    await mongoose.connection.db.admin().command({ ping: 1 });

    console.log("MongoDB fully connected ✅");
  } catch (err) {
    console.error("MongoDB connection FAILED ❌");
    console.error(err);
    process.exit(1);
  }
};

export default db;
