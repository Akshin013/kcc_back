import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: String,
  password: String // хэшированный
});

export default mongoose.model("Admin", adminSchema);
