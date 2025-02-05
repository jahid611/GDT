"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, HelpCircle } from "lucide-react"

const TutorialContext = createContext()

export const useTutorial = () => {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider")
  }
  return context
}

export const TutorialProvider = ({
  children,
  steps = [],
  stepDuration = 3500,
  onComplete,
  pageKey,
  autoStart = false,
}) => {
  const tutorialKey = `tutorial-completed-${pageKey}`

  const [hasSeen, setHasSeen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(tutorialKey) === "true"
    }
    return false
  })

  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(autoStart && !hasSeen)
  const [showButton, setShowButton] = useState(!autoStart || hasSeen)

  const scrollToTarget = useCallback((targetId) => {
    const element = document.getElementById(targetId)
    if (element) {
      const elementRect = element.getBoundingClientRect()
      const absoluteElementTop = elementRect.top + window.pageYOffset
      const middle = absoluteElementTop - window.innerHeight / 4

      window.scrollTo({
        top: middle,
        behavior: "smooth",
      })
    }
  }, [])

  const startTutorial = useCallback(() => {
    setIsVisible(true)
    setShowButton(false)
    setCurrentStep(0)
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [])

  const completeTutorial = useCallback(() => {
    setIsVisible(false)
    setShowButton(true)
    setHasSeen(true)
    localStorage.setItem(tutorialKey, "true")
    onComplete?.()
  }, [onComplete, tutorialKey])

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      completeTutorial()
    }
  }, [currentStep, steps.length, completeTutorial])

  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return

    const currentTarget = steps[currentStep].targetId
    if (currentTarget) {
      scrollToTarget(currentTarget)
    }

    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1)
      } else {
        completeTutorial()
      }
    }, stepDuration)

    return () => clearTimeout(timer)
  }, [currentStep, steps, stepDuration, scrollToTarget, isVisible, completeTutorial])

  return (
    <TutorialContext.Provider value={{ currentStep, steps, isVisible, nextStep }}>
      {children}
      {isVisible && <TutorialHighlight />}
      {showButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 left-6 bg-[#C5D200] text-black p-3 rounded-full shadow-lg hover:bg-[#97A000] transition-colors duration-300 z-50 flex items-center gap-2"
          onClick={startTutorial}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Revoir le tutoriel</span>
        </motion.button>
      )}
    </TutorialContext.Provider>
  )
}

const TutorialHighlight = () => {
  const { currentStep, steps, isVisible, nextStep } = useTutorial()
  const [highlight, setHighlight] = useState(null)

  const updateHighlight = useCallback(() => {
    const step = steps[currentStep]
    if (!step?.targetId || !isVisible) {
      setHighlight(null)
      return
    }

    const target = document.getElementById(step.targetId)
    if (target) {
      const rect = target.getBoundingClientRect()
      setHighlight({
        rect,
        step,
      })
    }
  }, [currentStep, steps, isVisible])

  useEffect(() => {
    updateHighlight()
    window.addEventListener("resize", updateHighlight)
    window.addEventListener("scroll", updateHighlight)

    const observer = new MutationObserver(updateHighlight)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      window.removeEventListener("resize", updateHighlight)
      window.removeEventListener("scroll", updateHighlight)
      observer.disconnect()
    }
  }, [updateHighlight])

  if (!highlight) return null

  const { rect, step } = highlight

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50"
      >
        {/* Overlay plus subtil sans flou */}
        <div
          className="absolute inset-0 bg-black/40"
          style={{
            maskImage: `radial-gradient(circle at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent 40px, black 120px)`,
            WebkitMaskImage: `radial-gradient(circle at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent 40px, black 120px)`,
          }}
        />

        {/* Indicateur de tutoriel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute"
          style={{
            top: rect.bottom + 16,
            left: rect.left + rect.width / 2,
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-black/80 rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-xs border border-white/10">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C5D200]/20 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                nextStep()
              }}
            >
              <ArrowRight className="w-5 h-5 text-[#C5D200]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{step.title}</p>
              <p className="text-xs text-gray-400">{step.text}</p>
            </div>
          </div>

          {/* Indicateur de progression */}
          <div className="mt-3 flex justify-center gap-1.5">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-white/20"
                animate={{
                  backgroundColor: index === currentStep ? "#C5D200" : "rgba(255,255,255,0.2)",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TutorialProvider

