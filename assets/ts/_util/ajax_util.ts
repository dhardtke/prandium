import { bootComponents, destroyComponents } from "../components/component.ts";
import { request } from "./request.ts";

export async function replaceMain(url: string) {
  const response = await request(url);
  if (response.status === 200) {
    const $document = new DOMParser().parseFromString(await response.text(), "text/html");
    destroyComponents();
    document.querySelector("main")!.innerHTML = $document.querySelector("main")!.innerHTML;
    bootComponents();

    window.history.pushState({}, "", url);
  }
}
