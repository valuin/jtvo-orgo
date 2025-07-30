"use client";

import { ProgressiveTodos } from "./progressive-todos";
import { MarkdownContent } from "./markdown-content";

interface EnhancedContentProps {
  content: string;
  id?: string;
}

export function EnhancedContent({ content, id }: EnhancedContentProps) {
  // Check if content contains progressive todos
  const progressiveTodosRegex = /<PROGRESSIVE_TODOS>([\s\S]*?)<\/PROGRESSIVE_TODOS>/;
  const progressiveTodosMatch = content.match(progressiveTodosRegex);
  
  let todosData = null;
  let remainingContent = content;
  
  if (progressiveTodosMatch && progressiveTodosMatch[1]) {
    try {
      // Trim potential whitespace and newlines before parsing
      const jsonData = progressiveTodosMatch[1].trim();
      todosData = JSON.parse(jsonData);
      
      // Remove the progressive todos section from the content for cleaner display
      remainingContent = content.replace(progressiveTodosRegex, "").trim();
    } catch (error) {
      console.error("Failed to parse progressive todos JSON:", error);
      // Keep original content if parsing fails
      remainingContent = content;
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