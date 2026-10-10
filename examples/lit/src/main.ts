import "@anmitalidev/otpkit-lit"
import { html, render } from "lit"

let value = ""
let completed = "not fired"

function update() {
  render(
    html`
      <main>
        <otp-input
          length="6"
          type="numeric"
          @value-change=${(event: CustomEvent<string>) => {
            value = event.detail
            update()
          }}
          @complete=${(event: CustomEvent<string>) => {
            completed = event.detail
            update()
          }}
        ></otp-input>
        <p>Value: <output>${value}</output></p>
        <p>onComplete: <output>${completed}</output></p>
      </main>
    `,
    document.getElementById("app")!,
  )
}

update()
