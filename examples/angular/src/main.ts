import { Component, signal } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"
import { OtpInput } from "@anmitalidev/otpkit-angular"

@Component({
  selector: "app-root",
  imports: [OtpInput],
  template: `
    <main>
      <otp-input [length]="6" type="numeric" [(value)]="value" (complete)="verify($event)" />
      <p>Value: <output>{{ value() }}</output></p>
      <p>onComplete: <output>{{ completed() }}</output></p>
    </main>
  `,
})
class App {
  protected readonly value = signal("")
  protected readonly completed = signal("not fired")

  protected verify(code: string) {
    this.completed.set(code)
  }
}

bootstrapApplication(App)
