import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), "../config/.env") })

export default {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
}

