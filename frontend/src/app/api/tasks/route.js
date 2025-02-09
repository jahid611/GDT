import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new Response(JSON.stringify({ message: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")
    const { db } = await connectToDatabase()

    // Vérifier si l'utilisateur est membre de l'équipe
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(teamId),
      members: { $elemMatch: { $eq: new ObjectId(session.user.id) } },
    })

    if (!team) {
      return new Response(JSON.stringify({ message: "Accès non autorisé à cette équipe" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Récupérer les tâches de l'équipe
    const tasks = await db
      .collection("tasks")
      .find({ teamId: new ObjectId(teamId) })
      .sort({ createdAt: -1 })
      .toArray()

    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching team tasks:", error)
    return new Response(JSON.stringify({ message: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new Response(JSON.stringify({ message: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const data = await req.json() // Lire les données JSON au lieu de FormData
    const { db } = await connectToDatabase()

    // Vérifier si l'utilisateur est le leader de l'équipe
    if (data.teamId) {
      const team = await db.collection("teams").findOne({
        _id: new ObjectId(data.teamId),
        leader: new ObjectId(session.user.id),
      })

      if (!team) {
        return new Response(JSON.stringify({ message: "Seul le leader peut créer des tâches pour cette équipe" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    const task = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      deadline: data.deadline ? new Date(data.deadline) : null,
      estimatedTime: data.estimatedTime,
      teamId: new ObjectId(data.teamId), // Convertir en ObjectId
      createdBy: new ObjectId(session.user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("tasks").insertOne(task)
    const createdTask = await db.collection("tasks").findOne({ _id: result.insertedId })

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
  }
}

