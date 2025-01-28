const auth = (req, res, next) => {
  try {
    console.log('Middleware auth exécuté');
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.error('Token manquant.');
      return res.status(401).json({ error: 'Accès non autorisé' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (req.user.role !== 'admin') {
      console.error('L\'utilisateur n\'a pas les droits administratifs.');
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }

    next();
  } catch (error) {
    console.error('Erreur dans le middleware auth:', error.message);
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

export default auth;
