import { z } from 'zod';
import { Computer } from 'orgo';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const stealth = StealthPlugin()
stealth.onBrowser = async () => {};
puppeteer.use(stealth);

const crawlSchema = z.object({
  instruction: z.string(),
  model: z.string().optional().default("claude-sonnet-4-20250514"),
});

const extractUrl = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
};

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
        let browser: any = null;
        const actionLog: any[] = [];
        const claudeLog: string[] = [];

        try {
            const url = extractUrl(instruction);
            if(url) {
                const launchOptions = process.env.NODE_ENV === 'production'
                ? {
                    args: chromium.args,
                    executablePath: await chromium.executablePath(),
                    headless: true,
                  }
                : { headless: true };
                
                browser = await puppeteer.launch(launchOptions);
                const page = await browser.newPage();
                await page.goto(url, { waitUntil: 'networkidle2' });
                const screenshot = await page.screenshot({ encoding: 'base64' });
                controller.enqueue(`data: ${JSON.stringify({ type: 'initial_screenshot', data: { screenshot } })}\n\n`);
                await browser.close();
            }

          computer = await Computer.create({ apiKey: ORGO_API_KEY });

          const progressCallback = (event_type: string, event_data: any) => {
            if (event_type === 'text') {
              claudeLog.push(event_data);
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
          const finalScreenshot = await computer.screenshotBase64();
          const fullClaudeOutput = claudeLog.join('\n');

          const finalPayload = {
            summary,
            finalScreenshot,
            fullClaudeOutput,
          };
          
          controller.enqueue(`data: ${JSON.stringify({ type: 'final_payload', data: finalPayload })}\n\n`);
          
        } catch (error) {
          console.error('[Crawl API] Error during Orgo operation:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the Orgo operation';
          controller.enqueue(`data: ${JSON.stringify({ type: 'error', data: { message: errorMessage } })}\n\n`);
        } finally {
            if (computer) {
                await computer.destroy();
            }
            if(browser) {
                await browser.close();
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