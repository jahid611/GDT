"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle2, LayoutGrid, Calendar, BarChart2, Users, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/SiteHeader"
import { useTranslation } from "@/hooks/useTranslation"
import TutorialProvider from "../components/AdvancedTutorial"  // Assurez-vous que le chemin est correct

export default function HomePage() {
  const { t } = useTranslation()

  // Forcer le mode sombre par défaut
  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  const features = [
    {
      icon: LayoutGrid,
      title: "Unified Workspace",
      description: "Find all your Vilmar projects in one place with an interface tailored to our methods",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work efficiently with your Vilmar colleagues in real-time across all projects",
    },
    {
      icon: Calendar,
      title: "Vilmar Planning",
      description: "Synchronize your tasks with Vilmar's event calendar and deadlines",
    },
    {
      icon: BarChart2,
      title: "Performance Tracking",
      description: "Monitor your project progress according to Vilmar standards",
    },
    {
      icon: Zap,
      title: "Quick Access",
      description: "Connect instantly to all Vilmar internal resources",
    },
    {
      icon: Shield,
      title: "Internal Security",
      description: "Your data is protected according to our corporate security policy",
    },
  ]

  const benefits = [
    "Direct access to all Vilmar tools",
    "Streamlined team communication",
    "Compliance with internal processes",
    "Dedicated technical support",
    "Integrated training and documentation",
  ]

  // Variantes d'animation pour Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  // Définition des étapes du tutoriel avancé
  const tutorialSteps = [
    {
      title: "Bienvenue sur Vilmar Space !",
      text: "Voici votre espace d'accueil. Découvrez rapidement les points clés.",
      targetId: "hero-heading",
    },
    {
      title: "Accès rapide",
      text: "Utilisez ce bouton pour accéder directement à votre espace personnel.",
      targetId: "cta-buttons",
    },
    {
      title: "Fonctionnalités innovantes",
      text: "Explorez notre sélection de fonctionnalités pour booster votre productivité.",
      targetId: "features-grid",
    },
    {
      title: "Vos avantages",
      text: "Consultez ici tous les avantages réservés à notre équipe.",
      targetId: "benefits-section",
    },
  ];

  return (
    <TutorialProvider steps={tutorialSteps}>
      <div
        className="min-h-screen relative bg-cover bg-center bg-no-repeat text-gray-800 dark:text-white"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4KL2vS2QGHHzL7OGIEJp1Jc4ShlVh4.png')`,
        }}
      >
        <div className="absolute inset-0 bg-white/10 dark:bg-black/70 backdrop-blur-sm" />

        <div className="relative z-10">
          <SiteHeader />

          <main className="container relative px-4 py-12">
            <section className="py-20 md:py-32 space-y-16">
              <div id="hero-heading" className="flex flex-col items-center text-center space-y-8">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter drop-shadow-lg"
                >
                  Welcome to your{" "}
                  <span className="bg-gradient-to-r from-[#C5D200] to-[#97A000] bg-clip-text text-transparent">
                    Vilmar space
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="max-w-[700px] text-lg sm:text-xl text-black dark:text-white drop-shadow"
                >
                  Your new internal tool for managing tasks and projects within Vilmar. Designed specifically for our team, by our team.
                </motion.p>

                <motion.div
                  id="cta-buttons"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link to="/register">
                    <Button
                      size="lg"
                      className="group px-8 py-4 bg-[#C5D200] hover:bg-[#97A000] text-zinc-950 font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Access my space
                      <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="px-8 py-4 border-gray-800 text-gray-800 hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-white/10 font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Login
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <motion.div
                id="features-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {features.map((feature, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="relative overflow-hidden border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-6">
                        <feature.icon className="h-12 w-12 mb-5 text-black dark:text-[#C5D200]" />
                        <h3 className="font-semibold text-xl mb-2 text-black dark:text-white drop-shadow">
                          {feature.title}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 drop-shadow">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                id="benefits-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="max-w-2xl mx-auto text-center space-y-8"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white drop-shadow-lg">
                  Your Vilmar Benefits
                </h2>
                <ul className="space-y-4 text-left">
                  {benefits.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="h-5 w-5 text-black dark:text-[#C5D200] flex-shrink-0" />
                      <span className="text-black dark:text-white drop-shadow">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </section>
          </main>

          <footer className="border-t border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/50 backdrop-blur-sm">
            <div className="container py-8 text-center text-sm text-black dark:text-gray-400">
              <p>© 2025 Vilmar. Internal use only.</p>
            </div>
          </footer>
        </div>
      </div>
    </TutorialProvider>
  )
}
