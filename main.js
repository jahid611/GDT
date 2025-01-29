const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const https = require("https");

https.get("https://gdt-fjmj.onrender.com", (res) => {
  console.log("Statut du serveur :", res.statusCode);
}).on("error", (err) => {
  console.error("Erreur de connexion au backend :", err.message);
});


  // Chargez l'application React en mode développement
  mainWindow.loadURL("http://127.0.0.1:8080");

  // Ouvrir les outils de développement pour déboguer
  mainWindow.webContents.openDevTools();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
