import { motion } from "framer-motion"

export default function AuthLayout({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-background dark:via-background dark:to-black"
    >
      {children}
    </motion.div>
  )
}

