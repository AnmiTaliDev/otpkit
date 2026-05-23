import { describe, expect, it, vi } from "vitest"
import { createOtp } from "../src/index"

function typeAll(otp: ReturnType<typeof createOtp>, text: string, start = 0) {
  Array.from(text).forEach((char, offset) => otp.input(start + offset, char))
}

describe("createOtp", () => {
  it("starts empty with six cells by default", () => {
    const otp = createOtp()
    expect(otp.getState()).toEqual({
      cells: ["", "", "", "", "", ""],
      activeIndex: 0,
      invalidIndex: null,
      focused: false,
    })
    expect(otp.getValue()).toBe("")
  })

  it("accepts an initial value, dropping invalid characters and truncating", () => {
    expect(createOtp({ length: 4, value: "1a2345" }).getValue()).toBe("1234")
  })

  it("rejects a non-positive or fractional length", () => {
    expect(() => createOtp({ length: 0 })).toThrow(RangeError)
    expect(() => createOtp({ length: 2.5 })).toThrow(RangeError)
  })
})

describe("input", () => {
  it("fills the cell and moves to the next one", () => {
    const otp = createOtp()
    otp.input(0, "1")
    expect(otp.getState().cells[0]).toBe("1")
    expect(otp.getState().activeIndex).toBe(1)
  })

  it("keeps the last cell active after filling it", () => {
    const otp = createOtp({ length: 3 })
    otp.input(2, "9")
    expect(otp.getState().activeIndex).toBe(2)
  })

  it("replaces an existing character", () => {
    const otp = createOtp({ value: "123456" })
    otp.input(2, "9")
    expect(otp.getValue()).toBe("129456")
  })

  it("rejects letters in numeric mode and flags the cell", () => {
    const onChange = vi.fn()
    const otp = createOtp({ onChange })
    otp.input(0, "a")
    expect(otp.getValue()).toBe("")
    expect(otp.getState().activeIndex).toBe(0)
    expect(otp.getState().invalidIndex).toBe(0)
    expect(onChange).not.toHaveBeenCalled()
  })

  it("rejects symbols in alphanumeric mode", () => {
    const otp = createOtp({ type: "alphanumeric" })
    otp.input(0, "-")
    expect(otp.getState().invalidIndex).toBe(0)
  })

  it("accepts letters in alphanumeric mode", () => {
    const otp = createOtp({ type: "alphanumeric" })
    typeAll(otp, "aZ9")
    expect(otp.getValue()).toBe("aZ9")
  })

  it("clears the invalid flag on the next valid input", () => {
    const otp = createOtp()
    otp.input(0, "x")
    otp.input(0, "1")
    expect(otp.getState().invalidIndex).toBeNull()
  })

  it("clears the cell on empty text without moving", () => {
    const otp = createOtp({ value: "123456" })
    otp.input(3, "")
    expect(otp.getValue()).toBe("12356")
    expect(otp.getState().activeIndex).toBe(3)
  })

  it("treats multi-character text as paste", () => {
    const otp = createOtp()
    otp.input(0, "123456")
    expect(otp.getValue()).toBe("123456")
  })

  it("calls onChange with the joined value", () => {
    const onChange = vi.fn()
    const otp = createOtp({ onChange })
    typeAll(otp, "12")
    expect(onChange).toHaveBeenNthCalledWith(1, "1")
    expect(onChange).toHaveBeenNthCalledWith(2, "12")
  })

  it("does not call onChange when the character is unchanged", () => {
    const onChange = vi.fn()
    const otp = createOtp({ value: "123456", onChange })
    otp.input(0, "1")
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("backspace", () => {
  it("clears a filled cell and keeps focus on it", () => {
    const otp = createOtp({ value: "123456" })
    otp.backspace(3)
    expect(otp.getValue()).toBe("12356")
    expect(otp.getState().cells[3]).toBe("")
    expect(otp.getState().activeIndex).toBe(3)
  })

  it("moves back and clears the previous cell when empty", () => {
    const otp = createOtp({ value: "12" })
    otp.backspace(2)
    expect(otp.getState().cells.slice(0, 3)).toEqual(["1", "", ""])
    expect(otp.getState().activeIndex).toBe(1)
  })

  it("does nothing on an empty first cell", () => {
    const listener = vi.fn()
    const otp = createOtp()
    otp.subscribe(listener)
    otp.backspace(0)
    expect(listener).not.toHaveBeenCalled()
  })

  it("calls onChange after clearing", () => {
    const onChange = vi.fn()
    const otp = createOtp({ value: "12", onChange })
    otp.backspace(1)
    expect(onChange).toHaveBeenCalledWith("1")
  })
})

describe("paste", () => {
  it("distributes characters from the given cell onward", () => {
    const otp = createOtp()
    otp.paste(2, "12")
    expect(otp.getState().cells).toEqual(["", "", "1", "2", "", ""])
  })

  it("drops invalid characters", () => {
    const otp = createOtp()
    otp.paste(0, "1 2-3a4")
    expect(otp.getValue()).toBe("1234")
  })

  it("truncates to the remaining length", () => {
    const otp = createOtp({ length: 4 })
    otp.paste(2, "12345")
    expect(otp.getState().cells).toEqual(["", "", "1", "2"])
  })

  it("focuses the next empty cell", () => {
    const otp = createOtp()
    otp.paste(0, "123")
    expect(otp.getState().activeIndex).toBe(3)
  })

  it("focuses the last cell when everything is filled", () => {
    const otp = createOtp()
    otp.paste(0, "123456")
    expect(otp.getState().activeIndex).toBe(5)
  })

  it("flags the cell when no character is valid", () => {
    const otp = createOtp()
    otp.paste(1, "abc")
    expect(otp.getValue()).toBe("")
    expect(otp.getState().invalidIndex).toBe(1)
  })

  it("keeps alphanumeric characters in alphanumeric mode", () => {
    const otp = createOtp({ type: "alphanumeric", length: 4 })
    otp.paste(0, "a-b 1c")
    expect(otp.getValue()).toBe("ab1c")
  })
})

describe("move", () => {
  it("moves left and right within bounds", () => {
    const otp = createOtp({ length: 3 })
    otp.move(0, "left")
    expect(otp.getState().activeIndex).toBe(0)
    otp.move(0, "right")
    expect(otp.getState().activeIndex).toBe(1)
    otp.move(2, "right")
    expect(otp.getState().activeIndex).toBe(2)
  })

  it("moves to start and end", () => {
    const otp = createOtp()
    otp.move(3, "start")
    expect(otp.getState().activeIndex).toBe(0)
    otp.move(3, "end")
    expect(otp.getState().activeIndex).toBe(5)
  })

  it("does not change the value", () => {
    const otp = createOtp({ value: "123456" })
    otp.move(2, "left")
    expect(otp.getValue()).toBe("123456")
  })
})

describe("keydown", () => {
  it("handles backspace and navigation keys", () => {
    const otp = createOtp({ value: "12" })
    expect(otp.keydown(1, "Backspace")).toBe(true)
    expect(otp.getValue()).toBe("1")
    expect(otp.keydown(1, "ArrowRight")).toBe(true)
    expect(otp.getState().activeIndex).toBe(2)
    expect(otp.keydown(2, "ArrowLeft")).toBe(true)
    expect(otp.getState().activeIndex).toBe(1)
    expect(otp.keydown(1, "End")).toBe(true)
    expect(otp.getState().activeIndex).toBe(5)
    expect(otp.keydown(5, "Home")).toBe(true)
    expect(otp.getState().activeIndex).toBe(0)
  })

  it("ignores other keys", () => {
    const otp = createOtp()
    expect(otp.keydown(0, "a")).toBe(false)
    expect(otp.keydown(0, "Tab")).toBe(false)
  })
})

describe("focus", () => {
  it("tracks focus and clears the invalid flag", () => {
    const otp = createOtp()
    otp.input(0, "x")
    otp.focus(2)
    expect(otp.getState()).toMatchObject({ activeIndex: 2, focused: true, invalidIndex: null })
    otp.blur()
    expect(otp.getState().focused).toBe(false)
  })

  it("clears the invalid flag on blur", () => {
    const otp = createOtp()
    otp.input(0, "x")
    otp.blur()
    expect(otp.getState().invalidIndex).toBeNull()
  })
})

describe("onComplete", () => {
  it("fires once when all cells become filled", () => {
    const onComplete = vi.fn()
    const otp = createOtp({ length: 4, onComplete })
    typeAll(otp, "123")
    expect(onComplete).not.toHaveBeenCalled()
    otp.input(3, "4")
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith("1234")
  })

  it("fires on paste of a full code", () => {
    const onComplete = vi.fn()
    const otp = createOtp({ onComplete })
    otp.paste(0, "123456")
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith("123456")
  })

  it("does not fire again when the same value is re-entered", () => {
    const onComplete = vi.fn()
    const otp = createOtp({ length: 3, onComplete })
    typeAll(otp, "123")
    otp.input(2, "3")
    otp.paste(0, "123")
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("fires again after the value was cleared and completed again", () => {
    const onComplete = vi.fn()
    const otp = createOtp({ length: 3, onComplete })
    typeAll(otp, "123")
    otp.backspace(2)
    otp.input(2, "3")
    expect(onComplete).toHaveBeenCalledTimes(2)
  })

  it("fires again when a complete value is replaced by another complete value", () => {
    const onComplete = vi.fn()
    const otp = createOtp({ length: 3, onComplete })
    typeAll(otp, "123")
    otp.input(2, "4")
    expect(onComplete).toHaveBeenCalledTimes(2)
    expect(onComplete).toHaveBeenLastCalledWith("124")
  })

  it("does not fire for a complete initial value", () => {
    const onComplete = vi.fn()
    createOtp({ length: 3, value: "123", onComplete })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it("does not fire when the initial value is re-entered unchanged", () => {
    const onComplete = vi.fn()
    const otp = createOtp({ length: 3, value: "123", onComplete })
    otp.input(0, "1")
    expect(onComplete).not.toHaveBeenCalled()
  })
})

describe("setValue", () => {
  it("replaces cells without calling callbacks", () => {
    const onChange = vi.fn()
    const onComplete = vi.fn()
    const otp = createOtp({ length: 3, onChange, onComplete })
    otp.setValue("123")
    expect(otp.getValue()).toBe("123")
    expect(onChange).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it("does not notify when the value is unchanged", () => {
    const listener = vi.fn()
    const otp = createOtp({ value: "123456" })
    otp.subscribe(listener)
    otp.setValue("123456")
    expect(listener).not.toHaveBeenCalled()
  })

  it("lets onComplete fire after a controlled value was cleared and re-entered", () => {
    const onComplete = vi.fn()
    const otp = createOtp({ length: 3, onComplete })
    otp.setValue("123")
    otp.setValue("")
    typeAll(otp, "123")
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe("setOptions", () => {
  it("shrinks and grows the cells", () => {
    const otp = createOtp({ value: "123456" })
    otp.setOptions({ length: 4 })
    expect(otp.getState().cells).toEqual(["1", "2", "3", "4"])
    otp.setOptions({ length: 5 })
    expect(otp.getState().cells).toEqual(["1", "2", "3", "4", ""])
  })

  it("clamps the active index", () => {
    const otp = createOtp()
    otp.move(0, "end")
    otp.setOptions({ length: 3 })
    expect(otp.getState().activeIndex).toBe(2)
  })

  it("drops cells that become invalid after a type change", () => {
    const otp = createOtp({ type: "alphanumeric", length: 4 })
    typeAll(otp, "1a2b")
    otp.setOptions({ type: "numeric" })
    expect(otp.getState().cells).toEqual(["1", "", "2", ""])
  })

  it("replaces and clears callbacks", () => {
    const first = vi.fn()
    const second = vi.fn()
    const otp = createOtp({ onChange: first })
    otp.setOptions({ onChange: second })
    otp.input(0, "1")
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith("1")
    otp.setOptions({ onChange: undefined })
    otp.input(1, "2")
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("rejects an invalid length", () => {
    expect(() => createOtp().setOptions({ length: 0 })).toThrow(RangeError)
  })
})

describe("subscribe", () => {
  it("notifies with the new state and stops after unsubscribe", () => {
    const listener = vi.fn()
    const otp = createOtp()
    const unsubscribe = otp.subscribe(listener)
    otp.input(0, "1")
    expect(listener).toHaveBeenCalledWith(otp.getState())
    unsubscribe()
    otp.input(1, "2")
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("returns a new state object only when something changed", () => {
    const otp = createOtp()
    const before = otp.getState()
    otp.move(0, "start")
    expect(otp.getState()).toBe(before)
    otp.move(0, "right")
    expect(otp.getState()).not.toBe(before)
  })
})
