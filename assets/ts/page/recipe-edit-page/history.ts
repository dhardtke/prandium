import { Events } from "./array-field.ts";

const Selectors = {
  timeField: "input[type='time']",
} as const;

export function History() {
  const setCurrentTime = ((e: CustomEvent<HTMLElement>) => {
    const $item = e.detail;
    const $time = $item.querySelector<HTMLInputElement>(Selectors.timeField);
    if ($time && !$time.value) {
      $time.value = new Date().toLocaleTimeString("en-GB");
    }
  }) as EventListener;
  globalThis.addEventListener(Events.Create, setCurrentTime);
}
