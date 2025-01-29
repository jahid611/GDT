const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Vous pouvez exposer des méthodes ou des données ici
});
