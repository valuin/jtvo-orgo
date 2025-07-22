import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  baseURL: "https://inference.jatevo.id/v1",
  apiKey: "jatevo_1752677697715_uq5wsun9ksh",
});

export async function POST(req: Request) {
	const { messages } = await req.json();

	const result = streamText({
		model: openai("moonshotai/kimi-k2-instruct"),
		system: "You are a helpful assistant",
		messages,
	});

	return result.toDataStreamResponse();
}
