import { test, expect } from "@playwright/test"

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login")
  })

  test("successful login", async ({ page }) => {
    await page.fill('input[type="email"]', "test@example.com")
    await page.fill('input[type="password"]', "password123")
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/.*dashboard/)
  })

  test("login with invalid credentials", async ({ page }) => {
    await page.fill('input[type="email"]', "test@example.com")
    await page.fill('input[type="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    await expect(page.locator(".text-red-700")).toBeVisible()
  })

  test("navigation to register page", async ({ page }) => {
    await page.click("text=Create an account")
    await expect(page).toHaveURL(/.*register/)
  })
})

