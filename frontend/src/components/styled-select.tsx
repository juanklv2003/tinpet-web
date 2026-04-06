import { useEffect, useMemo, useRef, useState } from 'react';

export interface StyledSelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  value: string;
  options: StyledSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
}

export function StyledSelect({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  className,
  menuClassName,
}: StyledSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const buttonClasses =
    className ??
    'w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 pr-10 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 transition text-left';

  const dropdownClasses =
    menuClassName ??
    'absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg';

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${buttonClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`.trim()}
      >
        <span className={selected ? '' : 'text-gray-400 dark:text-gray-500'}>
          {selected?.label ?? placeholder ?? 'Seleccionar'}
        </span>
      </button>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </span>

      {open && !disabled && (
        <ul className={dropdownClasses} role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
                      : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
