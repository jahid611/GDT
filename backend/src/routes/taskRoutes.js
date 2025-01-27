import express from "express"
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

router.get("/", auth, getTasks)
router.post("/", auth, createTask)
router.put("/:id", auth, updateTask)
router.delete("/:id", auth, deleteTask)

export default router

