import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { z } from 'zod';

const screenshotSchema = z.object({
  url: z.string().url(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = screenshotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid URL provided', details: validation.error.format() }, { status: 400 });
    }

    const { url } = validation.data;

    console.log(`[Screenshot API] Launching Puppeteer for URL: ${url}`);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: 'networkidle2' });
    const screenshot = await page.screenshot({ encoding: 'base64' });
    await browser.close();
    console.log(`[Screenshot API] Screenshot captured for ${url}`);

    return NextResponse.json({ screenshot });

  } catch (error) {
    console.error('[Screenshot API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to capture screenshot', details: errorMessage }, { status: 500 });
  }
}