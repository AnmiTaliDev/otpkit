import type { OtpType } from "./types"

const patterns: Record<OtpType, RegExp> = {
  numeric: /^[0-9]$/,
  alphanumeric: /^[0-9A-Za-z]$/,
}

export function isValidChar(type: OtpType, char: string): boolean {
  return patterns[type].test(char)
}

export function filterChars(type: OtpType, text: string): string[] {
  return Array.from(text).filter((char) => isValidChar(type, char))
}

export function fillCells(length: number, type: OtpType, text: string): string[] {
  const chars = filterChars(type, text).slice(0, length)
  const cells: string[] = []
  for (let i = 0; i < length; i++) {
    cells.push(chars[i] ?? "")
  }
  return cells
}

export function reshapeCells(cells: string[], length: number, type: OtpType): string[] {
  const next: string[] = []
  for (let i = 0; i < length; i++) {
    const cell = cells[i] ?? ""
    next.push(isValidChar(type, cell) ? cell : "")
  }
  return next
}

export function isComplete(cells: string[]): boolean {
  return cells.every((cell) => cell !== "")
}

export function sameCells(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((cell, i) => cell === b[i])
}
