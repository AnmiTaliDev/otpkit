import {
  OTP_DEFAULT_LABEL,
  createOtp,
  getCellView,
  type OtpType,
} from "@anmitalidev/otpkit-core"
import { Index, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js"

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
  const otp = createOtp({
    length: props.length,
    type: props.type,
    value: props.value ?? props.defaultValue,
    onChange: props.onChange,
    onComplete: props.onComplete,
  })
  const [state, setState] = createSignal(otp.getState())
  const cells: (HTMLInputElement | undefined)[] = []

  onCleanup(otp.subscribe(setState))

  createEffect(() => {
    otp.setOptions({
      length: props.length,
      type: props.type ?? "numeric",
      onChange: props.onChange,
      onComplete: props.onComplete,
    })
  })

  createEffect(() => {
    const value = props.value
    if (value !== undefined) {
      otp.setValue(value)
    }
  })

  createEffect(() => {
    const { focused, activeIndex } = state()
    if (!focused) {
      return
    }
    const target = cells[activeIndex]
    if (target && document.activeElement !== target) {
      target.focus()
    }
  })

  onMount(() => {
    if (props.autoFocus) {
      cells[0]?.focus()
    }
  })

  function handleBlur(event: FocusEvent & { currentTarget: HTMLDivElement }) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      otp.blur()
    }
  }

  return (
    <div role="group" aria-label={props.ariaLabel ?? OTP_DEFAULT_LABEL} onFocusOut={handleBlur}>
      <Index each={state().cells}>
        {(_, index) => {
          const view = () =>
            getCellView(state(), index, {
              length: state().cells.length,
              type: props.type ?? "numeric",
              mask: props.mask,
              placeholder: props.placeholder,
              disabled: props.disabled,
            })
          return (
            <input
              ref={(element) => {
                cells[index] = element
              }}
              data-otp-cell=""
              data-filled={view().filled ? "" : undefined}
              data-focused={view().focused ? "" : undefined}
              data-invalid={view().invalid ? "" : undefined}
              data-disabled={view().disabled ? "" : undefined}
              type={view().type}
              inputMode={view().inputMode}
              autocomplete={view().autoComplete}
              maxLength={view().maxLength}
              aria-label={view().ariaLabel}
              placeholder={view().placeholder}
              disabled={view().disabled}
              value={view().value}
              onInput={(event) => {
                otp.input(index, event.currentTarget.value)
                event.currentTarget.value = otp.getState().cells[index] ?? ""
              }}
              onKeyDown={(event) => {
                if (otp.keydown(index, event.key)) {
                  event.preventDefault()
                }
              }}
              onPaste={(event) => {
                event.preventDefault()
                otp.paste(index, event.clipboardData?.getData("text") ?? "")
              }}
              onFocus={(event) => {
                otp.focus(index)
                event.currentTarget.select()
              }}
            />
          )
        }}
      </Index>
      <Show when={props.name}>
        <input type="hidden" name={props.name} value={state().cells.join("")} />
      </Show>
    </div>
  )
}
