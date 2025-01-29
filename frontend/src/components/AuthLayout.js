import LanguageToggle from "./LanguageToggle"

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white relative">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      {children}
    </div>
  )
}

