import {
  OTP_DEFAULT_LABEL,
  createOtp,
  getCellView,
  type OtpState,
  type OtpType,
} from "@anmitalidev/otpkit-core"
import { LitElement, html, nothing, type PropertyValues } from "lit"
import { ifDefined } from "lit/directives/if-defined.js"

export class OtpInput extends LitElement {
  static override properties = {
    length: { type: Number },
    value: { type: String },
    type: { type: String },
    disabled: { type: Boolean },
    autoFocus: { type: Boolean, attribute: "auto-focus" },
    mask: { type: Boolean },
    name: { type: String },
    placeholder: { type: String },
    snapshot: { state: true },
  }

  declare length: number
  declare value: string | undefined
  declare type: OtpType
  declare disabled: boolean
  declare autoFocus: boolean
  declare mask: boolean
  declare name: string | undefined
  declare placeholder: string | undefined
  declare snapshot: OtpState

  private readonly otp = createOtp({
    onChange: (value) => {
      this.value = value
      this.dispatchEvent(new CustomEvent("value-change", { detail: value, bubbles: true }))
    },
    onComplete: (value) => {
      this.dispatchEvent(new CustomEvent("complete", { detail: value, bubbles: true }))
    },
  })
  private unsubscribe: (() => void) | undefined

  constructor() {
    super()
    this.length = 6
    this.type = "numeric"
    this.disabled = false
    this.autoFocus = false
    this.mask = false
    this.snapshot = this.otp.getState()
  }

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute("role", "group")
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) {
      this.setAttribute("aria-label", OTP_DEFAULT_LABEL)
    }
    this.snapshot = this.otp.getState()
    this.unsubscribe = this.otp.subscribe((next) => {
      this.snapshot = next
    })
    this.addEventListener("focusout", this.handleFocusout)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.unsubscribe?.()
    this.removeEventListener("focusout", this.handleFocusout)
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("length") || changed.has("type")) {
      this.otp.setOptions({ length: this.length, type: this.type })
    }
    if (changed.has("value") && this.value !== undefined) {
      this.otp.setValue(this.value)
    }
  }

  protected override firstUpdated(): void {
    if (this.autoFocus) {
      this.cells()[0]?.focus()
    }
  }

  protected override updated(): void {
    const { focused, activeIndex } = this.snapshot
    const target = this.cells()[activeIndex]
    if (focused && target && document.activeElement !== target) {
      target.focus()
    }
  }

  private cells(): HTMLInputElement[] {
    return Array.from(this.querySelectorAll<HTMLInputElement>("[data-otp-cell]"))
  }

  private handleInput(index: number, event: Event): void {
    const element = event.currentTarget as HTMLInputElement
    this.otp.input(index, element.value)
    element.value = this.otp.getState().cells[index] ?? ""
  }

  private handleKeydown(index: number, event: KeyboardEvent): void {
    if (this.otp.keydown(index, event.key)) {
      event.preventDefault()
    }
  }

  private handlePaste(index: number, event: ClipboardEvent): void {
    event.preventDefault()
    this.otp.paste(index, event.clipboardData?.getData("text") ?? "")
  }

  private handleFocus(index: number, event: FocusEvent): void {
    this.otp.focus(index)
    ;(event.currentTarget as HTMLInputElement).select()
  }

  private readonly handleFocusout = (event: FocusEvent): void => {
    if (!this.contains(event.relatedTarget as Node | null)) {
      this.otp.blur()
    }
  }

  protected override render() {
    const length = this.snapshot.cells.length
    return html`${this.snapshot.cells.map((_, index) => {
      const view = getCellView(this.snapshot, index, {
        length,
        type: this.type,
        mask: this.mask,
        placeholder: this.placeholder,
        disabled: this.disabled,
      })
      return html`<input
        data-otp-cell=""
        data-filled=${view.filled ? "" : nothing}
        data-focused=${view.focused ? "" : nothing}
        data-invalid=${view.invalid ? "" : nothing}
        data-disabled=${view.disabled ? "" : nothing}
        type=${view.type}
        inputmode=${view.inputMode}
        autocomplete=${view.autoComplete}
        maxlength=${view.maxLength}
        aria-label=${view.ariaLabel}
        placeholder=${ifDefined(view.placeholder)}
        ?disabled=${view.disabled}
        .value=${view.value}
        @input=${(event: Event) => this.handleInput(index, event)}
        @keydown=${(event: KeyboardEvent) => this.handleKeydown(index, event)}
        @paste=${(event: ClipboardEvent) => this.handlePaste(index, event)}
        @focus=${(event: FocusEvent) => this.handleFocus(index, event)}
      />`
    })}${this.name
      ? html`<input type="hidden" name=${this.name} .value=${this.snapshot.cells.join("")} />`
      : nothing}`
  }
}

customElements.define("otp-input", OtpInput)

declare global {
  interface HTMLElementTagNameMap {
    "otp-input": OtpInput
  }
}
