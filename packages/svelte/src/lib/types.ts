import type { OtpType } from "@anmitalidev/otpkit-core"

export type OtpInputProps = {
  length?: number
  value?: string
  type?: OtpType
  disabled?: boolean
  autoFocus?: boolean
  mask?: boolean
  name?: string
  placeholder?: string
  ariaLabel?: string
  onchange?: (value: string) => void
  oncomplete?: (value: string) => void
}
