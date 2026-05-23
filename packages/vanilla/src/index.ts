import {
  OTP_DEFAULT_LABEL,
  createOtp,
  getCellView,
  type OtpState,
  type OtpType,
} from "@anmitalidev/otpkit-core"

export type OtpInputOptions = {
  length?: number
  value?: string
  type?: OtpType
  disabled?: boolean
  autoFocus?: boolean
  mask?: boolean
  name?: string
  placeholder?: string
  ariaLabel?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
}

export type OtpInputHandle = {
  update: (options: OtpInputOptions) => void
  destroy: () => void
}

function setFlag(element: HTMLElement, name: string, on: boolean): void {
  if (on) {
    element.setAttribute(name, "")
  } else {
    element.removeAttribute(name)
  }
}

export function createOtpInput(container: HTMLElement, initial: OtpInputOptions = {}): OtpInputHandle {
  let options: OtpInputOptions = { ...initial }
  const otp = createOtp(options)
  const root = document.createElement("div")
  root.setAttribute("role", "group")
  let cells: HTMLInputElement[] = []
  let hidden: HTMLInputElement | null = null

  function cellConfig() {
    const state = otp.getState()
    return {
      length: state.cells.length,
      type: options.type ?? "numeric",
      mask: options.mask,
      placeholder: options.placeholder,
      disabled: options.disabled,
    }
  }

  function renderCell(input: HTMLInputElement, state: OtpState, index: number): void {
    const view = getCellView(state, index, cellConfig())
    input.type = view.type
    input.inputMode = view.inputMode
    input.autocomplete = view.autoComplete
    input.maxLength = view.maxLength
    input.disabled = view.disabled
    input.placeholder = view.placeholder ?? ""
    input.setAttribute("aria-label", view.ariaLabel)
    if (input.value !== view.value) {
      input.value = view.value
    }
    setFlag(input, "data-filled", view.filled)
    setFlag(input, "data-focused", view.focused)
    setFlag(input, "data-invalid", view.invalid)
    setFlag(input, "data-disabled", view.disabled)
  }

  function render(state: OtpState): void {
    root.setAttribute("aria-label", options.ariaLabel ?? OTP_DEFAULT_LABEL)
    cells.forEach((input, index) => renderCell(input, state, index))
    if (hidden) {
      hidden.value = otp.getValue()
    }
    if (state.focused) {
      const target = cells[state.activeIndex]
      if (target && document.activeElement !== target) {
        target.focus()
      }
    }
  }

  function createCell(index: number): HTMLInputElement {
    const input = document.createElement("input")
    input.setAttribute("data-otp-cell", "")
    input.addEventListener("input", () => {
      otp.input(index, input.value)
      input.value = otp.getState().cells[index] ?? ""
    })
    input.addEventListener("keydown", (event) => {
      if (otp.keydown(index, event.key)) {
        event.preventDefault()
      }
    })
    input.addEventListener("paste", (event) => {
      event.preventDefault()
      otp.paste(index, event.clipboardData?.getData("text") ?? "")
    })
    input.addEventListener("focus", () => {
      otp.focus(index)
      input.select()
    })
    input.addEventListener("blur", (event) => {
      if (!root.contains(event.relatedTarget as Node | null)) {
        otp.blur()
      }
    })
    return input
  }

  function build(): void {
    const length = otp.getState().cells.length
    cells.forEach((input) => input.remove())
    cells = Array.from({ length }, (_, index) => createCell(index))
    root.prepend(...cells)
  }

  function syncHidden(): void {
    if (options.name && !hidden) {
      hidden = document.createElement("input")
      hidden.type = "hidden"
      root.append(hidden)
    } else if (!options.name && hidden) {
      hidden.remove()
      hidden = null
    }
    if (hidden) {
      hidden.name = options.name ?? ""
    }
  }

  const unsubscribe = otp.subscribe(render)
  build()
  syncHidden()
  render(otp.getState())
  container.append(root)
  if (options.autoFocus) {
    cells[0]?.focus()
  }

  function update(next: OtpInputOptions): void {
    const previousLength = otp.getState().cells.length
    options = { ...options, ...next }
    otp.setOptions({
      length: options.length,
      type: options.type,
      onChange: options.onChange,
      onComplete: options.onComplete,
    })
    if (next.value !== undefined) {
      otp.setValue(next.value)
    }
    if (otp.getState().cells.length !== previousLength) {
      build()
    }
    syncHidden()
    render(otp.getState())
  }

  function destroy(): void {
    unsubscribe()
    root.remove()
  }

  return { update, destroy }
}
