"use client";

import * as React from "react";

export function AmountInput({
  id,
  name,
  defaultValue,
  disabled,
  className,
}: {
  id: string;
  name: string;
  defaultValue?: number;
  disabled?: boolean;
  className: string;
}) {
  const [display, setDisplay] = React.useState(() =>
    formatDigits(defaultValue ? String(defaultValue) : ""),
  );

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDisplay(formatDigits(event.target.value));
  }

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={handleChange}
      disabled={disabled}
      placeholder="0"
      className={className}
    />
  );
}

function formatDigits(value: string): string {
  const digitsOnly = value.replace(/[^0-9]/g, "");
  if (digitsOnly === "") {
    return "";
  }
  return new Intl.NumberFormat("id-ID").format(Number(digitsOnly));
}
