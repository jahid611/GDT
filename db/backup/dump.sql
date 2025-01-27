-- Exemple de données de test
db.users.insertMany([
  {
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "$2a$10$XYZ...", // hashed password
    "role": "admin"
  },
  {
    "name": "Test User",
    "email": "user@example.com",
    "password": "$2a$10$ABC...", // hashed password
    "role": "user"
  }
]);

db.teams.insertMany([
  {
    "name": "Development Team",
    "description": "Main development team"
  },
  {
    "name": "Design Team",
    "description": "UI/UX design team"
  }
]);

