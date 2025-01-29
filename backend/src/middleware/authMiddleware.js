import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select("-password")

      if (!req.user) {
        console.log("⚠️ Token invalide - Utilisateur non trouvé")
        return res.status(401).json({ message: "Non autorisé" })
      }

      next()
    } else {
      console.log("⚠️ Pas de token fourni")
      res.status(401).json({ message: "Non autorisé, pas de token" })
    }
  } catch (error) {
    console.error("❌ Erreur d'authentification:", error)
    res.status(401).json({ message: "Non autorisé" })
  }
}

export const admin = async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    console.log("⚠️ Accès admin refusé")
    res.status(403).json({ message: "Accès réservé aux administrateurs" })
  }
}