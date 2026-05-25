import userEvent from "@testing-library/user-event"
import { flushSync, mount, unmount } from "svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { OtpInput } from "../src/lib/index.js"
import Controlled from "./Controlled.svelte"

let container: HTMLElement
let instance: Record<string, unknown> | undefined

function render(create: (target: HTMLElement) => Record<string, unknown>) {
  container = document.createElement("div")
  document.body.append(container)
  instance = create(container)
  flushSync()
}

function cells(): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>("[data-otp-cell]"))
}

afterEach(() => {
  if (instance) {
    void unmount(instance)
  }
  instance = undefined
  document.body.innerHTML = ""
})

describe("OtpInput", () => {
  it("renders an accessible group of cells", () => {
    render((target) => mount(OtpInput, { target, props: { name: "code", autoFocus: true } }))
    const inputs = cells()
    expect(container.querySelector("[role=group]")?.getAttribute("aria-label")).toBe("One-time code")
    expect(inputs).toHaveLength(6)
    expect(inputs[0]?.getAttribute("autocomplete")).toBe("one-time-code")
    expect(inputs[0]?.getAttribute("inputmode")).toBe("numeric")
    expect(inputs[0]?.getAttribute("maxlength")).toBe("1")
    expect(inputs[2]?.getAttribute("aria-label")).toBe("Digit 3 of 6")
    expect(document.activeElement).toBe(inputs[0])
    expect(container.querySelector<HTMLInputElement>("input[type=hidden]")?.name).toBe("code")
  })

  it("types characters, rejects invalid ones and fires onchange and oncomplete", async () => {
    const user = userEvent.setup()
    const onchange = vi.fn()
    const oncomplete = vi.fn()
    render((target) => mount(OtpInput, { target, props: { length: 4, name: "code", autoFocus: true, onchange, oncomplete } }))
    await user.keyboard("1a23")
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "3", ""])
    expect(document.activeElement).toBe(cells()[3])
    await user.keyboard("4")
    expect(onchange).toHaveBeenLastCalledWith("1234")
    expect(oncomplete).toHaveBeenCalledTimes(1)
    expect(oncomplete).toHaveBeenCalledWith("1234")
    expect(container.querySelector<HTMLInputElement>("input[type=hidden]")?.value).toBe("1234")
    expect(cells()[0]?.hasAttribute("data-filled")).toBe(true)
  })

  it("handles backspace and arrow keys", async () => {
    const user = userEvent.setup()
    render((target) => mount(OtpInput, { target, props: { autoFocus: true } }))
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
    const oncomplete = vi.fn()
    render((target) => mount(OtpInput, { target, props: { length: 4, autoFocus: true, oncomplete } }))
    await user.paste("1-2 3x4z9")
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "3", "4"])
    expect(document.activeElement).toBe(cells()[3])
    expect(oncomplete).toHaveBeenCalledWith("1234")
  })

  it("supports bind:value", async () => {
    const user = userEvent.setup()
    render((target) => mount(Controlled, { target }))
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "", ""])
    await user.click(cells()[2] as HTMLInputElement)
    await user.keyboard("3")
    expect(container.querySelector("output")?.textContent).toBe("123")
    await user.click(container.querySelector("button") as HTMLButtonElement)
    expect(cells().map((input) => input.value)).toEqual(["", "", "", ""])
  })

  it("renders password cells when masked", () => {
    render((target) => mount(OtpInput, { target, props: { mask: true } }))
    expect(cells().every((input) => input.type === "password")).toBe(true)
  })

  it("marks cells disabled", () => {
    render((target) => mount(OtpInput, { target, props: { disabled: true } }))
    expect(cells()[0]?.disabled).toBe(true)
    expect(cells()[0]?.hasAttribute("data-disabled")).toBe(true)
  })
})
