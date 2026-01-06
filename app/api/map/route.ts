import { type NextRequest, NextResponse } from "next/server"
import { generateNearbyPlaces } from "@/utils/map-utils"

export async function POST(request: NextRequest) {
  try {
    const { location, type, radius } = await request.json()

    // Generate nearby places without exposing API key
    const places = generateNearbyPlaces(location, type, 10, radius / 1000)

    return NextResponse.json({ places })
  } catch (error) {
    console.error("Error in map API route:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
