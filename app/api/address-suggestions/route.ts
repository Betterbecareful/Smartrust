import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get("input")

  if (!input) {
    return NextResponse.json({ predictions: [] })
  }

  try {
    // Replace with your Google Maps API key
    const apiKey = "AIzaSyBbj0f8x6TK6bCWuCZIXhqeX8p1gEM2RVk"
    if (!apiKey) {
      throw new Error("Google Maps API key is not configured")
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`,
      { headers: { "Content-Type": "application/json" } },
    )

    const data = await response.json()

    return NextResponse.json({
      predictions: data.predictions || [],
    })
  } catch (error) {
    console.error("Error fetching address suggestions:", error)
    return NextResponse.json({ error: "Failed to fetch address suggestions" }, { status: 500 })
  }
}
