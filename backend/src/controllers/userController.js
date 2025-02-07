import User from "../models/User.js"
import Team from "../models/Team.js" // Import the Team model

// Contrôleur pour obtenir tous les utilisateurs
export const getUsers = async (req, res) => {
  try {
    console.log("Fetching all users from database...")
    const users = await User.find({})
      .select("_id username email role teams") // Changé 'name' en 'username'
      .populate({
        path: "teams",
        select: "name description",
      })
      .sort({ username: 1 }) // Changé 'name' en 'username'
    console.log(`Successfully found ${users.length} users`)

    // Ajouter un avatar par défaut si non défini
    const usersWithAvatars = users.map((user) => ({
      ...user.toObject(),
      avatar:
        user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=52,53,65,255`,
    }))

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Aucun utilisateur trouvé" })
    }
    res.status(200).json(usersWithAvatars)
  } catch (error) {
    console.error("Error in getUsers controller:", error)
    res.status(500).json({
      error: "Impossible de charger la liste des utilisateurs",
      details: error.message,
    })
  }
}

// Contrôleur pour obtenir le profil d'un utilisateur par ID
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params
    console.log(`Fetching user profile for ID: ${id}`)
    const user = await User.findById(id)
      .select("_id username email role teams") // Changé 'name' en 'username'
      .populate({
        path: "teams",
        select: "name description",
      })

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" })
    }

    // Ajouter l'avatar par défaut si non défini
    const userWithAvatar = {
      ...user.toObject(),
      avatar:
        user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=52,53,65,255`,
    }

    res.status(200).json(userWithAvatar)
  } catch (error) {
    console.error("Error in getUserProfile controller:", error)
    res.status(500).json({
      error: "Impossible de charger le profil utilisateur",
      details: error.message,
    })
  }
}

// Mise à jour du contrôleur pour créer une équipe
export const createTeamUsingUsers = async (req, res) => {
  try {
    const { name, description, leader, members } = req.body
    console.log("Creating team with data:", req.body)

    if (!name || !leader) {
      return res.status(400).json({ error: "Le nom de l'équipe et le leader sont requis" })
    }

    // Créer une nouvelle équipe
    const team = new Team({
      name,
      description,
      leader,
      members: [...new Set([leader, ...(members || [])])], // Assure que le leader est aussi membre
    })

    const savedTeam = await team.save()

    // Mettre à jour les utilisateurs avec la nouvelle équipe
    await User.updateMany({ _id: { $in: savedTeam.members } }, { $addToSet: { teams: savedTeam._id } })

    // Récupérer l'équipe avec les membres peuplés
    const populatedTeam = await Team.findById(savedTeam._id)
      .populate("leader", "username email")
      .populate("members", "username email")

    console.log("Team created successfully:", populatedTeam)
    res.status(201).json(populatedTeam)
  } catch (error) {
    console.error("Error in createTeamUsingUsers:", error)
    res.status(500).json({
      error: "Impossible de créer l'équipe",
      details: error.message,
    })
  }
}

