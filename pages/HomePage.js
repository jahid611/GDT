import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  Calendar,
  BarChart2,
  Users,
  Zap,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslation } from "@/i18n"; // Import de votre hook de traduction

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: LayoutGrid,
      title: t("featureWorkspaceTitle") || "Espace de travail unifié",
      description:
        t("featureWorkspaceDesc") ||
        "Retrouvez tous vos projets Vilmar au même endroit avec une interface adaptée à nos méthodes.",
    },
    {
      icon: Users,
      title: t("featureCollabTitle") || "Collaboration d'équipe",
      description:
        t("featureCollabDesc") ||
        "Travaillez efficacement avec vos collègues Vilmar en temps réel sur tous les projets.",
    },
    {
      icon: Calendar,
      title: t("featurePlanningTitle") || "Planning Vilmar",
      description:
        t("featurePlanningDesc") ||
        "Synchronisez vos tâches avec le calendrier des événements et deadlines Vilmar.",
    },
    {
      icon: BarChart2,
      title: t("featurePerformanceTitle") || "Suivi des performances",
      description:
        t("featurePerformanceDesc") ||
        "Visualisez l'avancement de vos projets selon les standards Vilmar.",
    },
    {
      icon: Zap,
      title: t("featureQuickAccessTitle") || "Accès rapide",
      description:
        t("featureQuickAccessDesc") ||
        "Connectez-vous instantanément à toutes les ressources internes Vilmar.",
    },
    {
      icon: Shield,
      title: t("featureSecurityTitle") || "Sécurité interne",
      description:
        t("featureSecurityDesc") ||
        "Vos données sont protégées selon notre politique de sécurité d'entreprise.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="min-h-screen relative bg-cover bg-center bg-no-repeat text-white dark:text-white"
      style={{
        backgroundImage:
          "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4KL2vS2QGHHzL7OGIEJp1Jc4ShlVh4.png')",
      }}
    >
      {/* Overlay pour améliorer la lisibilité en dark mode */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Contenu de la page */}
      <div className="relative z-10">
        <SiteHeader />

        <main className="container relative">
          <section className="py-20 md:py-32 space-y-16">
            <div className="flex flex-col items-center text-center space-y-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter"
              >
                {t("homeWelcome") || "Bienvenue sur votre espace Vilmar"}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="max-w-[700px] text-gray-700 dark:text-gray-300 text-lg sm:text-xl"
              >
                {t("homeDescription") ||
                  "Votre nouvel outil interne pour gérer vos tâches et projets au sein de Vilmar. Conçu spécifiquement pour notre équipe, par notre équipe."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/register">
                  <Button
                    size="lg"
                    className="group bg-[#C5D200] hover:bg-[#97A000] text-zinc-950 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {t("accessSpace") || "Accéder à mon espace"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  {/* Bouton de connexion avec styles adaptés pour light et dark mode */}
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-800 text-gray-800 hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-white/10 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {t("login") || "Connexion"}
                  </Button>
                </Link>
              </motion.div>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="relative overflow-hidden border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                    <CardContent className="p-6">
                      <feature.icon className="h-12 w-12 mb-5 text-[#C5D200]" />
                      <h3 className="font-semibold text-xl mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="max-w-2xl mx-auto text-center space-y-8"
            >
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t("advantagesTitle") || "Vos avantages Vilmar"}
              </h2>
              <ul className="space-y-4 text-left">
                {[
                  t("advantage1") || "Accès direct à tous vos outils Vilmar",
                  t("advantage2") || "Communication simplifiée entre équipes",
                  t("advantage3") ||
                    "Conformité avec nos processus internes",
                  t("advantage4") || "Support technique dédié",
                  t("advantage5") ||
                    "Formation et documentation intégrées",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-[#C5D200] flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </section>
        </main>

        <footer className="border-t border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/50 backdrop-blur-sm">
          <div className="container py-8 text-center text-sm text-gray-700 dark:text-gray-400">
            <p>
              {t("footerText") || "© 2025 Vilmar. Usage interne uniquement."}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
