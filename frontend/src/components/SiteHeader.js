import { Link } from "react-router-dom"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/output-onlinepngtools-6Op0lM7vaXM8Q1f4QQ3GZoaRPc2GAv.png"
            alt="Logo Vilmar"
            className="h-8 w-8"
          />
          <span className="text-lg font-bold text-white">Vilmar</span>
        </Link>

        <nav className="flex items-center space-x-6">
          <Link to="/login" className="text-sm font-medium text-gray-300 transition-colors hover:text-white">
            Connexion
          </Link>
          <Link to="/register" className="text-sm font-medium text-gray-300 transition-colors hover:text-white">
            Inscription
          </Link>
        </nav>
      </div>
    </header>
  )
}

