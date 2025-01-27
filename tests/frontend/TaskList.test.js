import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TaskList from "../../frontend/src/components/TaskList"
import { getTasks, createTask } from "../../frontend/src/utils/api"

jest.mock("../../frontend/src/utils/api")

describe("TaskList Component", () => {
  const mockTasks = [
    {
      _id: "1",
      title: "Test Task 1",
      description: "Description 1",
      status: "todo",
    },
    {
      _id: "2",
      title: "Test Task 2",
      description: "Description 2",
      status: "in_progress",
    },
  ]

  beforeEach(() => {
    getTasks.mockResolvedValue(mockTasks)
  })

  it("renders task list", async () => {
    render(<TaskList />)

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument()
      expect(screen.getByText("Test Task 2")).toBeInTheDocument()
    })
  })

  it("creates new task", async () => {
    const newTask = {
      _id: "3",
      title: "New Task",
      description: "New Description",
      status: "todo",
    }

    createTask.mockResolvedValue(newTask)

    render(<TaskList />)

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "New Task" },
    })

    fireEvent.change(screen.getByPlaceholderText("Task description"), {
      target: { value: "New Description" },
    })

    fireEvent.click(screen.getByText("Add Task"))

    await waitFor(() => {
      expect(screen.getByText("New Task")).toBeInTheDocument()
    })
  })
})

