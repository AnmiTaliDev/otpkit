<script lang="ts">
  import { OTP_DEFAULT_LABEL, createOtp, getCellView } from "@anmitalidev/otpkit-core"
  import { onMount } from "svelte"
  import type { OtpInputProps } from "./types.js"

  let {
    length,
    value = $bindable(),
    type,
    disabled,
    autoFocus,
    mask,
    name,
    placeholder,
    ariaLabel,
    onchange,
    oncomplete,
  }: OtpInputProps = $props()

  function create() {
    return createOtp({
      length,
      type,
      value,
      onChange: (next) => {
        value = next
        onchange?.(next)
      },
      onComplete: (next) => oncomplete?.(next),
    })
  }

  const otp = create()
  let snapshot = $state.raw(otp.getState())
  const cells: (HTMLInputElement | undefined)[] = []

  $effect.pre(() => {
    otp.setOptions({ length, type: type ?? "numeric" })
  })

  $effect.pre(() => {
    if (value !== undefined) {
      otp.setValue(value)
    }
  })

  $effect(() => {
    snapshot = otp.getState()
    return otp.subscribe((next) => {
      snapshot = next
    })
  })

  $effect(() => {
    const target = cells[snapshot.activeIndex]
    if (snapshot.focused && target && document.activeElement !== target) {
      target.focus()
    }
  })

  onMount(() => {
    if (autoFocus) {
      cells[0]?.focus()
    }
  })

  function handleInput(index: number, event: Event) {
    const element = event.currentTarget as HTMLInputElement
    otp.input(index, element.value)
    element.value = otp.getState().cells[index] ?? ""
  }

  function handleKeydown(index: number, event: KeyboardEvent) {
    if (otp.keydown(index, event.key)) {
      event.preventDefault()
    }
  }

  function handlePaste(index: number, event: ClipboardEvent) {
    event.preventDefault()
    otp.paste(index, event.clipboardData?.getData("text") ?? "")
  }

  function handleFocus(index: number, event: FocusEvent) {
    otp.focus(index)
    ;(event.currentTarget as HTMLInputElement).select()
  }

  function handleFocusout(event: FocusEvent) {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
      otp.blur()
    }
  }
</script>

<div role="group" aria-label={ariaLabel ?? OTP_DEFAULT_LABEL} onfocusout={handleFocusout}>
  {#each snapshot.cells, index (index)}
    {@const view = getCellView(snapshot, index, {
      length: snapshot.cells.length,
      type: type ?? "numeric",
      mask,
      placeholder,
      disabled,
    })}
    <input
      bind:this={cells[index]}
      data-otp-cell=""
      data-filled={view.filled ? "" : undefined}
      data-focused={view.focused ? "" : undefined}
      data-invalid={view.invalid ? "" : undefined}
      data-disabled={view.disabled ? "" : undefined}
      type={view.type}
      inputmode={view.inputMode}
      autocomplete={view.autoComplete}
      maxlength={view.maxLength}
      aria-label={view.ariaLabel}
      placeholder={view.placeholder}
      disabled={view.disabled}
      value={view.value}
      oninput={(event) => handleInput(index, event)}
      onkeydown={(event) => handleKeydown(index, event)}
      onpaste={(event) => handlePaste(index, event)}
      onfocus={(event) => handleFocus(index, event)}
    />
  {/each}
  {#if name}
    <input type="hidden" {name} value={snapshot.cells.join("")} />
  {/if}
</div>
