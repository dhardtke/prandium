import { registerArrayFields } from "./array_field.ts";
import { ImagePicker } from "./image_picker.ts";

export const RecipeEditPage = () => {
  registerArrayFields();
  ImagePicker();

  // disable input[type='file'] fields that don't have a value to avoid unnecessary data transfers
  document.getElementById("edit-form")?.addEventListener("submit", () => {
    const $files = document.querySelectorAll<HTMLInputElement>("input[type='file']");
    for (const $file of $files) {
      if (!$file.value) {
        $file.disabled = true;
      }
    }
  });
};
