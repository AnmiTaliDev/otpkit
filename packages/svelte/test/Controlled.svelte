<script lang="ts">
  import { OtpInput } from "../src/lib/index.js"

  let value = $state("12")
</script>

<button onclick={() => (value = "")}>reset</button>
<OtpInput length={4} bind:value />
<output>{value}</output>
