import { t } from "../../helpers/translation_helper.ts";
import { html } from "../../mod.ts";
import { Alert } from "../_components/alert.ts";
import { PageTemplate } from "../_structure/page.template.ts";

export function Error404() {
  return PageTemplate(t("error.404.title"))(html`
    ${Alert("secondary", t("error.404.title"), t("error.404.description"))}
  `);
}
