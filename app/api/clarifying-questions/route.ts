import { NextResponse } from 'next/server'

// POST /api/clarifying-questions
// Expects JSON body: { input: string, fileContent?: string }
export async function POST(req: Request) {
  try {
    const { input, fileContent } = await req.json()
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
    }
    // Construct prompt for clarifying questions
    let prompt = `You are an expert contract specialist. Based on the user-provided information, generate 4 to 6 concise clarifying questions that will help draft a comprehensive contract. Return each question on its own line without numbering.`
    prompt += `\n\nUser Description:\n${input}`
    if (fileContent) {
      prompt += `\n\nUploaded File Content:\n${fileContent}`
    }

    // Call OpenAI Chat Completion API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        messages: [
          { role: 'system', content: prompt },
        ],
      }),
    })
    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    // Split lines and clean bullets or numbering
    const questions = text
      .split(/\r?\n/)  
      .map(line => line.replace(/^\s*[-*\d\.]+\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 6)
    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Error in clarifying-questions:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}