import { NA } from './NA';

export function Row({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
}) {
  return (
    <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-800 py-2.5 gap-4">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-white text-right">
        {value ?? <NA label={placeholder ?? '---'} />}
      </span>
    </div>
  );
}
