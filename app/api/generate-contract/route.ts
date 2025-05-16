import { NextResponse } from 'next/server'

// POST /api/generate-contract
// Expects JSON body: { input: string, fileContent?: string, questions?: { text: string }[], questionResponses?: string[], selectedTemplate?: string }
export async function POST(req: Request) {
  try {
    const { input = '', fileContent = '', questions = [], questionResponses = [], selectedTemplate = '' } = await req.json()
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
    }
    // Build the user content for the contract generation prompt
    let content = `Generate a professional contract in markdown format with the following sections:\n` +
      `# Title\n` +
      `# Parties\n` +
      `# Services\n` +
      `# Payment Terms\n` +
      `# Timeline\n` +
      `# Responsibilities\n` +
      `# Milestones\n` +
      `# Confidentiality\n` +
      `# Termination\n` +
      `# Governing Law\n` +
      `# Signatures\n\n` +
      `Use the following information to fill in each section. Do not include any additional sections.`
    if (input) {
      content += `\n\nUser Description:\n${input}`
    }
    if (fileContent) {
      content += `\n\nUploaded File Content:\n${fileContent}`
    }
    if (questions.length && questionResponses.length) {
      content += `\n\nClarifying Answers:`
      questions.forEach((q: { text: string }, i: number) => {
        const ans = questionResponses[i] || ''
        content += `\n- ${q.text}: ${ans}`
      })
    }
    if (selectedTemplate) {
      content += `\n\nTemplate Used: ${selectedTemplate}`
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
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are an AI assistant that drafts contracts strictly following the requested structure.' },
          { role: 'user', content },
        ],
      }),
    })
    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }
    const data = await response.json()
    const contract = data.choices?.[0]?.message?.content || ''
    return NextResponse.json({ contract })
  } catch (error: any) {
    console.error('Error in generate-contract:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}