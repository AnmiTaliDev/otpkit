import { OtpInput } from "@anmitalidev/otpkit-preact"
import { render } from "preact"
import { useState } from "preact/hooks"

function App() {
  const [value, setValue] = useState("")
  const [completed, setCompleted] = useState("not fired")

  return (
    <main>
      <OtpInput
        length={6}
        type="numeric"
        onChange={setValue}
        onComplete={(code) => setCompleted(code)}
      />
      <p>
        Value: <output>{value}</output>
      </p>
      <p>
        onComplete: <output>{completed}</output>
      </p>
    </main>
  )
}

render(<App />, document.getElementById("app")!)
