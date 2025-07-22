"use client";

import React from "react";
import { Disclosure, DisclosureTrigger, DisclosureContent } from "@/components/ui/disclosure";
import { CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TodoItem {
  id: string;
  description: string;
  action: string;
  details: {
    type: "click" | "type" | "navigate" | "extract" | "wait" | "scroll";
    selector?: string;
    value?: string;
    timeout?: number;
    expectation: string;
  };
  validation: {
    selector: string;
    expected_state: string;
  };
  completed?: boolean;
}

interface TodoTrackerProps {
  todos: TodoItem[];
  enhancedPrompt?: string;
  prerequisites?: string[];
  postActions?: string[];
}

export function TodoTracker({ 
  todos, 
  enhancedPrompt, 
  prerequisites, 
  postActions 
}: TodoTrackerProps) {
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="mt-4 border rounded-lg bg-muted/30">
      <Disclosure>
        <DisclosureTrigger>
          <div className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">
                Browser Tasks ({completedCount}/{totalCount})
              </div>
              {enhancedPrompt && (
                <span className="text-xs text-muted-foreground truncate max-w-xs">
                  {enhancedPrompt}
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          </div>
        </DisclosureTrigger>
        <DisclosureContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Enhanced Prompt */}
            {enhancedPrompt && (
              <div className="p-3 bg-background rounded-md border">
                <h4 className="text-sm font-semibold mb-1">Enhanced Request</h4>
                <p className="text-sm text-muted-foreground">{enhancedPrompt}</p>
              </div>
            )}

            {/* Prerequisites */}
            {prerequisites && prerequisites.length > 0 && (
              <div className="p-3 bg-background rounded-md border">
                <h4 className="text-sm font-semibold mb-2">Prerequisites</h4>
                <ul className="space-y-1">
                  {prerequisites.map((prereq, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Todo List */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Tasks</h4>
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    "p-3 rounded-md border transition-all",
                    todo.completed 
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                      : "bg-background border"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      className="mt-0.5"
                      onClick={() => {
                        // Toggle completion state
                        todo.completed = !todo.completed;
                      }}
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-medium">{todo.description}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                          {todo.details.type}
                        </span>
                        {" → "}
                        {todo.action}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <strong>Expectation:</strong> {todo.details.expectation}
                      </div>
                      
                      {todo.details.selector && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Selector:</strong>{" "}
                          <code className="bg-muted px-1.5 py-0.5 rounded">
                            {todo.details.selector}
                          </code>
                        </div>
                      )}
                      
                      {todo.details.value && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Value:</strong>{" "}
                          <code className="bg-muted px-1.5 py-0.5 rounded">
                            {todo.details.value}
                          </code>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        <strong>Validation:</strong>{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded">
                          {todo.validation.selector}
                        </code>{" "}
                        should be{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded">
                          {todo.validation.expected_state}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Post Actions */}
            {postActions && postActions.length > 0 && (
              <div className="p-3 bg-background rounded-md border">
                <h4 className="text-sm font-semibold mb-2">Post Actions</h4>
                <ul className="space-y-1">
                  {postActions.map((action, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DisclosureContent>
      </Disclosure>
    </div>
  );
}