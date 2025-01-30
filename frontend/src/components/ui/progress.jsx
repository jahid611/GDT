"use client"

import { cn } from "@/lib/utils"

const Progress = ({ value = 0, className, ...props }) => {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <div
        className="h-full w-full flex-1 bg-primary transition-all duration-200"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
}

Progress.displayName = "Progress"

export { Progress }

