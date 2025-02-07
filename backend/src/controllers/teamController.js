// src/controllers/teamController.js
import Team from "../models/Team.js";
import User from "../models/User.js";

// Récupérer les équipes auxquelles un utilisateur appartient
export const getUserTeams = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching teams for user ID: ${id}`);
    const teams = await Team.find({ members: id }).populate("leader members", "email name");
    if (!teams || teams.length === 0) {
      return res.status(404).json({ error: "Aucune équipe trouvée" });
    }
    res.status(200).json(teams);
  } catch (error) {
    console.error("Error in getUserTeams:", error);
    res.status(500).json({
      error: "Impossible de charger les équipes",
      details: error.message,
    });
  }
};

// Créer une équipe pour un utilisateur (le leader est celui dont l'ID est dans l'URL)
export const createTeamViaUserAPI = async (req, res) => {
  try {
    const { id } = req.params; // ID du leader
    const { name, description, members } = req.body;
    console.log(`Creating team for user ID: ${id}`);
    // Vérifier que le leader existe
    const leader = await User.findById(id);
    if (!leader) {
      return res.status(404).json({ error: "Leader non trouvé" });
    }
    const newTeam = new Team({
      name,
      description,
      leader: id,
      // Si aucun membre n'est fourni, on ajoute par défaut le leader comme membre
      members: (members && members.length > 0) ? members : [id],
    });
    const savedTeam = await newTeam.save();
    res.status(201).json(savedTeam);
  } catch (error) {
    console.error("Error in createTeamViaUserAPI:", error);
    res.status(500).json({
      error: "Impossible de créer l'équipe",
      details: error.message,
    });
  }
};
