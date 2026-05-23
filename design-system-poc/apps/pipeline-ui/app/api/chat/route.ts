import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText } from 'ai'
import { NextRequest } from 'next/server'
import { buildGrillSystemPrompt } from '@/lib/grill-prompt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { messages, componentName, figmaDesign } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildGrillSystemPrompt(componentName ?? '', JSON.stringify(figmaDesign ?? {})),
    // convertToModelMessages converts UIMessage[] (ai@6 client format) to ModelMessage[]
    messages: convertToModelMessages(messages ?? []),
    maxOutputTokens: 2048,
  })

  return result.toUIMessageStreamResponse()
}
