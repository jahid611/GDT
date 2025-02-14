// LanguageSwitcher.js
import React from "react"
import { useTranslation } from "./TranslationContext"

const LanguageSwitcher = () => {
  const { toggleLanguage, lang } = useTranslation()
  return (
    <button onClick={toggleLanguage} style={{ margin: "10px", padding: "8px" }}>
      {lang === "en" ? "Français" : "English"}
    </button>
  )
}

export default LanguageSwitcher
