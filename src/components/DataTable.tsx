import { ReactNode } from 'react'

interface Column<T> {
  key: keyof T | string
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (value: T[keyof T], row: T) => ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  emptyMessage?: string
  compact?: boolean
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = 'Nenhum dado encontrado',
  compact = false
}: DataTableProps<T>) {
  const getCellValue = (row: T, key: string): unknown => {
    if (key.includes('.')) {
      const keys = key.split('.')
      let value: unknown = row
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k]
      }
      return value
    }
    return row[key as keyof T]
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`
                  ${compact ? 'py-2 px-3' : 'py-3 px-4'}
                  text-xs font-semibold text-secondary-500 uppercase tracking-wider
                  ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                `}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-secondary-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={String(row[keyField])}
                className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors"
              >
                {columns.map((col) => {
                  const value = getCellValue(row, String(col.key))
                  return (
                    <td
                      key={String(col.key)}
                      className={`
                        ${compact ? 'py-2 px-3' : 'py-3 px-4'}
                        text-sm
                        ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                      `}
                    >
                      {col.render
                        ? col.render(value as T[keyof T], row)
                        : String(value ?? '-')}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable







