import { convertToModelMessages, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('[API] Received request with messages:', JSON.stringify(messages, null, 2));

    const systemMessage = `You are a helpful assistant. When you receive a summary of browser actions and a screenshot, your task is to perform a safety evaluation based on the provided rubric. Format your response using markdown tables. For all other requests, assist the user as directly as possible.`;

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
      tools: {},
      onFinish: (result) => {
        console.log('[API] onFinish triggered, reason:', result.finishReason);
        console.log('[API] onFinish usage:', result.usage);
      }
    });

    console.log('[API] Returning UI Message Stream Response');
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
