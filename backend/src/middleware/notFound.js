export const notFound = (req, res) => {
    res.status(404).json({
      error: "NotFound",
      message: `La route ${req.originalUrl} n'existe pas sur ce serveur`,
      timestamp: new Date().toISOString(),
    })
  }
  
  