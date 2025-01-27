import React from "react"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import App from "../../frontend/src/App"

describe("App Component", () => {
  it("renders homepage by default", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    )

    expect(screen.getByText(/Task Management/i)).toBeInTheDocument()
    expect(screen.getByText(/for Teams/i)).toBeInTheDocument()
  })

  it("renders login page on /login route", () => {
    window.history.pushState({}, "", "/login")

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    )

    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument()
  })
})

