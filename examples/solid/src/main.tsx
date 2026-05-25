import { OtpInput } from "@anmitalidev/otpkit-solid"
import { createSignal } from "solid-js"
import { render } from "solid-js/web"

function App() {
  const [value, setValue] = createSignal("")
  const [completed, setCompleted] = createSignal("not fired")

  return (
    <main>
      <OtpInput
        length={6}
        type="numeric"
        onChange={setValue}
        onComplete={(code) => setCompleted(code)}
      />
      <p>
        Value: <output>{value()}</output>
      </p>
      <p>
        onComplete: <output>{completed()}</output>
      </p>
    </main>
  )
}

render(() => <App />, document.getElementById("app")!)
