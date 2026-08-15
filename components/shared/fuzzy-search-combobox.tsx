"use client";

import * as React from "react";
import { rankBySearch } from "@/lib/search/fuzzy-match";

export type FuzzySearchOption = {
  id: string;
  label: string;
};

type FuzzySearchComboboxProps = {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect?: (option: FuzzySearchOption) => void;
  options: FuzzySearchOption[];
  placeholder?: string;
  disabled?: boolean;
  maxSuggestions?: number;
  emptyLabel?: string;
  className: string;
};

export function FuzzySearchCombobox({
  id,
  value,
  onValueChange,
  onSelect,
  options,
  placeholder,
  disabled,
  maxSuggestions = 6,
  emptyLabel = "Tidak ada hasil",
  className,
}: FuzzySearchComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const suggestions = React.useMemo(() => {
    return rankBySearch(value, options, (option) => [option.label]).slice(0, maxSuggestions);
  }, [value, options, maxSuggestions]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectOption(option: FuzzySearchOption) {
    onSelect?.(option);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (suggestions.length === 0) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = suggestions[highlightedIndex] ?? suggestions[0];
      if (option) {
        selectOption(option);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          setHighlightedIndex(0);
          setIsOpen(true);
        }}
        onFocus={() => {
          setHighlightedIndex(0);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        className={className}
      />
      {isOpen && !disabled ? (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-lg"
        >
          {suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{emptyLabel}</p>
          ) : (
            suggestions.map((option, index) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150 ${
                  index === highlightedIndex
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
