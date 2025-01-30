"use client"

import React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import PropTypes from "prop-types"

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  attribute: PropTypes.string,
  defaultTheme: PropTypes.string,
  enableSystem: PropTypes.bool,
  disableTransitionOnChange: PropTypes.bool,
}

ThemeProvider.defaultProps = {
  attribute: "class",
  defaultTheme: "system",
  enableSystem: true,
  disableTransitionOnChange: false,
}

