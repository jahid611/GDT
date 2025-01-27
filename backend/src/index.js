import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';


// Chargement des variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fonction pour se connecter à MongoDB avec gestion de reconnexion
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    setTimeout(connectDB, 5000); // Réessayer après 5 secondes
  }
};

connectDB();

// Vérifier la base de données et ses collections
mongoose.connection.on("connected", async () => {
  try {
    const dbName = mongoose.connection.name;
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Base de données connectée : ${dbName}`);
    console.log("📁 Collections disponibles :");
    collections.forEach((collection) => console.log(`- ${collection.name}`));
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des collections :", error.message);
  }
});


// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Keep-alive route (utile pour éviter l'arrêt automatique sur Render)
app.get('/keepalive', (req, res) => {
  res.status(200).send('OK');
});

// Middleware pour vérifier la connexion MongoDB avant chaque requête
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database connection is not ready' });
  }
  next();
});

// Routes principales
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Task Manager API' });
});

// Importation des routes
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

app.use('/api/auth', authRoutes); // Routes d'authentification
app.use('/api/tasks', taskRoutes); // Routes des tâches

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Gestion des signaux d'arrêt pour une fermeture propre
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('🔒 MongoDB connection closed due to app termination');
    process.exit(0);
  });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
