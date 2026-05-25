import { OtpInput } from "@anmitalidev/otpkit-vue"
import { createApp, ref } from "vue"

createApp({
  components: { OtpInput },
  setup() {
    const value = ref("")
    const completed = ref("not fired")
    function verify(code: string) {
      completed.value = code
    }
    return { value, completed, verify }
  },
  template: `
    <main>
      <OtpInput v-model="value" :length="6" type="numeric" @complete="verify" />
      <p>Value: <output>{{ value }}</output></p>
      <p>onComplete: <output>{{ completed }}</output></p>
    </main>
  `,
}).mount("#app")
