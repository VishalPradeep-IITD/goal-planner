"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Single-thumb range slider using native `<input type="range">`.
 * Replaces Base UI Slider (which injects a `<script>` for SSR prehydration and
 * triggers React 19 client errors).
 */
export interface SliderProps {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  disabled?: boolean;
}

function Slider({
  className,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  disabled,
}: SliderProps) {
  const controlled = value !== undefined;
  const fromProps = value?.[0] ?? defaultValue?.[0] ?? min;
  const [uncontrolled, setUncontrolled] = React.useState(fromProps);

  const current = controlled ? (value![0] ?? min) : uncontrolled;

  React.useEffect(() => {
    if (!controlled && defaultValue?.[0] !== undefined) {
      setUncontrolled(defaultValue[0]);
    }
  }, [controlled, defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseFloat(e.target.value);
    if (!Number.isFinite(n)) return;
    if (!controlled) setUncontrolled(n);
    onValueChange?.([n]);
  };

  return (
    <div
      className={cn(
        "relative flex w-full touch-none items-center py-1.5",
        className
      )}
      data-slot="slider"
    >
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        disabled={disabled}
        onChange={handleChange}
        className={cn(
          "h-2 w-full cursor-pointer rounded-full bg-muted",
          "accent-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-ring [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm",
          "[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-ring [&::-moz-range-thumb]:bg-background"
        )}
      />
    </div>
  );
}

export { Slider };
