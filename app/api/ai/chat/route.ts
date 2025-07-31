import { convertToModelMessages, streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import puppeteer from 'puppeteer';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('[API] Received request with messages:', JSON.stringify(messages, null, 2));

    const systemMessage = `You are a helpful assistant for browser automation tasks. Your primary job is to create a plan to accomplish the user's goal. Call the "progressive_todos" tool to output this plan.`;

    console.log('[API] Calling streamText...');
    // Sanitize messages to remove client-side state before sending to the model
    const sanitizedMessages = messages.map((msg: any) => ({
      ...msg,
      parts: msg.parts.filter((part: any) => part.type && !part.type.startsWith('step-')),
    }));

    const result = await streamText({
      model: openai('gpt-4.1-mini'), // DO NOT CHANGE THIS MODEL, KEEP IT AS IS
      system: systemMessage,
      messages: convertToModelMessages(sanitizedMessages),
      temperature: 0.7,
      toolChoice: 'auto',
      tools: {
        progressive_todos: tool({
          description: 'Emit or update a progressive todo plan for the browser automation task.',
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
        take_screenshot: tool({
          description: 'Take a screenshot of a given URL.',
          inputSchema: z.object({
            url: z.string().url().describe('The URL to take a screenshot of.'),
          }),
          execute: async ({ url }) => {
            try {
              console.log(`[Puppeteer] Launching for URL: ${url}`);
              const browser = await puppeteer.launch({ headless: true });
              const page = await browser.newPage();
              await page.goto(url, { waitUntil: 'networkidle2' });
              const screenshot = await page.screenshot({ encoding: 'base64' });
              await browser.close();
              console.log(`[Puppeteer] Screenshot captured for ${url}`);
              return { success: true, screenshot, url };
            } catch (e: any) {
              console.error(`[Puppeteer] Error taking screenshot for ${url}:`, e);
              return { success: false, error: e.message };
            }
          },
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
