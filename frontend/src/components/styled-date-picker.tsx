import { useEffect, useMemo, useRef, useState } from 'react';

interface StyledDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDisplayDate(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return '';
  return parsed.toLocaleDateString('es-ES');
}

export function StyledDatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  className,
}: StyledDatePickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const [cursorDate, setCursorDate] = useState<Date>(selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) {
      setCursorDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const firstDayOfMonth = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
  const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;

  const daysGrid = useMemo(() => {
    const days: Date[] = [];

    const startDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1 - startWeekday);
    for (let i = 0; i < 42; i += 1) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }

    return days;
  }, [cursorDate, startWeekday]);

  const baseInputClass =
    className ??
    'w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 transition text-left';

  const todayIso = toIsoDate(new Date());

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${baseInputClass} flex items-center justify-between`}
      >
        <span className={value ? '' : 'text-gray-400 dark:text-gray-500'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <svg
          className="h-4 w-4 text-gray-500 dark:text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full z-50 mb-2 w-[15.5rem] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 shadow-xl">
          <div className="mb-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursorDate(new Date(cursorDate.getFullYear(), cursorDate.getMonth() - 1, 1))}
              className="rounded-md p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Mes anterior"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <p className="text-[0.92rem] font-semibold text-gray-900 dark:text-white capitalize">
              {MONTHS_ES[cursorDate.getMonth()]} de {cursorDate.getFullYear()}
            </p>

            <button
              type="button"
              onClick={() => setCursorDate(new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 1))}
              className="rounded-md p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Mes siguiente"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-[0.72rem] font-semibold text-gray-500 dark:text-gray-400">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="py-0.5">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {daysGrid.map((day) => {
              const iso = toIsoDate(day);
              const isCurrentMonth = day.getMonth() === cursorDate.getMonth();
              const isSelected = value === iso;
              const isToday = todayIso === iso;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`h-7 rounded-md text-[0.9rem] transition-colors ${
                    isSelected
                      ? 'bg-pink-500 text-white'
                      : isCurrentMonth
                      ? 'text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800'
                      : 'text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800'
                  } ${isToday && !isSelected ? 'ring-1 ring-pink-300 dark:ring-pink-700' : ''}`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Borrar
            </button>

            <button
              type="button"
              onClick={() => {
                onChange(todayIso);
                setOpen(false);
              }}
              className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
