export const checkRole = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: "Non autorisé" })
      }
  
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Accès refusé" })
      }
  
      next()
    }
  }
  
  