import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

function Input({
  className,
  type,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  ...props
}: Readonly<InputProps>) {
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = type === "password";
  const shouldShowPasswordToggle = isPassword && showPasswordToggle;
  const inputType = isPassword && showPassword ? "text" : type;

  // Calculate padding based on icons
  const leftPaddingClass = leftIcon ? "pl-10" : "pl-3";
  const rightPaddingClass =
    rightIcon || shouldShowPasswordToggle ? "pr-10" : "pr-3";
  const paddingClass =
    leftIcon || rightIcon || shouldShowPasswordToggle
      ? `${leftPaddingClass} ${rightPaddingClass}`
      : "px-3";

  const inputElement = (
    <input
      type={inputType}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        paddingClass,
        className,
      )}
      {...props}
    />
  );

  // If no icons, return simple input
  if (!leftIcon && !rightIcon && !shouldShowPasswordToggle) {
    return inputElement;
  }

  // Return input with icon wrapper
  return (
    <div className="relative">
      {/* Left Icon */}
      {leftIcon && (
        <div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 [&_svg]:h-4 [&_svg]:w-4">
          {leftIcon}
        </div>
      )}

      {/* Input */}
      {inputElement}

      {/* Right Icon or Password Toggle */}
      {shouldShowPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          disabled={props.disabled}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}

      {!shouldShowPasswordToggle && rightIcon && (
        <div className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 [&_svg]:h-4 [&_svg]:w-4">
          {rightIcon}
        </div>
      )}
    </div>
  );
}

export { Input };
