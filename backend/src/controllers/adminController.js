import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const createAdmin = async (req, res) => {
  console.log('Entrée dans la fonction createAdmin avec les données :', req.body);

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.error('Validation échouée : Tous les champs sont requis.');
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('Validation échouée : Email déjà utilisé.');
      return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    const savedAdmin = await admin.save();
    console.log('Administrateur créé avec succès :', savedAdmin);

    res.status(201).json({ message: 'Compte administrateur créé avec succès.', admin: savedAdmin });
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur :', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
