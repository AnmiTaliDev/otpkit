import { OTP_DEFAULT_LABEL, createOtp, getCellView, type OtpType } from "@anmitalidev/otpkit-core"
import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChildren,
} from "@angular/core"

@Component({
  selector: "otp-input",
  host: {
    role: "group",
    "[attr.aria-label]": "label()",
    "(focusout)": "onFocusout($event)",
  },
  template: `
    @for (view of views(); track $index; let index = $index) {
      <input
        #cell
        data-otp-cell=""
        [attr.data-filled]="view.filled ? '' : null"
        [attr.data-focused]="view.focused ? '' : null"
        [attr.data-invalid]="view.invalid ? '' : null"
        [attr.data-disabled]="view.disabled ? '' : null"
        [type]="view.type"
        [attr.inputmode]="view.inputMode"
        [attr.autocomplete]="view.autoComplete"
        [attr.maxlength]="view.maxLength"
        [attr.aria-label]="view.ariaLabel"
        [attr.placeholder]="view.placeholder ?? null"
        [disabled]="view.disabled"
        [value]="view.value"
        (input)="onInput(index, $event)"
        (keydown)="onKeydown(index, $event)"
        (paste)="onPaste(index, $event)"
        (focus)="onFocus(index, $event)"
      />
    }
    @if (name(); as inputName) {
      <input type="hidden" [name]="inputName" [value]="joined()" />
    }
  `,
})
export class OtpInput {
  readonly length = input(6, { transform: numberAttribute })
  readonly value = model("")
  readonly type = input<OtpType>("numeric")
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly autoFocus = input(false, { transform: booleanAttribute })
  readonly mask = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  readonly placeholder = input<string>()
  readonly label = input(OTP_DEFAULT_LABEL)
  readonly complete = output<string>()

  private readonly otp = createOtp({
    onChange: (value) => this.value.set(value),
    onComplete: (value) => this.complete.emit(value),
  })
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly document = inject(DOCUMENT)
  private readonly snapshot = signal(this.otp.getState())
  private readonly cells = viewChildren<ElementRef<HTMLInputElement>>("cell")

  protected readonly joined = computed(() => this.snapshot().cells.join(""))
  protected readonly views = computed(() => {
    const snapshot = this.snapshot()
    const config = {
      length: snapshot.cells.length,
      type: this.type(),
      mask: this.mask(),
      placeholder: this.placeholder(),
      disabled: this.disabled(),
    }
    return snapshot.cells.map((_, index) => getCellView(snapshot, index, config))
  })

  constructor() {
    inject(DestroyRef).onDestroy(this.otp.subscribe((next) => this.snapshot.set(next)))

    effect(() => {
      this.otp.setOptions({ length: this.length(), type: this.type() })
    })

    effect(() => {
      this.otp.setValue(this.value())
    })

    afterRenderEffect(() => {
      const { focused, activeIndex } = this.snapshot()
      const target = this.cells()[activeIndex]?.nativeElement
      if (focused && target && this.document.activeElement !== target) {
        target.focus()
      }
    })

    afterNextRender(() => {
      if (this.autoFocus()) {
        this.cells()[0]?.nativeElement.focus()
      }
    })
  }

  protected onInput(index: number, event: Event) {
    const element = event.target as HTMLInputElement
    this.otp.input(index, element.value)
    element.value = this.otp.getState().cells[index] ?? ""
  }

  protected onKeydown(index: number, event: KeyboardEvent) {
    if (this.otp.keydown(index, event.key)) {
      event.preventDefault()
    }
  }

  protected onPaste(index: number, event: ClipboardEvent) {
    event.preventDefault()
    this.otp.paste(index, event.clipboardData?.getData("text") ?? "")
  }

  protected onFocus(index: number, event: FocusEvent) {
    this.otp.focus(index)
    ;(event.target as HTMLInputElement).select()
  }

  protected onFocusout(event: FocusEvent) {
    if (!this.host.nativeElement.contains(event.relatedTarget as Node | null)) {
      this.otp.blur()
    }
  }
}
