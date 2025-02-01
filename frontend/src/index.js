import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css" // Changed from globals.css to index.css to match CRA conventions

const container = document.getElementById("root")
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

