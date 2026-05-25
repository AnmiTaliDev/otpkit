import userEvent from "@testing-library/user-event"
import { render, type VNode } from "preact"
import { useState } from "preact/hooks"
import { act } from "preact/test-utils"
import { afterEach, describe, expect, it, vi } from "vitest"
import { OtpInput, type OtpInputProps } from "../src/index"

let container: HTMLElement

function mount(element: VNode) {
  container = document.createElement("div")
  document.body.append(container)
  act(() => {
    render(element, container)
  })
}

function cells(): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>("[data-otp-cell]"))
}

afterEach(() => {
  act(() => {
    render(null, container)
  })
  document.body.innerHTML = ""
})

describe("OtpInput", () => {
  it("renders an accessible group of cells", () => {
    mount(<OtpInput name="code" autoFocus />)
    const inputs = cells()
    expect(container.querySelector("[role=group]")?.getAttribute("aria-label")).toBe("One-time code")
    expect(inputs).toHaveLength(6)
    expect(inputs[0]?.getAttribute("autocomplete")).toBe("one-time-code")
    expect(inputs[0]?.getAttribute("inputmode")).toBe("numeric")
    expect(inputs[2]?.getAttribute("aria-label")).toBe("Digit 3 of 6")
    expect(document.activeElement).toBe(inputs[0])
    expect(container.querySelector<HTMLInputElement>("input[type=hidden]")?.name).toBe("code")
  })

  it("types characters, rejects invalid ones and fires onComplete", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onComplete = vi.fn()
    mount(<OtpInput length={4} name="code" autoFocus onChange={onChange} onComplete={onComplete} />)
    await user.keyboard("1a23")
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "3", ""])
    expect(document.activeElement).toBe(cells()[3])
    await user.keyboard("4")
    expect(onChange).toHaveBeenLastCalledWith("1234")
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith("1234")
    expect(container.querySelector<HTMLInputElement>("input[type=hidden]")?.value).toBe("1234")
    expect(cells()[0]?.hasAttribute("data-filled")).toBe(true)
  })

  it("handles backspace and arrow keys", async () => {
    const user = userEvent.setup()
    mount(<OtpInput autoFocus />)
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
    mount(<OtpInput length={4} autoFocus onComplete={onComplete} />)
    await user.paste("1-2 3x4z9")
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "3", "4"])
    expect(document.activeElement).toBe(cells()[3])
    expect(onComplete).toHaveBeenCalledWith("1234")
  })

  it("supports controlled mode", async () => {
    const user = userEvent.setup()
    function Controlled(props: OtpInputProps) {
      const [value, setValue] = useState("12")
      return (
        <>
          <button onClick={() => setValue("")}>reset</button>
          <OtpInput {...props} value={value} onChange={setValue} />
        </>
      )
    }
    mount(<Controlled length={4} />)
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "", ""])
    await user.click(cells()[2] as HTMLInputElement)
    await user.keyboard("3")
    expect(cells().map((input) => input.value)).toEqual(["1", "2", "3", ""])
    await user.click(container.querySelector("button") as HTMLButtonElement)
    expect(cells().map((input) => input.value)).toEqual(["", "", "", ""])
  })

  it("renders password cells when masked", () => {
    mount(<OtpInput mask />)
    expect(cells().every((input) => input.type === "password")).toBe(true)
  })

  it("marks cells disabled", () => {
    mount(<OtpInput disabled />)
    expect(cells()[0]?.disabled).toBe(true)
    expect(cells()[0]?.hasAttribute("data-disabled")).toBe(true)
  })
})
