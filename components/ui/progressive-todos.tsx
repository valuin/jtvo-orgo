"use client";

import { useState } from "react";
import { Disclosure, DisclosureTrigger, DisclosureContent } from "@/components/ui/disclosure";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrgoAction {
  id: string; // Unique ID for each action, can be generated from index
  description: string; // Claude's text output
  action: string; // The tool action, e.g., 'left_click'
  details: {
    type: string;
  };
}

interface ProgressiveTodosProps {
  enhanced_prompt: string;
  todos: OrgoAction[];
}

export function ProgressiveTodos({ enhanced_prompt, todos }: ProgressiveTodosProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (todos.length === 0) return null;

  return (
    <div className="mb-4 border border-border rounded-lg p-2">
      <Disclosure
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <DisclosureTrigger>
          <div className="flex items-center justify-between w-full p-2 text-left hover:bg-muted/50 rounded-md transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-90"
                )}
              />
              <span className="font-medium text-sm">
                Browser Automation Tasks ({todos.length})
              </span>
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex-1 mx-4 bg-border h-px">
              <div
                className="bg-green-500 h-px"
                style={{ width: `100%` }}
              />
            </div>
          </div>
        </DisclosureTrigger>
        
        <DisclosureContent>
          <div className="px-4 pb-2">
            <p className="text-sm text-muted-foreground mb-3">
              {enhanced_prompt}
            </p>
            <div className="space-y-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 p-3 rounded-md border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      {todo.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {todo.action} • {todo.details.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DisclosureContent>
      </Disclosure>
    </div>
  );
}