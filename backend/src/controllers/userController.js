import User from "../models/User.js";

// Contrôleur pour obtenir tous les utilisateurs
export const getUsers = async (req, res) => {
  try {
    console.log("Fetching all users from database...");

    // Rechercher tous les utilisateurs et sélectionner les champs nécessaires
    const users = await User.find({})
      .select("_id name email role")
      .sort({ name: 1 }); // Trier par nom de manière alphabétique

    console.log(`Successfully found ${users.length} users`);

    if (!users || users.length === 0) {
      console.log("No users found in database");
      return res.status(404).json({
        error: "Aucun utilisateur trouvé",
      });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsers controller:", error);
    res.status(500).json({
      error: "Impossible de charger la liste des utilisateurs",
      details: error.message,
    });
  }
};

// Contrôleur pour obtenir le profil d'un utilisateur par ID
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching user profile for ID: ${id}`);

    // Rechercher un utilisateur par ID et sélectionner les champs nécessaires
    const user = await User.findById(id).select("_id name email role");

    if (!user) {
      console.log(`No user found with ID: ${id}`);
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserProfile controller:", error);
    res.status(500).json({
      error: "Impossible de charger le profil utilisateur",
      details: error.message,
    });
  }
};
