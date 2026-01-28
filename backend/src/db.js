import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error("ERROR: Missing environment variable: MONGODB_URI");
  console.error("Please check your .env file and set MONGODB_URI");
  process.exit(1);
}

// MongoDB connection
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ MongoDB connected successfully");
  } catch (err) {
    console.error("✗ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

// Disconnect from MongoDB
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("✓ MongoDB disconnected successfully");
  } catch (err) {
    console.error("✗ MongoDB disconnection failed:", err.message);
  }
};

export default mongoose;
