-- Création des collections
db.createCollection('users');
db.createCollection('tasks');
db.createCollection('teams');

-- Index pour améliorer les performances
db.users.createIndex({ "email": 1 }, { unique: true });
db.tasks.createIndex({ "team": 1 });
db.tasks.createIndex({ "assignedTo": 1 });
db.teams.createIndex({ "leader": 1 });

