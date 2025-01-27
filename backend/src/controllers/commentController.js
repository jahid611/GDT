import Task from "../models/Task.js"
import User from "../models/User.js"
import logger from "../utils/logger.js"

export const addComment = async (req, res) => {
  try {
    logger.info(`Adding comment to task ${req.params.id}`)
    const { id } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ message: "Le contenu du commentaire est requis" })
    }

    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" })
    }

    const comment = {
      user: req.user._id,
      content,
      createdAt: new Date(),
    }

    task.comments.push(comment)
    await task.save()

    // Notify assigned user
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      const assignedUser = await User.findById(task.assignedTo)
      if (assignedUser) {
        assignedUser.notifications.push({
          task: task._id,
          type: "comment",
          message: `Nouveau commentaire de ${req.user.name} sur la tâche "${task.title}"`,
        })
        await assignedUser.save()
      }
    }

    const updatedTask = await Task.findById(id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name")
      .populate({
        path: "comments.user",
        select: "name",
      })

    logger.info("Comment added successfully")
    res.status(201).json(updatedTask)
  } catch (error) {
    logger.error("Add comment error:", error)
    res.status(500).json({ message: "Erreur lors de l'ajout du commentaire", error: error.message })
  }
}

export const getComments = async (req, res) => {
  try {
    const { id } = req.params
    const task = await Task.findById(id).populate({
      path: "comments.user",
      select: "name",
    })

    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" })
    }

    res.json(task.comments)
  } catch (error) {
    logger.error("Get comments error:", error)
    res.status(500).json({ message: "Erreur lors de la récupération des commentaires" })
  }
}

