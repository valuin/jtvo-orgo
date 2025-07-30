import { z } from "zod";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const BrowserTaskSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    enhanced_prompt: { 
      type: "string",
      description: "Refined version of user's request"
    },
    todos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { 
            type: "string",
            description: "Unique identifier for the task"
          },
          description: { 
            type: "string",
            description: "Human-readable task description"
          },
          action: { 
            type: "string",
            description: "Specific browser action to perform"
          },
          details: {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { 
                type: "string",
                enum: ["click", "type", "navigate", "extract", "wait", "scroll"]
              },
              selector: { 
                type: "string",
                description: "CSS selector or XPath"
              },
              value: { 
                type: "string",
                description: "Text to type or URL to navigate to"
              },
              timeout: { 
                type: "number",
                default: 5000,
                description: "Maximum wait time in milliseconds"
              },
              expectation: { 
                type: "string",
                description: "Expected result after action"
              }
            },
            required: ["type", "selector", "value", "timeout", "expectation"]
          },
          validation: {
            type: "object",
            additionalProperties: false,
            properties: {
              selector: { 
                type: "string",
                description: "Element to check for success"
              },
              expected_state: { 
                type: "string",
                description: "CSS class, attribute, or text to verify"
              }
            },
            required: ["selector", "expected_state"]
          }
        },
        required: ["id", "description", "action", "details", "validation"]
      }
    },
    prerequisites: {
      type: "array",
      items: { 
        type: "string",
        description: "Required setup items"
      }
    },
    post_actions: {
      type: "array",
      items: { 
        type: "string",
        description: "Cleanup or verification steps"
      }
    }
  },
  required: ["enhanced_prompt", "todos", "prerequisites", "post_actions"]
};

export async function POST(req: Request) {
  const { messages } = await req.json();

  // First get structured response from OpenRouter
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a structured prompt enhancer for browser AI agents. Your role is to take any user prompt and transform it into a highly structured format with detailed action specifications for browser AI agents with Firefox access through VM, at the end of the todo must always be to present the result to the chat.

Your output must be a JSON-compatible structured format with these exact fields:

## Output Structure:
{
  "enhanced_prompt": "Enhanced version of the user's request",
  "todos": [
    {
      "id": "unique-id-1",
      "description": "Clear task description",
      "action": "Specific browser action to perform",
      "details": {
        "type": "click|type|navigate|extract|wait|scroll",
        "selector": "CSS selector or XPath",
        "value": "Text to type or URL to navigate to",
        "timeout": 5000,
        "expectation": "What should happen after this action"
      },
      "validation": {
        "selector": "Element to check for success",
        "expected_state": "CSS class, attribute, or text to verify"
      }
    }
  ],
  "prerequisites": ["List of setup requirements"],
  "post_actions": ["Cleanup or verification steps"]
}

## Field Specifications:

**Each todo must include:**
- **id**: Unique identifier for the task
- **description**: Human-readable task description
- **action**: Specific browser automation action
- **details**: Technical implementation details
- **validation**: How to verify the action was successful

**Action types:**
- "navigate": Go to a specific URL
- "click": Click on an element
- "type": Enter text into an input
- "extract": Read data from an element
- "wait": Pause for element or condition
- "scroll": Scroll to element or position

**Example for "search google for weather":**
{
  "enhanced_prompt": "Search Google for current weather in Jakarta and extract temperature data",
  "todos": [
    {
      "id": "navigate-google",
      "description": "Navigate to Google search page",
      "action": "Navigate to Google",
      "details": {
        "type": "navigate",
        "value": "https://google.com",
        "expectation": "Google search page loads"
      },
      "validation": {
        "selector": "input[name='q']",
        "expected_state": "visible"
      }
    },
    {
      "id": "search-weather",
      "description": "Search for weather in Jakarta",
      "action": "Type search query",
      "details": {
        "type": "type",
        "selector": "input[name='q']",
        "value": "weather jakarta",
        "expectation": "Search results appear"
      },
      "validation": {
        "selector": "#search",
        "expected_state": "visible"
      }
    }
  ],
  "prerequisites": ["Firefox browser access", "Internet connection"],
  "post_actions": ["Extract temperature from weather widget"]
}

Always provide complete, actionable specifications regardless of prompt complexity.`,
        },
        ...messages,
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "BrowserTaskSchema",
          schema: BrowserTaskSchema,
          strict: true
        }
      }
    }),
  });

  const data = await response.json();
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    console.log("Parsed structured response:", parsed);
    
    // Format the structured response with progressive todos at the top
    let formattedContent = '';
    
    // Add progressive todos section at the top
    if (parsed.todos && parsed.todos.length > 0) {
      formattedContent += `<PROGRESSIVE_TODOS>\n`;
      formattedContent += JSON.stringify({
        enhanced_prompt: parsed.enhanced_prompt,
        todos: parsed.todos
      }) + '\n';
      formattedContent += `</PROGRESSIVE_TODOS>\n\n`;
    }
    
    // Add main content
    formattedContent += `## ${parsed.enhanced_prompt}\n\n`;
    
    if (parsed.prerequisites && parsed.prerequisites.length > 0) {
      formattedContent += `### Prerequisites:\n`;
      parsed.prerequisites.forEach((prereq: string) => {
        formattedContent += `- ${prereq}\n`;
      });
      formattedContent += '\n';
    }
    
    if (parsed.todos && parsed.todos.length > 0) {
      formattedContent += `### Action Plan:\n`;
      parsed.todos.forEach((todo: any, index: number) => {
        formattedContent += `${index + 1}. **${todo.description}**\n`;
        formattedContent += `   - Action: ${todo.action}\n`;
        formattedContent += `   - Type: ${todo.details.type}\n`;
        if (todo.details.selector) formattedContent += `   - Selector: \`${todo.details.selector}\`\n`;
        if (todo.details.value) formattedContent += `   - Value: ${todo.details.value}\n`;
        formattedContent += `   - Expected: ${todo.details.expectation}\n\n`;
      });
    }
    
    if (parsed.post_actions && parsed.post_actions.length > 0) {
      formattedContent += `### Post-Actions:\n`;
      parsed.post_actions.forEach((action: string) => {
        formattedContent += `- ${action}\n`;
      });
    }
    
    // Create a streaming response compatible with useChat
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send the formatted content as streaming data
        const lines = formattedContent.split('\n');
        let index = 0;
        
        const sendLine = () => {
          if (index < lines.length) {
            const line = lines[index];
            // Escape backslashes and double quotes to prevent breaking the stream format
            const escapedLine = line.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            controller.enqueue(encoder.encode(`0:"${escapedLine}${index < lines.length - 1 ? '\\n' : ''}"\n`));
            index++;
            setTimeout(sendLine, 10); // Small delay for streaming effect
          } else {
            controller.enqueue(encoder.encode('d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n'));
            controller.close();
          }
        };
        
        sendLine();
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  }
  
  console.error("Failed to parse structured response:", data);
  return Response.json({ error: "Failed to generate structured response" }, { status: 500 });
}
