import React from "react";

interface Step {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

interface StepperProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Capture Photo" },
  { number: 2, label: "AI Processing" },
  { number: 3, label: "Copy Listing" },
];

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((step, i) => {
        const active = step.number === currentStep;
        const completed = step.number < currentStep;
        return (
          <React.Fragment key={step.number}>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground glow-green-sm"
                    : completed
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {completed ? "✓" : step.number}
              </div>
              <span
                className={`text-xs font-mono hidden sm:inline ${
                  active ? "text-primary" : completed ? "text-primary/60" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 ${
                  completed ? "bg-primary/40" : "bg-border"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
