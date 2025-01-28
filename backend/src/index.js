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

// Configuration CORS améliorée
const allowedOrigins = [
  'http://localhost:3000',
  'https://gdt-mauve.vercel.app',
  process.env.CLIENT_URL,
  process.env.DEPLOYED_CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Permettre les requêtes sans origine
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ Tentative d\'accès refusée depuis:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
}));

// Middlewares globaux
app.use(express.json());
app.use(morgan('dev'));

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
    return res.status(503).json({
      error: 'Database connection is not ready',
      details: 'The server is currently trying to establish a database connection. Please try again later.',
    });
  }
  next();
});

// Routes principales
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Task Manager API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Importation des routes
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js'
import notificationsRoutes from './routes/notificationsRoutes.js'; // Ajout des notifications

// Application des routes avec préfixes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
console.log('Route "/api/admin" correctement ajoutée.');
app.use('/api/notifications', notificationsRoutes); // Application des notifications

// Middleware pour les routes non trouvées
app.use((req, res) => {
  console.log(`Route non trouvée : ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: `La route ${req.originalUrl} n'existe pas sur ce serveur`,
    timestamp: new Date().toISOString(),
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur détectée :', err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'L\'accès depuis votre origine n\'est pas autorisé',
      origin: req.headers.origin,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: Object.values(err.errors).map((e) => e.message),
      timestamp: new Date().toISOString(),
    });
  }

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Une erreur inattendue s\'est produite',
    timestamp: new Date().toISOString(),
  });
});

// Gestion des signaux d'arrêt pour une fermeture propre
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('🔒 MongoDB connection closed due to app termination');
    process.exit(0);
  });
});

// Gestion des rejets de promesses non gérés
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Gestion des exceptions non attrapées
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  mongoose.connection.close(() => {
    console.log('🔒 MongoDB connection closed due to error');
    process.exit(1);
  });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log('👉 Allowed Origins:', allowedOrigins);
});
