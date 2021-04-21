import { t } from "../../util/translation.ts";
import { e, html } from "../../mod.ts";
import { Icon } from "../_components/icon.ts";

export const Navbar = () =>
  html`
  <nav class="navbar navbar-expand-md navbar-dark fixed-top">
    <div class="container-xxl">
      <a class="navbar-brand" href="/">
        <div class="d-flex align-items-center">
          <div class="text-info me-2 d-flex">
            ${Icon("journal-richtext")}
          </div>
          <div class="app-name">
            ${e(t("appName"))}
          </div>
        </div>
      </a>
      
      <div class="d-flex">
        <button id="dark-mode-switcher" type="button" class="btn btn-sm btn-outline-light h-100">
          <span class="active d-none">
            ${Icon("moon-fill")}
          </span>
          <span class="inactive">
            ${Icon("moon")}
          </span>
        </button>
      </div>
    </div>
  </nav>
`;
