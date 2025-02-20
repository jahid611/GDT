import User from "../models/User.js"
import Team from "../models/Team.js" // Import the Team model if needed

// Controller to get all users
export const getUsers = async (req, res) => {
  try {
    console.log("Fetching all users from database...")
    const users = await User.find({})
      .select("_id username email role teams")
      .populate({
        path: "teams",
        select: "name description",
      })
      .sort({ username: 1 })

    console.log(`Successfully found ${users.length} users`)

    // Add a default avatar if not defined
    const usersWithAvatars = users.map((user) => ({
      ...user.toObject(),
      avatar:
        user.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=52,53,65,255`,
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

// Controller to get a user's profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params
    console.log(`Fetching user profile for ID: ${id}`)
    const user = await User.findById(id)
      .select("_id username email role teams")
      .populate({
        path: "teams",
        select: "name description",
      })

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" })
    }

    // Add a default avatar if not defined
    const userWithAvatar = {
      ...user.toObject(),
      avatar:
        user.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=52,53,65,255`,
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

// Controller to create a team using users
export const createTeamUsingUsers = async (req, res) => {
  try {
    const { name, description, leader, members } = req.body
    console.log("Creating team with data:", req.body)

    if (!name || !leader) {
      return res.status(400).json({ error: "Le nom de l'équipe et le leader sont requis" })
    }

    // Create a new team
    const team = new Team({
      name,
      description,
      leader,
      members: [...new Set([leader, ...(members || [])])], // Ensure leader is also a member
    })

    const savedTeam = await team.save()

    // Update users with the new team
    await User.updateMany(
      { _id: { $in: savedTeam.members } },
      { $addToSet: { teams: savedTeam._id } }
    )

    // Populate the team with user info
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

// ******* NEW: Controller to delete a user by ID *******
export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params
    console.log(`Deleting user with ID: ${id}`)

    const deletedUser = await User.findByIdAndDelete(id)

    if (!deletedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé ou déjà supprimé" })
    }

    console.log("User deleted successfully:", deletedUser)
    res.status(200).json({ message: "Utilisateur supprimé avec succès" })
  } catch (error) {
    console.error("Error in deleteUserById controller:", error)
    res.status(500).json({
      error: "Impossible de supprimer l'utilisateur",
      details: error.message,
    })
  }
}
