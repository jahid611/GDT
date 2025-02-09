import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req, { params }) {
  console.log("Route API appelée - GET /api/teams/[teamId]/tasks")
  console.log("Paramètres reçus:", params)

  try {
    const teamId = params.teamId
    console.log("TeamID reçu:", teamId)

    const { db } = await connectToDatabase()
    console.log("Connexion à la base de données établie")

    // Nettoyer l'ID de l'équipe
    const cleanTeamId = teamId.replace(/c+/g, "c")
    console.log("TeamID nettoyé:", cleanTeamId)

    // Vérifier si l'équipe existe
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(cleanTeamId),
    })

    console.log("Équipe trouvée:", team ? "Oui" : "Non")

    if (!team) {
      console.log("Équipe non trouvée")
      return NextResponse.json({ message: "Équipe non trouvée" }, { status: 404 })
    }

    // Récupérer les tâches
    const tasks = await db
      .collection("tasks")
      .find({ teamId: new ObjectId(cleanTeamId) })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Nombre de tâches trouvées: ${tasks.length}`)

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Erreur complète:", error)
    return NextResponse.json(
      {
        message: "Erreur serveur",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

export async function POST(req, { params }) {
  console.log("Route API appelée - POST /api/teams/[teamId]/tasks")
  console.log("Paramètres reçus:", params)

  try {
    const teamId = params.teamId
    const cleanTeamId = teamId.replace(/c+/g, "c")
    console.log("TeamID nettoyé:", cleanTeamId)

    const { db } = await connectToDatabase()
    console.log("Connexion à la base de données établie")

    const data = await req.json()
    console.log("Données reçues:", data)

    const task = {
      ...data,
      teamId: new ObjectId(cleanTeamId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("tasks").insertOne(task)
    console.log("Tâche créée avec ID:", result.insertedId)

    const createdTask = await db.collection("tasks").findOne({
      _id: result.insertedId,
    })

    return NextResponse.json(createdTask, { status: 201 })
  } catch (error) {
    console.error("Erreur complète:", error)
    return NextResponse.json(
      {
        message: "Erreur serveur",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

