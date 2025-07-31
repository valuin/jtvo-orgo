import { z } from 'zod';
import { Computer } from 'orgo';

const crawlSchema = z.object({
  instruction: z.string(),
  model: z.string().optional().default("claude-sonnet-4-20250514"),
});


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = crawlSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid instruction provided', details: validation.error.format() }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    const { instruction, model } = validation.data;
    const { ORGO_API_KEY, ANTHROPIC_API_KEY } = process.env;

    if (!ORGO_API_KEY || !ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing required API keys (ORGO_API_KEY, ANTHROPIC_API_KEY)' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }

    const stream = new ReadableStream({
      async start(controller) {
        let computer: Computer | null = null;
        const actionLog: any[] = [];

        try {
          computer = await Computer.create({ apiKey: ORGO_API_KEY });

          const progressCallback = (event_type: string, event_data: any) => {
            // Only stream 'text' and 'tool_use' events to the client
            if (event_type === 'text' || event_type === 'tool_use') {
              const payload = JSON.stringify({ type: event_type, data: event_data });
              controller.enqueue(`data: ${payload}\n\n`);
            }
            if(event_type === 'tool_use') {
              actionLog.push(event_data);
            }
          };
          
          await computer.prompt({
            instruction,
            model,
            displayWidth: 1280,
            displayHeight: 800,
            callback: progressCallback,
            thinkingEnabled: true,
            maxIterations: 15,
            maxTokens: 4096,
            apiKey: ANTHROPIC_API_KEY
          });

          const summary = `Orgo performed the following actions:\n` + actionLog.map(a => `- ${a.action}: ${JSON.stringify(a)}`).join('\n');
          const imageData = await computer.screenshotBase64();

          const finalPayload = {
            summary,
            screenshot: imageData,
          };

          controller.enqueue(`data: ${JSON.stringify({ type: 'summary', data: finalPayload })}\n\n`);
          
        } catch (error) {
          console.error('[Crawl API] Error during Orgo operation:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the Orgo operation';
          controller.enqueue(`data: ${JSON.stringify({ type: 'error', data: { message: errorMessage } })}\n\n`);
        } finally {
            if (computer) {
                await computer.destroy();
            }
            controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[Crawl API] Top-level Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: 'Failed to process crawl request', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}