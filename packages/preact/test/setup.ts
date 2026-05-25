import { configure } from "@testing-library/dom"
import { act } from "preact/test-utils"

configure({
  eventWrapper: (callback) => {
    let result: unknown
    void act(() => {
      result = callback()
    })
    return result as ReturnType<typeof callback>
  },
})
