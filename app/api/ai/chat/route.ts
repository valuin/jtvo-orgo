import { convertToModelMessages, streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const openrouter = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('[API] Received request with messages:', JSON.stringify(messages, null, 2));

    const systemMessage = `You are a helpful assistant for browser automation tasks.

CRITICAL: When producing or updating a plan you MUST call the tool "progressive_todos" to transmit the plan JSON. Do not inline JSON in assistant text. If a plan is relevant at any point, call the tool FIRST, then optionally continue with normal assistant text. Prefer incremental tool calls as steps evolve.

Tool payload shape:
- enhanced_prompt: string
- todos: array of items:
  - id: string
  - description: string
  - action: string
  - details: object (e.g. { type, selector?, value?, timeout?, expectation? })
  - validation: object (e.g. { selector?, expected_state? })`;

    console.log('[API] Calling streamText...');
    const result = await streamText({
      model: openrouter('gpt-4.1-mini'),
      system: systemMessage,
      messages: convertToModelMessages(messages),
      temperature: 0.7,
      toolChoice: 'auto',
      tools: {
        progressive_todos: tool({
          description: 'Emit or update a progressive todo plan for the current task',
          inputSchema: z.object({
            enhanced_prompt: z.string().describe('Concise summary of the overall goal or improved prompt'),
            todos: z.array(z.object({
              id: z.string().describe('Stable identifier for the todo item'),
              description: z.string().describe('Human-readable description of the step'),
              action: z.string().describe('Concise verb phrase of the action to perform'),
              details: z.object({
                type: z.string().describe('Kind of action to perform'),
                selector: z.string().optional(),
                value: z.string().optional(),
                timeout: z.number().optional(),
                expectation: z.string().optional(),
              }),
              validation: z.object({
                selector: z.string().optional(),
                expected_state: z.string().optional(),
              }).optional(),
            })),
          }),
        }),
      },
      onFinish: (result) => {
        console.log('[API] onFinish triggered, reason:', result.finishReason);
        console.log('[API] onFinish usage:', result.usage);
      }
    });

    console.log('[API] Returning UI Message Stream Response');
    // Use the built-in UIMessage response stream which correctly handles tool calls
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[API] Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

