// Componentes simples sin JSX complejo
export function NA({ label }: { label?: string }) {
  return <span className="text-gray-500 dark:text-gray-400 text-sm">{label ?? '---'}</span>;
}
