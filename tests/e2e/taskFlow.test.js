import { test, expect } from "@playwright/test"

test.describe("Task Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("http://localhost:3000/login")
    await page.fill('input[type="email"]', "test@example.com")
    await page.fill('input[type="password"]', "password123")
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test("create new task", async ({ page }) => {
    await page.fill('input[placeholder="Task title"]', "New E2E Task")
    await page.fill('textarea[placeholder="Task description"]', "E2E Test Description")
    await page.click('button:text("Add Task")')

    await expect(page.locator("text=New E2E Task")).toBeVisible()
  })

  test("update task status", async ({ page }) => {
    await page.selectOption("select", "in_progress")
    await expect(page.locator("select")).toHaveValue("in_progress")
  })

  test("delete task", async ({ page }) => {
    const taskTitle = "New E2E Task"
    await page.locator(`text=${taskTitle}`).first().click()
    await page.click('button[aria-label="Delete task"]')

    await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible()
  })
})

