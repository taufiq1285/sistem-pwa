/**
 * Stepper Component
 * Progress stepper for multi-step forms
 */

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Stepper({
  steps,
  currentStep,
  className,
  orientation = "horizontal",
}: StepperProps) {
  const isVertical = orientation === "vertical";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "gap-3",
          isVertical
            ? "flex flex-col"
            : "flex items-start justify-between overflow-x-auto pb-2",
        )}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  "flex min-w-0",
                  isVertical
                    ? "flex-row items-start gap-3 text-left"
                    : "flex-col items-center text-center",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
                    isCompleted && "bg-green-500 text-white shadow-sm",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isPending &&
                      "border-2 border-muted bg-muted text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <div className={cn("space-y-1", isVertical ? "pt-0.5" : "mt-2 max-w-28")}>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted && "text-green-600 dark:text-green-400",
                      isCurrent && "text-primary",
                      isPending && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "rounded-full transition-all duration-500",
                    isVertical
                      ? "ml-5 h-8 w-0.5"
                      : "mt-5 h-0.5 flex-1",
                    index < currentStep ? "bg-green-500" : "bg-muted",
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
