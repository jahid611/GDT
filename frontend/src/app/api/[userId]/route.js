import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../../../backend/config/db"

export async function GET(request, { params }) {
  try {
    const db = await connectToDatabase()
    const notifications = await db
      .collection("tasks")
      .find({
        "assignedTo._id": params.userId,
        notificationDismissed: { $ne: true },
      })
      .toArray()

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const db = await connectToDatabase()
    await db
      .collection("tasks")
      .updateMany({ "assignedTo._id": params.userId }, { $set: { notificationDismissed: true } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error dismissing notifications:", error)
    return NextResponse.json({ error: "Failed to dismiss notifications" }, { status: 500 })
  }
}

