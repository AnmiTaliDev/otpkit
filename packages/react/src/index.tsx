import {
  OTP_DEFAULT_LABEL,
  createOtp,
  getCellView,
  type OtpType,
} from "@anmitalidev/otpkit-core"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react"

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
  const state = useSyncExternalStore(otp.subscribe, otp.getState, otp.getState)
  const cells = useRef<(HTMLInputElement | null)[]>([])

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

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    otp.input(index, event.target.value)
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (otp.keydown(index, event.key)) {
      event.preventDefault()
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    otp.paste(index, event.clipboardData.getData("text"))
  }

  function handleFocus(index: number, event: FocusEvent<HTMLInputElement>) {
    otp.focus(index)
    event.target.select()
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      otp.blur()
    }
  }

  const length = state.cells.length

  return (
    <div role="group" aria-label={props.ariaLabel ?? OTP_DEFAULT_LABEL} onBlur={handleBlur}>
      {state.cells.map((_, index) => {
        const view = getCellView(state, index, { length, type, mask, placeholder, disabled })
        return (
          <input
            key={index}
            ref={(node) => {
              cells.current[index] = node
            }}
            data-otp-cell=""
            data-filled={view.filled ? "" : undefined}
            data-focused={view.focused ? "" : undefined}
            data-invalid={view.invalid ? "" : undefined}
            data-disabled={view.disabled ? "" : undefined}
            type={view.type}
            inputMode={view.inputMode}
            autoComplete={view.autoComplete}
            maxLength={view.maxLength}
            aria-label={view.ariaLabel}
            placeholder={view.placeholder}
            disabled={view.disabled}
            value={view.value}
            onChange={(event) => handleChange(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => handleFocus(index, event)}
          />
        )
      })}
      {name ? <input type="hidden" name={name} value={otp.getValue()} /> : null}
    </div>
  )
}
