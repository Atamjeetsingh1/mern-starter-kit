/**
 * components/Input.jsx
 * Reusable, accessible form input with label, error, and helper text.
 *
 * Usage:
 *   <Input
 *     label="Email"
 *     type="email"
 *     name="email"
 *     value={value}
 *     onChange={handleChange}
 *     error="Invalid email"
 *   />
 */

import React, { useId } from "react";

const Input = ({
  label,
  name,
  type        = "text",
  placeholder = "",
  value,
  onChange,
  error,
  helperText,
  required   = false,
  disabled   = false,
  autoComplete,
  className  = "",
  ...rest
}) => {
  // Generate a stable ID even when `name` is not unique on the page
  const generatedId = useId();
  const inputId     = `input-${name ?? generatedId}`;
  const errorId     = `${inputId}-error`;
  const helperId    = `${inputId}-helper`;

  const inputClasses = [
    "block w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-sm",
    "placeholder:text-gray-400",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "transition-colors duration-150",
    "disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400",
    error
      ? "border-red-400 focus:border-red-400 focus:ring-red-300"
      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Input */}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={
          [error && errorId, helperText && helperId].filter(Boolean).join(" ") || undefined
        }
        className={inputClasses}
        {...rest}
      />

      {/* Error message */}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;