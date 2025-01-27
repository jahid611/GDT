/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: "#10B981", // Emerald-500
            foreground: "#FFFFFF",
          },
          secondary: {
            DEFAULT: "#34D399", // Emerald-400
            foreground: "#064E3B", // Emerald-900
          },
          background: "#F0FDF4", // Emerald-50
          foreground: "#064E3B", // Emerald-900
          card: {
            DEFAULT: "#FFFFFF",
            foreground: "#064E3B",
          },
          border: "#6EE7B7", // Emerald-300
          ring: "#059669", // Emerald-600
          muted: {
            DEFAULT: "#D1FAE5", // Emerald-100
            foreground: "#065F46", // Emerald-800
          },
          accent: {
            DEFAULT: "#A7F3D0", // Emerald-200
            foreground: "#065F46", // Emerald-800
          },
        },
        animation: {
          "notification-slide-in": "notification-slide-in 0.5s ease-out forwards",
          "notification-timer": "notification-timer 5s linear forwards",
          "notification-badge": "notification-badge 1s ease-in-out infinite",
        },
        keyframes: {
          "notification-slide-in": {
            "0%": {
              transform: "translateX(100%)",
              opacity: 0,
            },
            "100%": {
              transform: "translateX(0)",
              opacity: 1,
            },
          },
          "notification-timer": {
            "0%": {
              width: "100%",
            },
            "100%": {
              width: "0%",
            },
          },
          "notification-badge": {
            "0%, 100%": {
              transform: "scale(1)",
            },
            "50%": {
              transform: "scale(1.1)",
            },
          },
        },
        scale: {
          102: "1.02",
        },
      },
    },
    plugins: [],
  }
  
  