import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan"
import multer from "multer"
import bodyParser from "body-parser"
import authRoutes from "./routes/authRoutes.js"
import taskRoutes from "./routes/taskRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import notificationsRoutes from "./routes/notificationsRoutes.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Configuration des limites pour tous les parsers
const LIMIT = "50mb"

// Configuration de body-parser avec des limites augmentées
app.use(bodyParser.json({ limit: LIMIT }))
app.use(
  bodyParser.urlencoded({
    limit: LIMIT,
    extended: true,
    parameterLimit: 50000,
  }),
)

// Configuration d'Express avec des limites augmentées
app.use(express.json({ limit: LIMIT }))
app.use(
  express.urlencoded({
    limit: LIMIT,
    extended: true,
    parameterLimit: 50000,
  }),
)

// Middleware personnalisé pour augmenter la limite de payload
app.use((req, res, next) => {
  req.setMaxListeners(0)
  if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
    req.rawBody = true
  }
  next()
})

// Configuration CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://gdt-mauve.vercel.app",
  process.env.CLIENT_URL,
  process.env.DEPLOYED_CLIENT_URL,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.warn("⚠️ Tentative d'accès refusée depuis:", origin)
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600,
  }),
)

// Middleware morgan pour le logging
app.use(morgan("dev"))

// Middleware de log pour toutes les requêtes
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`)
  if (req.headers["content-length"]) {
    console.log(
      `📦 Taille de la requête: ${(Number.parseInt(req.headers["content-length"]) / 1024 / 1024).toFixed(2)} MB`,
    )
  }
  next()
})

// Route keep-alive
app.get("/keepalive", (req, res) => {
  res.status(200).send("OK")
})

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log("✅ Connected to MongoDB Atlas")
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message)
    setTimeout(connectDB, 5000)
  }
}
connectDB()

// Vérification des collections dans MongoDB
mongoose.connection.on("connected", async () => {
  try {
    const dbName = mongoose.connection.name
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log(`✅ Base de données connectée : ${dbName}`)
    console.log("📁 Collections disponibles :")
    collections.forEach((collection) => console.log(`- ${collection.name}`))
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des collections :", error.message)
  }
})

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected! Attempting to reconnect...")
  connectDB()
})

// Middleware pour vérifier la connexion MongoDB
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn("⚠️ Database connection not ready")
    return res.status(503).json({
      error: "Database connection is not ready",
      details: "The server is currently trying to establish a database connection. Please try again later.",
    })
  }
  next()
})

// Routes principales
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Task Manager API",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  })
})

// Application des routes
app.use("/api/auth", authRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/users", userRoutes)
app.use("/api/notifications", notificationsRoutes)

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `La route ${req.originalUrl} n'existe pas sur ce serveur`,
    timestamp: new Date().toISOString(),
  })
})

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error("❌ Erreur détectée :", err)

  // Gestion spécifique des erreurs Multer
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: "Upload Error",
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    })
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Error",
      message: "L'accès depuis votre origine n'est pas autorisé",
      origin: req.headers.origin,
      timestamp: new Date().toISOString(),
    })
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
      details: Object.values(err.errors).map((e) => e.message),
      timestamp: new Date().toISOString(),
    })
  }

  // Gestion des erreurs de payload trop large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Payload Too Large",
      message: "La taille des données envoyées dépasse la limite autorisée",
      limit: `${LIMIT}`,
      timestamp: new Date().toISOString(),
    })
  }

  res.status(err.status || 500).json({
    error: err.name || "Internal Server Error",
    message: err.message || "Une erreur inattendue s'est produite",
    timestamp: new Date().toISOString(),
  })
})

// Gestion des signaux d'arrêt
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log("🔒 MongoDB connection closed due to app termination")
    process.exit(0)
  })
})

// Gestion des rejets de promesses non gérés
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason)
})

// Gestion des exceptions non attrapées
process.on("uncaughtException", (error) => {
  console.error("🚨 Uncaught Exception:", error)
  mongoose.connection.close(() => {
    console.log("🔒 MongoDB connection closed due to error")
    process.exit(1)
  })
})

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`)
  console.log("👉 Allowed Origins:", allowedOrigins)
})

