import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// POST /api/gemini-trip
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      origin,
      destination,
      preferences,
      needSettlements = true,
    } = body || {}

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    if (!origin || !destination) {
      return NextResponse.json({ error: "origin and destination are required" }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

    async function generateStrictJson(modelName: string, prompt: string): Promise<string> {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction:
          "You are a precise Indian road-trip planner. Use common driving routes and typical speeds. Prefer national/state highways unless preferences avoid them. Return only the requested JSON, no extra text.",
      })
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 2048,
        },
      })
      return result.response.text()
    }

        const prompt = `Plan a comprehensive road trip in India with detailed analysis.
Origin: ${origin}
Destination: ${destination}
Preferences: ${JSON.stringify(preferences || {})}

Rules:
- Be realistic with current roads; estimate distance in kilometers and typical drive duration (e.g., 7h 30m).
- Produce an ordered corridor of settlements (villages/towns/cities) along or adjacent to the likely route.
- Each settlement should include state and approximate lat/lng.
- Add per-segment distances from previous settlement (km).
- Keep settlements <= 80 items.
- Add a confidence score 0-1 for overall route quality.
- Provide up to 3 route options (e.g., fastest, scenic, economy) with their own distance, duration, and confidence.
- Include detailed route analysis with road conditions, fuel stops, rest areas, and traffic insights.
- Provide alternative routes with different characteristics (toll vs non-toll, highway vs state roads).
 - Include seasonal considerations and best travel times.
 - Add safety tips and emergency contacts along the route.
 - Include major tourist attractions, historical sites, and scenic viewpoints along the route.
 - Provide information about local cuisine and cultural experiences at key stops.

Return only JSON in this shape:
{
  "summary": {
    "distanceKm": number,
    "duration": string,
    "confidence": number
  },
  "routes": Array<{
    "name": string,
    "type": "fastest" | "scenic" | "economy" | "smart_optimized",
    "distanceKm": number,
    "duration": string,
    "confidence": number,
    "notes"?: string[],
    "roadConditions"?: string[],
    "fuelStops"?: Array<{ "name": string, "distance": number, "type": string }>,
    "restAreas"?: Array<{ "name": string, "distance": number, "facilities": string[] }>,
    "tollInfo"?: { "totalToll": number, "tollPlazas": Array<{ "name": string, "amount": number }> },
    "trafficInsights"?: string[],
    "safetyTips"?: string[],
    "bestTravelTime"?: string,
    "seasonalConsiderations"?: string[]
  }>,
  "settlements": Array<{
    "name": string,
    "type": "village" | "town" | "city",
    "state": string,
    "lat": number,
    "lng": number,
    "segmentDistanceKm": number
  }>,
  "notes": string[],
  "alternativeRoutes"?: Array<{
    "name": string,
    "reason": string,
    "distanceKm": number,
    "duration": string,
    "advantages": string[],
    "disadvantages": string[]
  }>,
     "emergencyContacts"?: Array<{ "type": string, "number": string, "description": string }>,
   "weatherConsiderations"?: string[],
   "fuelPriceTrends"?: Array<{ "location": string, "currentPrice": number, "trend": string }>,
   "touristAttractions"?: Array<{
     "name": string,
     "type": "historical" | "scenic" | "cultural" | "adventure" | "religious",
     "location": string,
     "distanceFromStart": number,
     "description": string,
     "bestTimeToVisit": string,
     "entryFee": string,
     "highlights": string[]
   }>,
   "localCuisine"?: Array<{
     "location": string,
     "specialties": string[],
     "famousRestaurants": string[],
     "foodCulture": string
   }>
}`

    const modelsToTry = ["gemini-1.5-pro", "gemini-1.5-flash"]
    let text = ""
    let lastError: any = null
    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          text = await generateStrictJson(modelName, prompt)
          lastError = null
          break
        } catch (err) {
          lastError = err
          // exponential backoff
          await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)))
        }
      }
      if (!lastError) break
    }
    if (lastError) {
      console.error("Gemini generation failed:", lastError)
      return NextResponse.json({ error: "Upstream model error. Please try again." }, { status: 502, headers: { "Cache-Control": "no-store" } })
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // Try to extract JSON block if model added formatting
      const match = text.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : null
    }

    if (!parsed) {
      return NextResponse.json({ error: "Failed to parse model response" }, { status: 502, headers: { "Cache-Control": "no-store" } })
    }

    // Minimal shape validation & coercion
    if (!parsed.summary || typeof parsed.summary.distanceKm !== "number" || typeof parsed.summary.duration !== "string") {
      return NextResponse.json({ error: "Invalid model response" }, { status: 502, headers: { "Cache-Control": "no-store" } })
    }
    if (!Array.isArray(parsed.settlements)) parsed.settlements = []
    if (!Array.isArray(parsed.routes)) parsed.routes = []
    if (!Array.isArray(parsed.notes)) parsed.notes = []
    if (!Array.isArray(parsed.alternativeRoutes)) parsed.alternativeRoutes = []
         if (!Array.isArray(parsed.emergencyContacts)) parsed.emergencyContacts = []
     if (!Array.isArray(parsed.weatherConsiderations)) parsed.weatherConsiderations = []
     if (!Array.isArray(parsed.fuelPriceTrends)) parsed.fuelPriceTrends = []
     if (!Array.isArray(parsed.touristAttractions)) parsed.touristAttractions = []
     if (!Array.isArray(parsed.localCuisine)) parsed.localCuisine = []
    if (!needSettlements) parsed.settlements = []

    return NextResponse.json(parsed, { headers: { "Cache-Control": "no-store" } })
  } catch (err: any) {
    console.error("/api/gemini-trip error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}


