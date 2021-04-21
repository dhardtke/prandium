import { t } from "../../helpers/translation_helper.ts";
import { html } from "../../mod.ts";
import { Alert } from "../_components/alert.ts";
import { PageTemplate } from "../_structure/page.template.ts";

export function Error500() {
  return PageTemplate(t("error.500.title"))(html`
    ${Alert("danger", t("error.500.title"), t("error.500.description"))}
  `);
}
