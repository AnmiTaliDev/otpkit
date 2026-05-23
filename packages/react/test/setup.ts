import { configure } from "@testing-library/dom"
import { act } from "react"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

configure({
  eventWrapper: (callback) => {
    let result: unknown
    act(() => {
      result = callback()
    })
    return result as ReturnType<typeof callback>
  },
})
