import User from "../models/User.js"

// Contrôleur pour obtenir tous les utilisateurs
export const getUsers = async (req, res) => {
  try {
    console.log("➡️ Récupération de tous les utilisateurs...")

    const users = await User.find({})
      .select("_id username email role")
      .sort({ username: 1 })

    console.log(`✅ ${users.length} utilisateurs trouvés`)

    if (!users || users.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Aucun utilisateur trouvé"
      })
    }

    res.status(200).json(users)
  } catch (error) {
    console.error("❌ Erreur dans getUsers:", error)
    res.status(500).json({
      error: "Server Error",
      message: "Impossible de charger la liste des utilisateurs",
      details: error.message
    })
  }
}

// Contrôleur pour obtenir le profil d'un utilisateur
export const getUserProfile = async (req, res) => {
  try {
    console.log(`➡️ Récupération du profil utilisateur ID: ${req.user._id}`)

    const user = await User.findById(req.user._id)
      .select("_id username email role")

    if (!user) {
      console.log(`❌ Aucun utilisateur trouvé avec l'ID: ${req.user._id}`)
      return res.status(404).json({
        error: "Not Found",
        message: "Utilisateur non trouvé"
      })
    }

    res.status(200).json(user)
  } catch (error) {
    console.error("❌ Erreur dans getUserProfile:", error)
    res.status(500).json({
      error: "Server Error",
      message: "Impossible de charger le profil utilisateur",
      details: error.message
    })
  }
}

// Contrôleur pour mettre à jour le profil utilisateur
export const updateProfile = async (req, res) => {
  try {
    console.log(`➡️ Mise à jour du profil utilisateur ID: ${req.user._id}`)
    
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Utilisateur non trouvé"
      })
    }

    user.username = req.body.username || user.username
    user.email = req.body.email || user.email

    if (req.body.password) {
      user.password = req.body.password
    }

    const updatedUser = await user.save()

    console.log('✅ Profil utilisateur mis à jour avec succès')

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
    })
  } catch (error) {
    console.error("❌ Erreur dans updateProfile:", error)
    res.status(500).json({
      error: "Update Error",
      message: "Erreur lors de la mise à jour du profil",
      details: error.message
    })
  }
}