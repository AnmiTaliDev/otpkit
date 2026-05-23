export type OtpType = "numeric" | "alphanumeric"

export type OtpMove = "left" | "right" | "start" | "end"

export type OtpState = {
  cells: string[]
  activeIndex: number
  invalidIndex: number | null
  focused: boolean
}

export type OtpUpdate = {
  length?: number
  type?: OtpType
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
}

export type OtpOptions = OtpUpdate & {
  value?: string
}

export type Otp = {
  getState: () => OtpState
  getValue: () => string
  input: (index: number, text: string) => void
  backspace: (index: number) => void
  paste: (index: number, text: string) => void
  move: (index: number, direction: OtpMove) => void
  keydown: (index: number, key: string) => boolean
  focus: (index: number) => void
  blur: () => void
  setValue: (value: string) => void
  setOptions: (options: OtpUpdate) => void
  subscribe: (listener: (state: OtpState) => void) => () => void
}

export type OtpCellConfig = {
  length: number
  type: OtpType
  mask?: boolean
  placeholder?: string
  disabled?: boolean
}

export type OtpCellView = {
  value: string
  type: "text" | "password"
  inputMode: "numeric" | "text"
  autoComplete: "one-time-code" | "off"
  maxLength: 1
  ariaLabel: string
  placeholder: string | undefined
  disabled: boolean
  filled: boolean
  focused: boolean
  invalid: boolean
}
