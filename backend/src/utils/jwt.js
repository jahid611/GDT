import jwt from "jsonwebtoken"

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "votre_secret_tres_securise_123", {
    expiresIn: process.env.JWT_EXPIRE || "24h",
  })
}

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || "votre_secret_tres_securise_123")
}

