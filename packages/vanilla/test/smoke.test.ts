import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createOtpInput } from "../src/index"

function cells(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>("[data-otp-cell]"))
}

afterEach(() => {
  document.body.innerHTML = ""
})

function mount(options: Parameters<typeof createOtpInput>[1] = {}) {
  const container = document.createElement("div")
  document.body.append(container)
  const handle = createOtpInput(container, options)
  return { container, handle }
}

describe("createOtpInput", () => {
  it("renders an accessible group of cells", () => {
    const { container } = mount({ name: "code", autoFocus: true })
    const group = container.querySelector("[role=group]")
    expect(group?.getAttribute("aria-label")).toBe("One-time code")
    const inputs = cells(container)
    expect(inputs).toHaveLength(6)
    expect(inputs[0]?.getAttribute("autocomplete")).toBe("one-time-code")
    expect(inputs[1]?.getAttribute("autocomplete")).toBe("off")
    expect(inputs[0]?.getAttribute("inputmode")).toBe("numeric")
    expect(inputs[0]?.maxLength).toBe(1)
    expect(inputs[2]?.getAttribute("aria-label")).toBe("Digit 3 of 6")
    expect(document.activeElement).toBe(inputs[0])
    expect(container.querySelector<HTMLInputElement>("input[type=hidden]")?.name).toBe("code")
  })

  it("types characters, moves focus, rejects invalid ones and fires onComplete", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onComplete = vi.fn()
    const { container } = mount({ length: 4, name: "code", autoFocus: true, onChange, onComplete })
    const inputs = cells(container)
    await user.keyboard("1a23")
    expect(inputs.map((input) => input.value)).toEqual(["1", "2", "3", ""])
    expect(document.activeElement).toBe(inputs[3])
    expect(onComplete).not.toHaveBeenCalled()
    await user.keyboard("4")
    expect(onChange).toHaveBeenLastCalledWith("1234")
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith("1234")
    expect(container.querySelector<HTMLInputElement>("input[type=hidden]")?.value).toBe("1234")
    expect(inputs[0]?.hasAttribute("data-filled")).toBe(true)
  })

  it("sets data-invalid on a rejected character", async () => {
    const user = userEvent.setup()
    const { container } = mount({ autoFocus: true })
    await user.keyboard("x")
    expect(cells(container)[0]?.hasAttribute("data-invalid")).toBe(true)
    await user.keyboard("1")
    expect(cells(container)[0]?.hasAttribute("data-invalid")).toBe(false)
  })

  it("handles backspace and arrow keys", async () => {
    const user = userEvent.setup()
    const { container } = mount({ autoFocus: true })
    const inputs = cells(container)
    await user.keyboard("12")
    await user.keyboard("{Backspace}")
    expect(inputs.map((input) => input.value).join("")).toBe("1")
    expect(document.activeElement).toBe(inputs[1])
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(inputs[0])
    await user.keyboard("{End}")
    expect(document.activeElement).toBe(inputs[5])
    await user.keyboard("{Home}")
    expect(document.activeElement).toBe(inputs[0])
  })

  it("distributes pasted text from the focused cell", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const { container } = mount({ length: 4, autoFocus: true, onComplete })
    const inputs = cells(container)
    await user.paste("1-2 3x4z9")
    expect(inputs.map((input) => input.value)).toEqual(["1", "2", "3", "4"])
    expect(document.activeElement).toBe(inputs[3])
    expect(onComplete).toHaveBeenCalledWith("1234")
  })

  it("treats a full code written into the first cell as paste", () => {
    const { container } = mount({ length: 4 })
    const inputs = cells(container)
    const first = inputs[0] as HTMLInputElement
    first.value = "1234"
    first.dispatchEvent(new Event("input", { bubbles: true }))
    expect(inputs.map((input) => input.value)).toEqual(["1", "2", "3", "4"])
  })

  it("applies update() for value, length and disabled", () => {
    const { container, handle } = mount({ length: 4 })
    handle.update({ value: "12" })
    expect(cells(container).map((input) => input.value)).toEqual(["1", "2", "", ""])
    handle.update({ length: 3, disabled: true })
    const inputs = cells(container)
    expect(inputs).toHaveLength(3)
    expect(inputs[0]?.disabled).toBe(true)
    expect(inputs[0]?.hasAttribute("data-disabled")).toBe(true)
  })

  it("removes its DOM on destroy", () => {
    const { container, handle } = mount()
    handle.destroy()
    expect(container.children).toHaveLength(0)
  })
})
