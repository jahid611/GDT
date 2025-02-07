"use client"
import { motion } from "framer-motion"
import { Wrench, X, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const MaintenanceAccessModal = ({ open, onConfirm, onReject }) => {
  // Animation variants pour le contenu
  const contentVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  }

  // Animation variants pour l'icône
  const iconVariants = {
    hidden: { rotate: -180, opacity: 0 },
    visible: {
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
  }

  // Animation variants pour les boutons
  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: { scale: 0.95 },
  }

  return (
    <Dialog open={open} onOpenChange={onReject}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <motion.div variants={iconVariants} initial="hidden" animate="visible" className="relative">
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md" />
              <div className="relative bg-background p-4 rounded-full border shadow-lg">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
            </motion.div>
          </div>
          <DialogTitle className="text-center text-xl font-bold">Accès à la Maintenance</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Cette section est réservée aux membres de l'équipe de maintenance.
            <br />
            <span className="font-medium text-primary">Confirmez-vous en faire partie ?</span>
          </DialogDescription>
        </DialogHeader>

        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col gap-6"
        >
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                L'accès non autorisé à cette section peut entraîner des conséquences sur le système. Veuillez confirmer
                votre appartenance à l'équipe de maintenance.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button variant="outline" size="lg" onClick={onReject} className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Non autorisé
              </Button>
            </motion.div>

            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button
                variant="default"
                size="lg"
                onClick={onConfirm}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              >
                <Check className="mr-2 h-4 w-4" />
                Je suis membre
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

export default MaintenanceAccessModal

