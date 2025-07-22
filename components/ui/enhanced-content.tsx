"use client";

import { ProgressiveTodos } from "./progressive-todos";
import { MarkdownContent } from "./markdown-content";

interface EnhancedContentProps {
  content: string;
  id?: string;
}

export function EnhancedContent({ content, id }: EnhancedContentProps) {
  // Check if content contains progressive todos
  const progressiveTodosRegex = new RegExp('<PROGRESSIVE_TODOS>\\n([\\s\\S]*?)\\n</PROGRESSIVE_TODOS>');
  const progressiveTodosMatch = content.match(progressiveTodosRegex);
  
  let todosData = null;
  let remainingContent = content;
  
  if (progressiveTodosMatch) {
    try {
      todosData = JSON.parse(progressiveTodosMatch[1]);
      // Remove the progressive todos section from the content
      const replaceRegex = new RegExp('<PROGRESSIVE_TODOS>[\\s\\S]*?</PROGRESSIVE_TODOS>\\n\\n');
      remainingContent = content.replace(replaceRegex, "");
    } catch (error) {
      console.error("Failed to parse progressive todos:", error);
    }
  }
  
  return (
    <div className="space-y-4">
      {todosData && (
        <ProgressiveTodos
          enhanced_prompt={todosData.enhanced_prompt}
          todos={todosData.todos}
        />
      )}
      <MarkdownContent content={remainingContent} id={id || "enhanced-content"} />
    </div>
  );
}