import {
  OTP_DEFAULT_LABEL,
  createOtp,
  getCellView,
  type OtpType,
} from "@anmitalidev/otpkit-core"
import type {
  TargetedClipboardEvent,
  TargetedFocusEvent,
  TargetedInputEvent,
  TargetedKeyboardEvent,
} from "preact"
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks"

export type OtpInputProps = {
  length?: number
  value?: string
  defaultValue?: string
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

export function OtpInput(props: OtpInputProps) {
  const { value, type = "numeric", disabled, autoFocus, mask, name, placeholder } = props
  const [otp] = useState(() =>
    createOtp({
      length: props.length,
      type,
      value: props.value ?? props.defaultValue,
      onChange: props.onChange,
      onComplete: props.onComplete,
    }),
  )
  const [state, setState] = useState(otp.getState())
  const cells = useRef<(HTMLInputElement | null)[]>([])

  useLayoutEffect(() => {
    setState(otp.getState())
    return otp.subscribe(setState)
  }, [otp])

  useLayoutEffect(() => {
    otp.setOptions({
      length: props.length,
      type,
      onChange: props.onChange,
      onComplete: props.onComplete,
    })
    if (value !== undefined) {
      otp.setValue(value)
    }
  })

  useLayoutEffect(() => {
    if (!state.focused) {
      return
    }
    const target = cells.current[state.activeIndex]
    if (target && document.activeElement !== target) {
      target.focus()
    }
  }, [state.focused, state.activeIndex])

  useEffect(() => {
    if (autoFocus) {
      cells.current[0]?.focus()
    }
  }, [])

  function handleInput(index: number, event: TargetedInputEvent<HTMLInputElement>) {
    otp.input(index, event.currentTarget.value)
    event.currentTarget.value = otp.getState().cells[index] ?? ""
  }

  function handleKeyDown(index: number, event: TargetedKeyboardEvent<HTMLInputElement>) {
    if (otp.keydown(index, event.key)) {
      event.preventDefault()
    }
  }

  function handlePaste(index: number, event: TargetedClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    otp.paste(index, event.clipboardData?.getData("text") ?? "")
  }

  function handleFocus(index: number, event: TargetedFocusEvent<HTMLInputElement>) {
    otp.focus(index)
    event.currentTarget.select()
  }

  function handleBlur(event: TargetedFocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      otp.blur()
    }
  }

  const length = state.cells.length

  return (
    <div role="group" aria-label={props.ariaLabel ?? OTP_DEFAULT_LABEL} onFocusOut={handleBlur}>
      {state.cells.map((_, index) => {
        const view = getCellView(state, index, { length, type, mask, placeholder, disabled })
        const shared = {
          key: index,
          ref: (node: HTMLInputElement | null) => {
            cells.current[index] = node
          },
          "data-otp-cell": "",
          "data-filled": view.filled ? "" : undefined,
          "data-focused": view.focused ? "" : undefined,
          "data-invalid": view.invalid ? "" : undefined,
          "data-disabled": view.disabled ? "" : undefined,
          inputMode: view.inputMode,
          autoComplete: view.autoComplete,
          maxLength: view.maxLength,
          "aria-label": view.ariaLabel,
          placeholder: view.placeholder,
          disabled: view.disabled,
          value: view.value,
          onInput: (event: TargetedInputEvent<HTMLInputElement>) => handleInput(index, event),
          onKeyDown: (event: TargetedKeyboardEvent<HTMLInputElement>) => handleKeyDown(index, event),
          onPaste: (event: TargetedClipboardEvent<HTMLInputElement>) => handlePaste(index, event),
          onFocus: (event: TargetedFocusEvent<HTMLInputElement>) => handleFocus(index, event),
        }
        return view.type === "password" ? (
          <input {...shared} type="password" />
        ) : (
          <input {...shared} />
        )
      })}
      {name ? <input type="hidden" name={name} value={otp.getValue()} /> : null}
    </div>
  )
}
