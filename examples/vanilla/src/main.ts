import { createOtpInput } from "@anmitalidev/otpkit-vanilla"

const app = document.getElementById("app")!
app.innerHTML = `
  <div id="otp"></div>
  <p>Value: <output id="value"></output></p>
  <p>onComplete: <output id="completed">not fired</output></p>
`

let completions = 0

createOtpInput(document.getElementById("otp")!, {
  length: 6,
  type: "numeric",
  onChange: (value) => {
    document.getElementById("value")!.textContent = value
  },
  onComplete: (code) => {
    completions += 1
    document.getElementById("completed")!.textContent = `${code} (fired ${completions})`
  },
})
