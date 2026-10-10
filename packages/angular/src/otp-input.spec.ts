import { Component, signal } from "@angular/core"
import { TestBed, type ComponentFixture } from "@angular/core/testing"
import userEvent from "@testing-library/user-event"
import { OtpInput } from "./otp-input"

@Component({
  selector: "otp-host",
  imports: [OtpInput],
  template: `
    <otp-input
      [length]="length()"
      [type]="type()"
      [mask]="mask()"
      [disabled]="disabled()"
      [autoFocus]="true"
      name="code"
      [(value)]="code"
      (complete)="completed.push($event)"
    />
    <button (click)="code.set('')">reset</button>
  `,
})
class Host {
  readonly length = signal(4)
  readonly type = signal<"numeric" | "alphanumeric">("numeric")
  readonly mask = signal(false)
  readonly disabled = signal(false)
  readonly code = signal("")
  readonly completed: string[] = []
}

let fixture: ComponentFixture<Host>

function root(): HTMLElement {
  return fixture.nativeElement.querySelector("otp-input")
}

function cells(): HTMLInputElement[] {
  return Array.from(root().querySelectorAll<HTMLInputElement>("[data-otp-cell]"))
}

function values(): string[] {
  return cells().map((input) => input.value)
}

async function mount() {
  fixture = TestBed.createComponent(Host)
  await fixture.whenStable()
}

async function typeChars(user: ReturnType<typeof userEvent.setup>, text: string) {
  for (const char of text) {
    await user.keyboard(char)
    await fixture.whenStable()
  }
}

describe("OtpInput", () => {
  it("renders an accessible group of cells", async () => {
    await mount()
    const inputs = cells()
    expect(root().getAttribute("role")).toBe("group")
    expect(root().getAttribute("aria-label")).toBe("One-time code")
    expect(inputs).toHaveLength(4)
    expect(inputs[0]?.getAttribute("autocomplete")).toBe("one-time-code")
    expect(inputs[0]?.getAttribute("inputmode")).toBe("numeric")
    expect(inputs[0]?.getAttribute("maxlength")).toBe("1")
    expect(inputs[2]?.getAttribute("aria-label")).toBe("Digit 3 of 4")
    expect(document.activeElement).toBe(inputs[0])
    expect(root().querySelector<HTMLInputElement>("input[type=hidden]")?.name).toBe("code")
  })

  it("types characters, rejects invalid ones and emits complete", async () => {
    const user = userEvent.setup()
    await mount()
    await typeChars(user, "1a23")
    expect(values()).toEqual(["1", "2", "3", ""])
    expect(document.activeElement).toBe(cells()[3])
    expect(fixture.componentInstance.completed).toEqual([])
    await typeChars(user, "4")
    expect(fixture.componentInstance.code()).toBe("1234")
    expect(fixture.componentInstance.completed).toEqual(["1234"])
    expect(root().querySelector<HTMLInputElement>("input[type=hidden]")?.value).toBe("1234")
    expect(cells()[0]?.hasAttribute("data-filled")).toBe(true)
  })

  it("handles backspace and arrow keys", async () => {
    const user = userEvent.setup()
    await mount()
    await typeChars(user, "12")
    await user.keyboard("{Backspace}")
    await fixture.whenStable()
    expect(values().join("")).toBe("1")
    expect(document.activeElement).toBe(cells()[1])
    await user.keyboard("{ArrowLeft}")
    await fixture.whenStable()
    expect(document.activeElement).toBe(cells()[0])
    await user.keyboard("{End}")
    await fixture.whenStable()
    expect(document.activeElement).toBe(cells()[3])
  })

  it("distributes pasted text", async () => {
    const user = userEvent.setup()
    await mount()
    await user.paste("1-2 3x4z9")
    await fixture.whenStable()
    expect(values()).toEqual(["1", "2", "3", "4"])
    expect(document.activeElement).toBe(cells()[3])
    expect(fixture.componentInstance.completed).toEqual(["1234"])
  })

  it("supports two-way binding", async () => {
    const user = userEvent.setup()
    await mount()
    fixture.componentInstance.code.set("12")
    await fixture.whenStable()
    expect(values()).toEqual(["1", "2", "", ""])
    await user.click(cells()[2] as HTMLInputElement)
    await typeChars(user, "3")
    expect(fixture.componentInstance.code()).toBe("123")
    await user.click(fixture.nativeElement.querySelector("button"))
    await fixture.whenStable()
    expect(values()).toEqual(["", "", "", ""])
  })

  it("follows length, mask and disabled inputs", async () => {
    await mount()
    fixture.componentInstance.length.set(3)
    fixture.componentInstance.mask.set(true)
    fixture.componentInstance.disabled.set(true)
    await fixture.whenStable()
    expect(cells()).toHaveLength(3)
    expect(cells().every((input) => input.type === "password")).toBe(true)
    expect(cells()[0]?.disabled).toBe(true)
    expect(cells()[0]?.hasAttribute("data-disabled")).toBe(true)
  })
})
