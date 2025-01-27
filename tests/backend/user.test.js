import request from "supertest"
import app from "../../backend/src/index.js"
import User from "../../backend/src/models/User.js"
import { generateToken } from "../../backend/src/utils/jwt.js"

describe("User Routes", () => {
  let token
  let user

  beforeEach(async () => {
    await User.deleteMany({})

    user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    })

    token = generateToken(user._id)
  })

  describe("GET /api/users/profile", () => {
    it("should get user profile", async () => {
      const res = await request(app).get("/api/users/profile").set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.email).toBe("test@example.com")
      expect(res.body).not.toHaveProperty("password")
    })

    it("should not get profile without token", async () => {
      const res = await request(app).get("/api/users/profile")

      expect(res.statusCode).toBe(401)
    })
  })

  describe("PUT /api/users/profile", () => {
    it("should update user profile", async () => {
      const res = await request(app).put("/api/users/profile").set("Authorization", `Bearer ${token}`).send({
        name: "Updated Name",
      })

      expect(res.statusCode).toBe(200)
      expect(res.body.name).toBe("Updated Name")
    })
  })
})

