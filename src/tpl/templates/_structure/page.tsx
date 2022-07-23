/** @jsxImportSource https://esm.sh/preact@10.10.0?pin=v66 */
import { classNames, type ComponentChildren, type VNode } from "../../../../deps.ts";
import { l } from "../../../i18n/mod.ts";
import { asset } from "../../util/asset.ts";
import { Favicons } from "./favicons.tsx";
import { Header } from "./header.tsx";

declare namespace React {
  // noinspection JSUnusedGlobalSymbols
  interface HTMLAttributes<T> {
    charset?: string;
  }
}

interface PageType {
  currentUrl: URL;
  authorization: string | null;
  dark: boolean;

  (props: { title?: string; children: ComponentChildren }): VNode;
}

const PreventFOUC = () => (
  <>
    <style
      dangerouslySetInnerHTML={{
        __html: `html { display: none } .preload * { transition: none !important}`,
      }}
    >
    </style>
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.classList.remove("preload")`,
      }}
    >
    </script>
  </>
);

const RegisterServiceWorker = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `window.addEventListener("load", function () { if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js") } })`,
    }}
  >
  </script>
);

const Assets = () => {
  const stylesheet = asset.ifExists("index.min.css", "index.css");
  const javascript = asset.ifExists("index.min.js", "index.js");

  return (
    <>
      <link rel="stylesheet" href={"/assets/" + stylesheet} />
      <script src={"/assets/" + javascript} async type="module"></script>
    </>
  );
};

const Page: PageType = (props: { title?: string; children: ComponentChildren }) => {
  // @ts-ignore: preact uses charset which in React is "charSet": "Type '{ charset: string; }' is not assignable to type 'HTMLAttributes<HTMLMetaElement>'."
  const charset = <meta charset="utf-8" />;

  return (
    <html lang={l.meta.id} data-authorization={Page.authorization} class={classNames("preload", { dark: Page.dark })}>
      <head>
        <PreventFOUC />
        <RegisterServiceWorker />
        {charset}
        <meta name="color-scheme" content="dark light" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Favicons />
        <title>{props.title ?? l.appName}</title>
        <Assets />
      </head>
      <body>
        <Header />
        <main className="container">
          {props.children}
        </main>
      </body>
    </html>
  );
};

/**
 * The current value of the "Authorization" request header.
 */
Page.authorization = null;

/**
 * The request's current URL.
 */
Page.currentUrl = new URL("https://localhost");

/**
 * Whether the dark mode is currently enabled.
 */
Page.dark = false;

export { Page };
