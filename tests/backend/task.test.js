import request from "supertest"
import app from "../../backend/src/index.js"
import Task from "../../backend/src/models/Task.js"
import User from "../../backend/src/models/User.js"
import { generateToken } from "../../backend/src/utils/jwt.js"

describe("Task Routes", () => {
  let token
  let user

  beforeEach(async () => {
    await Task.deleteMany({})
    await User.deleteMany({})

    user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    })

    token = generateToken(user._id)
  })

  describe("GET /api/tasks", () => {
    it("should get all tasks for user", async () => {
      await Task.create([
        {
          title: "Test Task 1",
          description: "Description 1",
          assignedTo: user._id,
        },
        {
          title: "Test Task 2",
          description: "Description 2",
          assignedTo: user._id,
        },
      ])

      const res = await request(app).get("/api/tasks").set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.length).toBe(2)
    })
  })

  describe("POST /api/tasks", () => {
    it("should create a new task", async () => {
      const res = await request(app).post("/api/tasks").set("Authorization", `Bearer ${token}`).send({
        title: "New Task",
        description: "Task Description",
      })

      expect(res.statusCode).toBe(201)
      expect(res.body.title).toBe("New Task")
    })
  })

  describe("PUT /api/tasks/:id", () => {
    it("should update a task", async () => {
      const task = await Task.create({
        title: "Test Task",
        description: "Description",
        assignedTo: user._id,
      })

      const res = await request(app).put(`/api/tasks/${task._id}`).set("Authorization", `Bearer ${token}`).send({
        status: "in_progress",
      })

      expect(res.statusCode).toBe(200)
      expect(res.body.status).toBe("in_progress")
    })
  })

  describe("DELETE /api/tasks/:id", () => {
    it("should delete a task", async () => {
      const task = await Task.create({
        title: "Test Task",
        description: "Description",
        assignedTo: user._id,
      })

      const res = await request(app).delete(`/api/tasks/${task._id}`).set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)

      const deletedTask = await Task.findById(task._id)
      expect(deletedTask).toBeNull()
    })
  })
})

