"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  formatDecimalInput,
  formatIntegerInput,
  parseLocaleNumberString,
} from "@/lib/format/number-input";

type FormattedNumberInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  id: string;
  mode: "integer" | "decimal";
  maxDecimals?: number;
  placeholder?: string;
  className?: string;
};

function FormattedNumberInputInner({
  value,
  onChange,
  onBlur,
  inputRef,
  name,
  id,
  mode,
  maxDecimals,
  placeholder,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  onBlur: () => void;
  inputRef: React.Ref<HTMLInputElement>;
  name: string;
  id: string;
  mode: "integer" | "decimal";
  maxDecimals: number;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  const formatted =
    mode === "integer"
      ? formatIntegerInput(value)
      : formatDecimalInput(value, maxDecimals);

  const display = editing ? text : formatted;

  const startEditing = useCallback(() => {
    setEditing(true);
    if (Number.isFinite(value)) {
      setText(
        mode === "integer"
          ? String(Math.trunc(value))
          : String(value).replace(/,/g, "")
      );
    } else {
      setText("");
    }
  }, [value, mode]);

  const commit = useCallback(() => {
    const parsed = parseLocaleNumberString(text);
    if (parsed !== undefined) {
      onChange(mode === "integer" ? Math.round(parsed) : parsed);
    }
    setEditing(false);
    setText("");
  }, [text, mode, onChange]);

  return (
    <Input
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      inputMode={mode === "integer" ? "numeric" : "decimal"}
      autoComplete="off"
      className={className}
      placeholder={placeholder}
      value={display}
      onFocus={startEditing}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        const parsed = parseLocaleNumberString(next);
        if (parsed !== undefined) {
          onChange(mode === "integer" ? Math.round(parsed) : parsed);
        }
      }}
      onBlur={() => {
        commit();
        onBlur();
      }}
    />
  );
}

export function FormattedNumberInput<T extends FieldValues>({
  control,
  name,
  id,
  mode,
  maxDecimals = 2,
  placeholder,
  className,
}: FormattedNumberInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormattedNumberInputInner
          id={id}
          name={field.name}
          inputRef={field.ref}
          value={field.value as number}
          onChange={field.onChange}
          onBlur={field.onBlur}
          mode={mode}
          maxDecimals={maxDecimals}
          placeholder={placeholder}
          className={className}
        />
      )}
    />
  );
}
