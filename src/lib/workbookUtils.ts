import type ExcelJS from 'exceljs'

/** exceljs represents a formula cell as {formula, result, ...} instead of a plain value. */
function unwrapCellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value
  if (typeof value === 'object') {
    if ('result' in value) return (value as { result: unknown }).result
    if ('richText' in value) {
      return (value as { richText: { text: string }[] }).richText.map((t) => t.text).join('')
    }
    if ('text' in value) return (value as { text: unknown }).text
  }
  return value
}

/** Row objects keyed by the workbook's own header text (trimmed), from row 2 onward. */
export function sheetToRows(worksheet: ExcelJS.Worksheet): Record<string, unknown>[] {
  const headerRow = worksheet.getRow(1)
  const headers: (string | null)[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const value = unwrapCellValue(cell.value)
    headers[colNumber] = typeof value === 'string' ? value.trim() : null
  })

  const rows: Record<string, unknown>[] = []
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    if (row.cellCount === 0) continue
    const obj: Record<string, unknown> = {}
    let hasValue = false
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber]
      if (!header) return
      const value = unwrapCellValue(cell.value)
      if (value !== null && value !== '') hasValue = true
      obj[header] = value
    })
    if (hasValue) rows.push(obj)
  }
  return rows
}

export function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  return str === '' ? null : str
}

export function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(num) ? null : num
}

export function asDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}
