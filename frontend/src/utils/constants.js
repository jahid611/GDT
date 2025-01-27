export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

export const STATUS_OPTIONS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  DONE: "done",
}

export const PRIORITY_OPTIONS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
}

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  MANAGER: "manager",
}

