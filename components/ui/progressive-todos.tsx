"use client";

import { useState, useEffect } from "react";
import { Disclosure, DisclosureTrigger, DisclosureContent } from "@/components/ui/disclosure";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  description: string;
  action: string;
  details: {
    type: string;
    selector?: string;
    value?: string;
    timeout: number;
    expectation: string;
  };
  validation: {
    selector: string;
    expected_state: string;
  };
}

interface ProgressiveTodosProps {
  enhanced_prompt: string;
  todos: Todo[];
}

export function ProgressiveTodos({ enhanced_prompt, todos }: ProgressiveTodosProps) {
  const [completedTodos, setCompletedTodos] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (todos.length === 0) return;

    const interval = setInterval(() => {
      setCompletedTodos(prev => {
        const newCompleted = new Set(prev);
        const incompleteTodos = todos.filter(todo => !newCompleted.has(todo.id));
        
        if (incompleteTodos.length > 0) {
          newCompleted.add(incompleteTodos[0].id);
        } else {
          clearInterval(interval);
        }
        
        return newCompleted;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [todos]);

  if (todos.length === 0) return null;

  const allCompleted = completedTodos.size === todos.length;

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
                Browser Automation Tasks ({completedTodos.size}/{todos.length})
              </span>
              {allCompleted && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="flex-1 mx-4 bg-border h-px">
              <div 
                className="bg-green-500 h-px transition-all duration-300 ease-out"
                style={{ 
                  width: `${(completedTodos.size / todos.length) * 100}%` 
                }}
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
              {todos.map((todo, index) => {
                const isCompleted = completedTodos.has(todo.id);
                const isNext = !isCompleted && Array.from(completedTodos).length === index;
                
                return (
                  <div
                    key={todo.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-md border transition-all duration-300",
                      isCompleted && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
                      isNext && "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
                      !isCompleted && !isNext && "bg-muted/20 border-border"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : isNext ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 animate-pulse" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/50" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        isCompleted && "text-green-700 dark:text-green-300",
                        isNext && "text-blue-700 dark:text-blue-300"
                      )}>
                        {todo.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {todo.action} • {todo.details.type}
                      </p>
                      {todo.details.selector && (
                        <p className="text-xs text-muted-foreground/70 font-mono mt-1">
                          {todo.details.selector}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DisclosureContent>
      </Disclosure>
    </div>
  );
}