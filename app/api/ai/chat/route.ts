import { convertToModelMessages, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemMessage = `You are a helpful assistant. Your goal is to help the user with browser automation tasks.

When you generate a plan, you MUST include a special block at the top of your response like this, followed by a step-by-step guide in markdown format:
<PROGRESSIVE_TODOS>
{
  "enhanced_prompt": "A concise summary of the overall goal.",
  "todos": [
    {
      "id": "1",
      "description": "First step of the plan.",
      "action": "action_name",
      "details": { "type": "navigate", "selector": "url", "value": "https://example.com", "timeout": 5, "expectation": "The page loads." },
      "validation": { "selector": "h1", "expected_state": "Example Domain" }
    }
  ]
}
</PROGRESSIVE_TODOS>
`;

  try {
    const result = await streamText({
      model: openrouter('gpt-4o-mini'),
      system: systemMessage,
      messages: convertToModelMessages(messages),
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('Error in POST handler:', error);
    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
