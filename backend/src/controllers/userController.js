import User from "../models/User.js"

export const getUsers = async (req, res) => {
  try {
    console.log("Fetching all users from database...")

    // Explicitly select fields we want to return
    const users = await User.find({}).select("_id name email role").sort({ name: 1 }) // Sort by name alphabetically

    console.log(`Successfully found ${users.length} users`)

    if (!users || users.length === 0) {
      console.log("No users found in database")
      return res.status(404).json({
        error: "Aucun utilisateur trouvé",
      })
    }

    res.json(users)
  } catch (error) {
    console.error("Error in getUsers controller:", error)
    res.status(500).json({
      error: "Impossible de charger la liste des utilisateurs",
      details: error.message,
    })
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params
    console.log(`Fetching user profile for ID: ${id}`)

    const user = await User.findById(id).select("_id name email role")

    if (!user) {
      console.log(`No user found with ID: ${id}`)
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      })
    }

    res.json(user)
  } catch (error) {
    console.error("Error in getUserProfile controller:", error)
    res.status(500).json({
      error: "Impossible de charger le profil utilisateur",
      details: error.message,
    })
  }
}

