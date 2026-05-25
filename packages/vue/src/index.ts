import {
  OTP_DEFAULT_LABEL,
  createOtp,
  getCellView,
  type OtpType,
} from "@anmitalidev/otpkit-core"
import { defineComponent, h, onBeforeUnmount, onMounted, shallowRef, watch, type PropType } from "vue"

export const OtpInput = defineComponent({
  name: "OtpInput",
  props: {
    length: Number,
    modelValue: String,
    type: String as PropType<OtpType>,
    disabled: Boolean,
    autoFocus: Boolean,
    mask: Boolean,
    name: String,
    placeholder: String,
    ariaLabel: String,
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
    change: (value: string) => typeof value === "string",
    complete: (value: string) => typeof value === "string",
  },
  setup(props, { emit }) {
    const otp = createOtp({
      length: props.length,
      type: props.type,
      value: props.modelValue,
      onChange: (value) => {
        emit("update:modelValue", value)
        emit("change", value)
      },
      onComplete: (value) => emit("complete", value),
    })
    const state = shallowRef(otp.getState())
    const cells: (HTMLInputElement | null)[] = []
    let unsubscribe: (() => void) | undefined

    onMounted(() => {
      state.value = otp.getState()
      unsubscribe = otp.subscribe((next) => {
        state.value = next
      })
      if (props.autoFocus) {
        cells[0]?.focus()
      }
    })

    onBeforeUnmount(() => {
      unsubscribe?.()
    })

    watch(
      () => [props.length, props.type] as const,
      ([length, type]) => otp.setOptions({ length, type: type ?? "numeric" }),
    )

    watch(
      () => props.modelValue,
      (value) => {
        if (value !== undefined) {
          otp.setValue(value)
        }
      },
    )

    watch(
      state,
      ({ focused, activeIndex }) => {
        const target = cells[activeIndex]
        if (focused && target && document.activeElement !== target) {
          target.focus()
        }
      },
      { flush: "post" },
    )

    function handleInput(index: number, event: Event) {
      const element = event.target as HTMLInputElement
      otp.input(index, element.value)
      element.value = otp.getState().cells[index] ?? ""
    }

    function handleKeydown(index: number, event: KeyboardEvent) {
      if (otp.keydown(index, event.key)) {
        event.preventDefault()
      }
    }

    function handlePaste(index: number, event: ClipboardEvent) {
      event.preventDefault()
      otp.paste(index, event.clipboardData?.getData("text") ?? "")
    }

    function handleFocus(index: number, event: FocusEvent) {
      otp.focus(index)
      ;(event.target as HTMLInputElement).select()
    }

    function handleFocusout(event: FocusEvent) {
      if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
        otp.blur()
      }
    }

    return () => {
      const current = state.value
      const length = current.cells.length
      const type = props.type ?? "numeric"
      const children = current.cells.map((_, index) => {
        const view = getCellView(current, index, {
          length,
          type,
          mask: props.mask,
          placeholder: props.placeholder,
          disabled: props.disabled,
        })
        return h("input", {
          key: index,
          ref: (element: unknown) => {
            cells[index] = element as HTMLInputElement | null
          },
          "data-otp-cell": "",
          "data-filled": view.filled ? "" : undefined,
          "data-focused": view.focused ? "" : undefined,
          "data-invalid": view.invalid ? "" : undefined,
          "data-disabled": view.disabled ? "" : undefined,
          type: view.type,
          inputmode: view.inputMode,
          autocomplete: view.autoComplete,
          maxlength: view.maxLength,
          "aria-label": view.ariaLabel,
          placeholder: view.placeholder,
          disabled: view.disabled,
          value: view.value,
          onInput: (event: Event) => handleInput(index, event),
          onKeydown: (event: KeyboardEvent) => handleKeydown(index, event),
          onPaste: (event: ClipboardEvent) => handlePaste(index, event),
          onFocus: (event: FocusEvent) => handleFocus(index, event),
        })
      })
      if (props.name) {
        children.push(h("input", { type: "hidden", name: props.name, value: otp.getValue() }))
      }
      return h(
        "div",
        {
          role: "group",
          "aria-label": props.ariaLabel ?? OTP_DEFAULT_LABEL,
          onFocusout: handleFocusout,
        },
        children,
      )
    }
  },
})
