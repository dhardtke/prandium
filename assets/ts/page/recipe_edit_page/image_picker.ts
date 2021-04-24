const SELECTORS = {
  IMAGE_PICKER: "#image-picker",
  ALERT_CONTAINER: ".card-body",
  BTN_DELETE: ".btn[data-hook='delete']",
  INPUT_FILE: "input[type='file']",
  INPUT_DELETE: "input[name='deleteThumbnail']"
} as const;
const DISPLAY_NONE = "d-none";
const CLASS_WHILE_DRAGGING = "dragging";

export function ImagePicker() {
  const $imagePicker = document.querySelector<HTMLDivElement>(SELECTORS.IMAGE_PICKER);
  if (!$imagePicker) {
    return;
  }
  const $img = $imagePicker.querySelector<HTMLImageElement>("img")!;
  const $fileInput = $imagePicker.querySelector<HTMLInputElement>(SELECTORS.INPUT_FILE)!;
  const $deleteInput = $imagePicker.querySelector<HTMLInputElement>(SELECTORS.INPUT_DELETE)!;
  const $alertContainer = $imagePicker.querySelector<HTMLDivElement>(SELECTORS.ALERT_CONTAINER)!;
  const $btnDelete = $imagePicker.querySelector<HTMLButtonElement>(SELECTORS.BTN_DELETE)!;

  function updateThumbnail() {
    $deleteInput.disabled = true;
    $btnDelete.disabled = false;
    $img.src = "";
    $alertContainer.classList.add(DISPLAY_NONE);
    const file = $fileInput.files && $fileInput.files[0];
    if (!file?.type) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      $fileInput.value = "";
      $alertContainer.classList.remove(DISPLAY_NONE);
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", event => {
      if (event.target?.result) {
        $img.src = event.target.result as string;
      }
    });
    reader.readAsDataURL(file);
  }

  $fileInput.addEventListener("change", () => updateThumbnail());

  $imagePicker.addEventListener("dragover", (event) => {
    event.stopPropagation();
    event.preventDefault();
    $imagePicker.classList.add(CLASS_WHILE_DRAGGING);
    // Style the drag-and-drop as a "copy file" operation.
    event.dataTransfer!.dropEffect = "copy";
  });

  $imagePicker.addEventListener("dragleave", () => {
    $imagePicker.classList.remove(CLASS_WHILE_DRAGGING);
  });

  $imagePicker.addEventListener("drop", (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      $fileInput.files = event.dataTransfer.files;
      updateThumbnail();
    }
    $imagePicker.classList.remove(CLASS_WHILE_DRAGGING);
  });

  $imagePicker.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest(SELECTORS.BTN_DELETE)) {
      e.stopPropagation();
      $fileInput.click();
    }
  });

  $btnDelete.addEventListener("click", () => {
    $fileInput.value = "";
    updateThumbnail();
    $deleteInput.disabled = false;
    $btnDelete.disabled = true;
  });
}
