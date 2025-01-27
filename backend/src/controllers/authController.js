import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import User from "../models/User.js"

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    console.log("Login attempt with:", { email })

    if (!email || !password) {
      console.log("Missing credentials")
      return res.status(400).json({
        error: "L'email et le mot de passe sont requis",
      })
    }

    const user = await User.findOne({ email })
    console.log("User found:", user ? "Yes" : "No")

    if (!user) {
      console.log("User not found")
      return res.status(400).json({
        error: "Email ou mot de passe incorrect",
      })
    }

    // Use bcrypt to compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log("Password comparison:", {
      provided: password,
      stored: user.password,
      match: isPasswordValid,
    })

    if (!isPasswordValid) {
      console.log("Password mismatch")
      return res.status(400).json({
        error: "Email ou mot de passe incorrect",
      })
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    )

    console.log("Login successful for:", user.email)

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      error: "Une erreur est survenue lors de la connexion",
    })
  }
}

export const register = async (req, res) => {
  try {
    console.log("Registration attempt with:", { email: req.body.email })

    if (!req.body.email || !req.body.password || !req.body.name) {
      console.log("Missing registration data")
      return res.status(400).json({
        error: "Tous les champs sont requis",
      })
    }

    const existingUser = await User.findOne({ email: req.body.email })
    if (existingUser) {
      console.log("Email already exists")
      return res.status(400).json({
        error: "Cet email est déjà utilisé",
      })
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role || "user",
    })

    await user.save()
    console.log("User registered:", user.email)

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      error: "Une erreur est survenue lors de l'inscription",
    })
  }
}

// Utility function to reset a user's password (for admin use)
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body

    if (!email || !newPassword) {
      return res.status(400).json({
        error: "Email et nouveau mot de passe requis",
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    const user = await User.findOneAndUpdate({ email }, { password: hashedPassword }, { new: true })

    if (!user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      })
    }

    res.json({
      message: "Mot de passe réinitialisé avec succès",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    res.status(500).json({
      error: "Erreur lors de la réinitialisation du mot de passe",
    })
  }
}

