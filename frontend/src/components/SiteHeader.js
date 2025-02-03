import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "sticky top-0 z-50 w-full border-b",
        "bg-background dark:bg-background",
        "border-border/50",
        "font-sans antialiased",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <span className="text-2xl font-extrabold tracking-tight text-foreground hover:text-[#C5D200] transition-colors duration-200">
            Vilmar Tasks
          </span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/login">
            <Button
              variant="ghost"
              className={cn(
                "text-base font-medium",
                "hover:bg-[#C5D200]/10 hover:text-[#C5D200]",
                "dark:text-zinc-200 dark:hover:text-[#C5D200]",
                "dark:hover:bg-[#C5D200]/20",
                "transition-all duration-300",
              )}
            >
              Connexion
            </Button>
          </Link>
          <Link to="/register">
            <Button
              className={cn(
                "text-base font-medium",
                "bg-[#C5D200] hover:bg-[#97A000] text-zinc-950",
                "transition-all duration-300",
                "border border-[#C5D200]/20",
                "dark:bg-[#C5D200] dark:hover:bg-[#97A000]",
                "dark:text-zinc-950 dark:border-[#C5D200]/40",
                "shadow-lg hover:shadow-xl hover:scale-105",
              )}
            >
              S'inscrire
            </Button>
          </Link>
        </nav>
      </div>
    </motion.header>
  )
}

