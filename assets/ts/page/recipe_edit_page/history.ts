import { Events } from "./array_field.ts";

const SELECTORS = {
  timeField: "input[type='time']",
} as const;

export function History() {
  const setCurrentTime = ((e: CustomEvent<HTMLElement>) => {
    const $item = e.detail;
    const $time = $item.querySelector<HTMLInputElement>(SELECTORS.timeField);
    if ($time && !$time.value) {
      $time.value = new Date().toLocaleTimeString("en-GB");
    }
  }) as EventListener;
  window.addEventListener(Events.CREATE, setCurrentTime);
}
