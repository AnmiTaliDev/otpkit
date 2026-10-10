import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { OtpInput } from "../src/index"

let element: OtpInput

async function mount(attributes: Record<string, string> = {}, setup?: (el: OtpInput) => void) {
  element = document.createElement("otp-input")
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }
  setup?.(element)
  document.body.append(element)
  await element.updateComplete
}

function cells(): HTMLInputElement[] {
  return Array.from(element.querySelectorAll<HTMLInputElement>("[data-otp-cell]"))
}

afterEach(() => {
  document.body.innerHTML = ""
})

describe("otp-input", () => {
  it("renders an accessible group of cells", async () => {
    await mount({ name: "code", "auto-focus": "" })
    const inputs = cells()
    expect(element.getAttribute("role")).toBe("group")
    expect(element.getAttribute("aria-label")).toBe("One-time code")
    expect(inputs).toHaveLength(6)
    expect(inputs[0]?.getAttribute("autocomplete")).toBe("one-time-code")
    expect(inputs[0]?.getAttribute("inputmode")).toBe("numeric")
    expect(inputs[0]?.getAttribute("maxlength")).toBe("1")
    expect(inputs[2]?.getAttribute("aria-label")).toBe("Digit 3 of 6")
    expect(document.activeElement).toBe(inputs[0])
    expect(element.querySelector<HTMLInputElement>("input[type=hidden]")?.name).toBe("code")
  })

  it("types characters, rejects invalid ones and fires value-change and complete", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onComplete = vi.fn()
    await mount({ length: "4", name: "code", "auto-focus": "" }, (el) => {
      el.addEventListener("value-change", (event) => onChange((event as CustomEvent).detail))
      el.addEventListener("complete", (event) => onComplete((event as CustomEvent).detail))
    })
    await user.keyboard("1a23")
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "3", ""])
    expect(document.activeElement).toBe(cells()[3])
    await user.keyboard("4")
    expect(onChange).toHaveBeenLastCalledWith("1234")
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith("1234")
    expect(element.value).toBe("1234")
    expect(element.querySelector<HTMLInputElement>("input[type=hidden]")?.value).toBe("1234")
    expect(cells()[0]?.hasAttribute("data-filled")).toBe(true)
  })

  it("handles backspace and arrow keys", async () => {
    const user = userEvent.setup()
    await mount({ "auto-focus": "" })
    await user.keyboard("12{Backspace}")
    expect(cells().map((input) => input.value).join("")).toBe("1")
    expect(document.activeElement).toBe(cells()[1])
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(cells()[0])
    await user.keyboard("{End}")
    expect(document.activeElement).toBe(cells()[5])
  })

  it("distributes pasted text", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    await mount({ length: "4", "auto-focus": "" }, (el) => {
      el.addEventListener("complete", (event) => onComplete((event as CustomEvent).detail))
    })
    await user.paste("1-2 3x4z9")
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "3", "4"])
    expect(document.activeElement).toBe(cells()[3])
    expect(onComplete).toHaveBeenCalledWith("1234")
  })

  it("follows the value property", async () => {
    await mount({ length: "4", value: "12" })
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "", ""])
    element.value = "9"
    await element.updateComplete
    expect(cells().map((input) => input.value)).toEqual(["9", "", "", ""])
    element.length = 3
    await element.updateComplete
    expect(cells()).toHaveLength(3)
  })

  it("renders password cells when masked", async () => {
    await mount({ mask: "" })
    expect(cells().every((input) => input.type === "password")).toBe(true)
  })

  it("marks cells disabled", async () => {
    await mount({ disabled: "" })
    expect(cells()[0]?.disabled).toBe(true)
    expect(cells()[0]?.hasAttribute("data-disabled")).toBe(true)
  })
})
