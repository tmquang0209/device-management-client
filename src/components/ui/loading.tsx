import clsx from "clsx";
import React from "react";

interface LoadingProps {
  size?: number;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 24, className }) => {
  return (
    <div
      className={clsx("flex items-center justify-center h-screen", className)}
    >
      <div
        className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-blue-600`}
      ></div>
    </div>
  );
};
