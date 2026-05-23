import { fillCells, filterChars, isComplete, isValidChar, reshapeCells, sameCells } from "./chars"
import type { Otp, OtpMove, OtpOptions, OtpState, OtpType, OtpUpdate } from "./types"

const DEFAULT_LENGTH = 6

function readLength(length: number | undefined): number {
  const value = length ?? DEFAULT_LENGTH
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`otp length must be a positive integer, received ${String(length)}`)
  }
  return value
}

function targetIndex(index: number, direction: OtpMove, length: number): number {
  switch (direction) {
    case "left":
      return Math.max(0, index - 1)
    case "right":
      return Math.min(length - 1, index + 1)
    case "start":
      return 0
    case "end":
      return length - 1
  }
}

const moveKeys: Record<string, OtpMove> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  Home: "start",
  End: "end",
}

export function createOtp(options: OtpOptions = {}): Otp {
  let length = readLength(options.length)
  let type: OtpType = options.type ?? "numeric"
  let onChange = options.onChange
  let onComplete = options.onComplete
  const listeners = new Set<(state: OtpState) => void>()

  let state: OtpState = {
    cells: fillCells(length, type, options.value ?? ""),
    activeIndex: 0,
    invalidIndex: null,
    focused: false,
  }
  let completedValue: string | null = isComplete(state.cells) ? state.cells.join("") : null

  function update(patch: Partial<OtpState>): void {
    const next = { ...state, ...patch }
    if (
      next.cells === state.cells &&
      next.activeIndex === state.activeIndex &&
      next.invalidIndex === state.invalidIndex &&
      next.focused === state.focused
    ) {
      return
    }
    state = next
    for (const listener of [...listeners]) {
      listener(state)
    }
  }

  function replace(cells: string[], patch: Partial<OtpState>): void {
    completedValue = isComplete(cells) ? cells.join("") : null
    update({ ...patch, cells: sameCells(cells, state.cells) ? state.cells : cells })
  }

  function commit(cells: string[], patch: Partial<OtpState>): void {
    const previous = state.cells.join("")
    const value = cells.join("")
    update({ ...patch, cells: sameCells(cells, state.cells) ? state.cells : cells })
    if (value !== previous) {
      onChange?.(value)
    }
    if (!isComplete(cells)) {
      completedValue = null
    } else if (value !== completedValue) {
      completedValue = value
      onComplete?.(value)
    }
  }

  function input(index: number, text: string): void {
    if (Array.from(text).length > 1) {
      paste(index, text)
      return
    }
    const cells = state.cells.slice()
    if (text === "") {
      cells[index] = ""
      commit(cells, { activeIndex: index, invalidIndex: null })
      return
    }
    if (!isValidChar(type, text)) {
      update({ activeIndex: index, invalidIndex: index })
      return
    }
    cells[index] = text
    commit(cells, { activeIndex: Math.min(length - 1, index + 1), invalidIndex: null })
  }

  function backspace(index: number): void {
    const cells = state.cells.slice()
    if (cells[index] !== "") {
      cells[index] = ""
      commit(cells, { activeIndex: index, invalidIndex: null })
    } else if (index > 0) {
      cells[index - 1] = ""
      commit(cells, { activeIndex: index - 1, invalidIndex: null })
    }
  }

  function paste(index: number, text: string): void {
    const chars = filterChars(type, text).slice(0, length - index)
    if (chars.length === 0) {
      update({ activeIndex: index, invalidIndex: index })
      return
    }
    const cells = state.cells.slice()
    chars.forEach((char, offset) => {
      cells[index + offset] = char
    })
    const nextEmpty = cells.findIndex((cell, i) => i >= index && cell === "")
    commit(cells, { activeIndex: nextEmpty === -1 ? length - 1 : nextEmpty, invalidIndex: null })
  }

  function move(index: number, direction: OtpMove): void {
    update({ activeIndex: targetIndex(index, direction, length), invalidIndex: null })
  }

  function keydown(index: number, key: string): boolean {
    if (key === "Backspace") {
      backspace(index)
      return true
    }
    const direction = moveKeys[key]
    if (direction === undefined) {
      return false
    }
    move(index, direction)
    return true
  }

  function focus(index: number): void {
    update({ activeIndex: index, invalidIndex: null, focused: true })
  }

  function blur(): void {
    update({ invalidIndex: null, focused: false })
  }

  function setValue(value: string): void {
    replace(fillCells(length, type, value), { invalidIndex: null })
  }

  function setOptions(next: OtpUpdate): void {
    if ("onChange" in next) {
      onChange = next.onChange
    }
    if ("onComplete" in next) {
      onComplete = next.onComplete
    }
    const nextLength = next.length === undefined ? length : readLength(next.length)
    const nextType = next.type ?? type
    if (nextLength === length && nextType === type) {
      return
    }
    length = nextLength
    type = nextType
    replace(reshapeCells(state.cells, length, type), {
      activeIndex: Math.min(state.activeIndex, length - 1),
      invalidIndex: null,
    })
  }

  function subscribe(listener: (state: OtpState) => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return {
    getState: () => state,
    getValue: () => state.cells.join(""),
    input,
    backspace,
    paste,
    move,
    keydown,
    focus,
    blur,
    setValue,
    setOptions,
    subscribe,
  }
}
