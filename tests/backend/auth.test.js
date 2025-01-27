import request from "supertest"
import app from "../../backend/src/index.js"
import User from "../../backend/src/models/User.js"
import { generateToken } from "../../backend/src/utils/jwt.js"

describe("Auth Routes", () => {
  beforeEach(async () => {
    await User.deleteMany({})
  })

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      })

      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty("token")
    })

    it("should not register a user with existing email", async () => {
      await User.create({
        name: "Existing User",
        email: "test@example.com",
        password: "password123",
      })

      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe("POST /api/auth/login", () => {
    it("should login with correct credentials", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      })

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      })

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty("token")
    })

    it("should not login with incorrect password", async () => {
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      })

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      })

      expect(res.statusCode).toBe(401)
    })
  })
})

