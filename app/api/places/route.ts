import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// POST /api/places { query: string }
export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "no-store" } })
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Given a partial place text input for India, return only a compact JSON array of at most 8 suggestions for cities and large towns. Include the city name and state. Do not include any other text.
Input: ${query}
Output format: [ { "name": string, "state": string } ]`

    const res = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2, topP: 0.9, maxOutputTokens: 400 },
    })
    const text = res.response.text()
    let parsed: any = []
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\[[\s\S]*\]/)
      parsed = match ? JSON.parse(match[0]) : []
    }
    if (!Array.isArray(parsed)) parsed = []
    const suggestions = parsed
      .filter((x: any) => x && typeof x.name === "string" && typeof x.state === "string")
      .slice(0, 8)

    return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("/api/places error", err)
    return NextResponse.json({ suggestions: [] }, { status: 200, headers: { "Cache-Control": "no-store" } })
  }
}


