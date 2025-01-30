import React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import PropTypes from "prop-types"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
}

