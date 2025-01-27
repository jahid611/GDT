import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';

// Chargement des variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fonction pour se connecter à MongoDB avec gestion des erreurs et reconnexion
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

// Vérification des collections dans MongoDB
mongoose.connection.on('connected', async () => {
  try {
    const dbName = mongoose.connection.name;
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Base de données connectée : ${dbName}`);
    console.log('📁 Collections disponibles :');
    collections.forEach((collection) => console.log(`- ${collection.name}`));
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des collections :', error.message);
  }
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected! Attempting to reconnect...');
  connectDB();
});

// Middleware pour CORS
app.use(
  cors({
    origin: "https://gdt-mauve.vercel.app", // Remplacez par l'URL de votre frontend Vercel
    credentials: true, // Autorise les cookies et en-têtes d'autorisation
  })
);


// Middlewares globaux
app.use(express.json()); // Pour gérer les requêtes JSON
app.use(morgan('dev')); // Logger des requêtes HTTP

// Middleware de log pour toutes les requêtes
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// Keep-alive route pour éviter l'inactivité sur Render
app.get('/keepalive', (req, res) => {
  res.status(200).send('OK');
});

// Middleware pour vérifier la connexion MongoDB avant chaque requête
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ Database connection not ready');
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

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur détectée :', err.stack);
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
