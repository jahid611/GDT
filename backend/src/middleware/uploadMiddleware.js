import multer from "multer"
import path from "path"

// Configuration du stockage
const storage = multer.memoryStorage()

// Configuration de Multer avec des limites plus élevées
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    fieldSize: 50 * 1024 * 1024, // 50 MB (important pour body-parser)
    files: 5, // Maximum 5 fichiers
  },
  fileFilter: (req, file, cb) => {
    // Obtenir l'extension du fichier
    const fileTypes = /jpeg|jpg|png|gif|pdf/
    const mimeTypes = /image\/(jpeg|png|gif|jpg)|application\/pdf/

    // Vérifier le mimetype
    const mimeTypeValid = mimeTypes.test(file.mimetype)
    // Vérifier l'extension
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase())

    if (mimeTypeValid && extname) {
      return cb(null, true)
    }

    cb(new Error(`Type de fichier non supporté. Extensions autorisées: ${fileTypes}`), false)
  },
})

// Middleware de logging des fichiers
const logFileUpload = (req, res, next) => {
  if (req.files) {
    console.log(
      "📁 Fichiers reçus:",
      req.files.map((f) => ({
        name: f.originalname,
        size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
        type: f.mimetype,
      })),
    )
  }
  next()
}

// Middleware de gestion d'erreur pour Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          error: "File too large",
          message: "La taille du fichier dépasse la limite autorisée (50 MB)",
          code: err.code,
        })
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          error: "Too many files",
          message: "Nombre maximum de fichiers dépassé (5 fichiers maximum)",
          code: err.code,
        })
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          error: "Unexpected field",
          message: "Champ de fichier inattendu",
          code: err.code,
        })
      default:
        return res.status(400).json({
          error: "Upload error",
          message: err.message,
          code: err.code,
        })
    }
  }

  if (err && err.message.includes("Type de fichier non supporté")) {
    return res.status(400).json({
      error: "Invalid file type",
      message: err.message,
      code: "INVALID_FILE_TYPE",
    })
  }

  next(err)
}

// Middleware pour nettoyer les fichiers temporaires en cas d'erreur
const cleanupOnError = (err, req, res, next) => {
  if (err && req.files) {
    console.log("🧹 Nettoyage des fichiers temporaires...")
    req.files.forEach((file) => {
      console.log(`- ${file.originalname}`)
    })
  }
  next(err)
}

// Middleware pour valider les métadonnées des fichiers
const validateFileMetadata = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next()
  }

  const totalSize = req.files.reduce((acc, file) => acc + file.size, 0)
  const maxTotalSize = 100 * 1024 * 1024 // 100 MB total

  if (totalSize > maxTotalSize) {
    return res.status(400).json({
      error: "Total size too large",
      message: "La taille totale des fichiers dépasse la limite autorisée (100 MB)",
      code: "TOTAL_SIZE_LIMIT",
    })
  }

  for (const file of req.files) {
    if (file.originalname.length > 255) {
      return res.status(400).json({
        error: "Invalid filename",
        message: "Le nom du fichier est trop long",
        code: "INVALID_FILENAME",
      })
    }
  }

  next()
}

export { upload, handleMulterError, cleanupOnError, validateFileMetadata, logFileUpload }

