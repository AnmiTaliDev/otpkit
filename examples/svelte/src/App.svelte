<script lang="ts">
  import { OtpInput } from "@anmitalidev/otpkit-svelte"

  let value = $state("")
  let completed = $state("not fired")
</script>

<main>
  <OtpInput length={6} type="numeric" bind:value oncomplete={(code) => (completed = code)} />
  <p>Value: <output>{value}</output></p>
  <p>onComplete: <output>{completed}</output></p>
</main>
