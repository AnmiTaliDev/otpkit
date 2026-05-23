import { OtpInput } from "@anmitalidev/otpkit-react"
import { useState } from "react"
import { createRoot } from "react-dom/client"

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

createRoot(document.getElementById("app")!).render(<App />)
