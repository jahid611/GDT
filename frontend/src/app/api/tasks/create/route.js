import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
// import { ObjectId } from "mongodb" // Removed as per instructions
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new Response(JSON.stringify({ message: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const formData = await req.formData()
    // const { db } = await connectToDatabase() // Removed as per instructions

    const title = formData.get("title")
    const description = formData.get("description")
    const status = formData.get("status")
    const priority = formData.get("priority")
    const deadline = formData.get("deadline")
    const estimatedTime = formData.get("estimatedTime")
    const assignedTo = formData.get("assignedTo")
    const teamId = formData.get("teamId")

    // Vérifier si l'utilisateur est le leader de l'équipe
    if (teamId) {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          leaderId: session.user.id,
        },
      })

      if (!team) {
        return new Response(JSON.stringify({ message: "Seul le leader peut créer des tâches pour cette équipe" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    const task = {
      title,
      description,
      status,
      priority,
      deadline: deadline ? new Date(deadline) : null,
      estimatedTime,
      assignedTo: assignedTo ? assignedTo : null,
      teamId: teamId ? teamId : null,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const createdTask = await prisma.task.create({
      data: task,
    })

    return new Response(JSON.stringify(createdTask), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error creating task:", error)
    return new Response(JSON.stringify({ message: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

