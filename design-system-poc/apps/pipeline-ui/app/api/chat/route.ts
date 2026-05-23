import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { buildGrillSystemPrompt } from '@/lib/grill-prompt'

export const runtime = 'nodejs'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { messages, componentName, figmaDesign } = await req.json()

  // Convert plain {role, content} messages to Anthropic format
  const anthropicMessages: Anthropic.MessageParam[] = (messages ?? [])
    .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
    .map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: buildGrillSystemPrompt(componentName ?? '', JSON.stringify(figmaDesign ?? {})),
    messages: anthropicMessages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const data = JSON.stringify({ t: event.delta.text })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const errData = JSON.stringify({ error: String(err) })
        controller.enqueue(encoder.encode(`data: ${errData}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
