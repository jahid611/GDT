import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

// Fonction d'inscription
export const register = async (req, res) => {
  try {
    console.log("📝 Tentative d'inscription:", req.body)
    
    const { username, email, password } = req.body

    // Validation des champs
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont requis",
        details: {
          username: !username ? "Le nom d'utilisateur est requis" : null,
          email: !email ? "L'email est requis" : null,
          password: !password ? "Le mot de passe est requis" : null
        }
      })
    }

    // Vérification si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({
        message: "Un utilisateur avec cet email ou ce nom d'utilisateur existe déjà"
      })
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Création de l'utilisateur
    const user = new User({
      username,
      email,
      password: hashedPassword
    })

    await user.save()

    // Création du token JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    )

    res.status(201).json({
      message: "Inscription réussie",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    })

  } catch (error) {
    console.error("❌ Erreur lors de l'inscription:", error)
    res.status(500).json({
      message: "Erreur lors de la création du compte",
      error: error.message
    })
  }
}

// Fonction de connexion
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        message: "L'email et le mot de passe sont requis"
      })
    }

    // Recherche de l'utilisateur
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect"
      })
    }

    // Vérification du mot de passe
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect"
      })
    }

    // Création du token JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    )

    res.json({
      message: "Connexion réussie",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    })

  } catch (error) {
    console.error("❌ Erreur lors de la connexion:", error)
    res.status(500).json({
      message: "Erreur lors de la connexion",
      error: error.message
    })
  }
}

// Fonction de réinitialisation du mot de passe
export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        message: "L'email est requis"
      })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        message: "Aucun compte n'est associé à cet email"
      })
    }

    // TODO: Implémenter la logique d'envoi d'email de réinitialisation
    res.json({
      message: "Si un compte existe avec cet email, un lien de réinitialisation sera envoyé"
    })

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation du mot de passe:", error)
    res.status(500).json({
      message: "Erreur lors de la réinitialisation du mot de passe",
      error: error.message
    })
  }
}