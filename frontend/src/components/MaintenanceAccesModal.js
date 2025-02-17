"use client"

import { motion } from "framer-motion"
import { Wrench, X, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const MaintenanceAccessModal = ({ open, onConfirm, onReject }) => {
  // Variants d'animation pour le contenu
  const contentVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  }

  // Variants d'animation pour l'icône
  const iconVariants = {
    hidden: { rotate: -180, opacity: 0 },
    visible: {
      rotate: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  }

  // Variants d'animation pour les boutons
  const buttonVariants = {
    hover: { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 10 } },
    tap: { scale: 0.95 },
  }

  return (
    <Dialog open={open} onOpenChange={onReject}>
      <DialogContent className="w-full max-w-md p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-3xl">
        <DialogHeader className="mb-6">
          <div className="flex justify-center mb-6">
            <motion.div variants={iconVariants} initial="hidden" animate="visible" className="relative">
              {/* Halo animé autour de l'icône */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-2xl opacity-75 animate-pulse" />
              <div className="relative bg-white dark:bg-gray-900 p-5 rounded-full border border-gray-300 dark:border-gray-700 shadow-xl">
                <Wrench className="h-12 w-12 text-blue-500" />
              </div>
            </motion.div>
          </div>
          <DialogTitle className="text-center text-3xl font-extrabold text-gray-800 dark:text-gray-100">
            Maintenance Access
          </DialogTitle>

          <DialogDescription className="text-center pt-3 text-lg text-gray-600 dark:text-gray-300">
            This section is strictly reserved for maintenance team members.
            <br />
            <span className="font-semibold text-blue-500">Confirm your identity</span>
          </DialogDescription>

        </DialogHeader>

        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col gap-6"
        >
          <div className="bg-blue-50 dark:bg-gray-700 rounded-xl p-5 border border-blue-200 dark:border-gray-600 shadow-inner">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-7 w-7 text-yellow-500 mt-1 flex-shrink-0" />
              <p className="text-base text-gray-700 dark:text-gray-300">
                Unauthorized access could compromise system stability. Please confirm you are part of the maintenance team.
              </p>

            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={onReject}
                className="w-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900"
              >
                <X className="mr-2 h-6 w-6" />
                Not Authorized

              </Button>
            </motion.div>

            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="w-full sm:w-auto">
              <Button
                variant="default"
                size="lg"
                onClick={onConfirm}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-md"
              >
                <Check className="mr-2 h-6 w-6" />
                I am a member

              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

export default MaintenanceAccessModal
