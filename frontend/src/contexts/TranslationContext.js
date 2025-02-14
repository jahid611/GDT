// TranslationContext.js
import React, { createContext, useContext, useState } from "react"
import { translations } from "./translations"

const TranslationContext = createContext()

export const TranslationProvider = ({ children }) => {
  // Vous pouvez initialiser la langue en fonction d'une préférence (par exemple locale du navigateur)
  const [lang, setLang] = useState("en")

  const t = (key) => {
    return translations[lang][key] || key
  }

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "fr" : prev === "fr" ? "ro" : "en"))
  }

  const setLanguage = (newLang) => {
    setLang(newLang)
  }

  return (
    <TranslationContext.Provider value={{ t, lang, toggleLanguage, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = () => useContext(TranslationContext)
