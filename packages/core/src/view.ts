import type { OtpCellConfig, OtpCellView, OtpState } from "./types"

export const OTP_DEFAULT_LABEL = "One-time code"

export function getCellView(state: OtpState, index: number, config: OtpCellConfig): OtpCellView {
  const value = state.cells[index] ?? ""
  const noun = config.type === "numeric" ? "Digit" : "Character"
  return {
    value,
    type: config.mask ? "password" : "text",
    inputMode: config.type === "numeric" ? "numeric" : "text",
    autoComplete: index === 0 ? "one-time-code" : "off",
    maxLength: 1,
    ariaLabel: `${noun} ${index + 1} of ${config.length}`,
    placeholder: config.placeholder,
    disabled: config.disabled ?? false,
    filled: value !== "",
    focused: state.focused && state.activeIndex === index,
    invalid: state.invalidIndex === index,
  }
}
