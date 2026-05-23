import { describe, expect, it } from "vitest"
import { createOtp, getCellView } from "../src/index"

describe("getCellView", () => {
  it("describes a numeric cell", () => {
    const otp = createOtp({ value: "12" })
    expect(getCellView(otp.getState(), 0, { length: 6, type: "numeric" })).toEqual({
      value: "1",
      type: "text",
      inputMode: "numeric",
      autoComplete: "one-time-code",
      maxLength: 1,
      ariaLabel: "Digit 1 of 6",
      placeholder: undefined,
      disabled: false,
      filled: true,
      focused: false,
      invalid: false,
    })
  })

  it("uses off autocomplete on cells after the first", () => {
    const otp = createOtp()
    expect(getCellView(otp.getState(), 1, { length: 6, type: "numeric" }).autoComplete).toBe("off")
  })

  it("describes an alphanumeric masked cell", () => {
    const otp = createOtp({ type: "alphanumeric" })
    const view = getCellView(otp.getState(), 2, {
      length: 4,
      type: "alphanumeric",
      mask: true,
      placeholder: "-",
      disabled: true,
    })
    expect(view).toMatchObject({
      type: "password",
      inputMode: "text",
      ariaLabel: "Character 3 of 4",
      placeholder: "-",
      disabled: true,
      filled: false,
    })
  })

  it("reports focus and invalid flags from the state", () => {
    const otp = createOtp()
    otp.focus(1)
    otp.input(1, "x")
    const config = { length: 6, type: "numeric" } as const
    expect(getCellView(otp.getState(), 1, config)).toMatchObject({ focused: true, invalid: true })
    expect(getCellView(otp.getState(), 0, config)).toMatchObject({ focused: false, invalid: false })
  })
})
