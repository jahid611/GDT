import LanguageToggle from "./LanguageToggle"

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen relative bg-gradient-to-b from-primary/5 to-background">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:20px_20px]" />
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>
      {children}
    </div>
  )
}

