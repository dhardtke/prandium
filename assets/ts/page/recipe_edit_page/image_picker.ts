const Selectors = {
  ImagePicker: "#image-picker",
  AlertContainer: ".card-body",
  BtnDelete: ".btn[data-hook='delete']",
  InputFile: "input[type='file']",
  InputDelete: "input[name='deleteThumbnail']"
} as const;

const DisplayNone = "hidden";
const ClassWhileDragging = "dragging";

export function ImagePicker() {
  const $imagePicker = document.querySelector<HTMLDivElement>(Selectors.ImagePicker);
  if (!$imagePicker) {
    return;
  }
  const $img = $imagePicker.querySelector<HTMLImageElement>("img")!;
  const $fileInput = $imagePicker.querySelector<HTMLInputElement>(Selectors.InputFile)!;
  const $deleteInput = $imagePicker.querySelector<HTMLInputElement>(Selectors.InputDelete)!;
  const $alertContainer = $imagePicker.querySelector<HTMLDivElement>(Selectors.AlertContainer)!;
  const $btnDelete = $imagePicker.querySelector<HTMLButtonElement>(Selectors.BtnDelete)!;

  function updateThumbnail() {
    $deleteInput.disabled = true;
    $btnDelete.disabled = false;
    $img.src = "";
    $alertContainer.classList.add(DisplayNone);
    const file = $fileInput.files && $fileInput.files[0];
    if (!file?.type) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      $fileInput.value = "";
      $alertContainer.classList.remove(DisplayNone);
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
    $imagePicker.classList.add(ClassWhileDragging);
    // Style the drag-and-drop as a "copy file" operation.
    event.dataTransfer!.dropEffect = "copy";
  });

  $imagePicker.addEventListener("dragleave", () => {
    $imagePicker.classList.remove(ClassWhileDragging);
  });

  $imagePicker.addEventListener("drop", (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      $fileInput.files = event.dataTransfer.files;
      updateThumbnail();
    }
    $imagePicker.classList.remove(ClassWhileDragging);
  });

  $imagePicker.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest(Selectors.BtnDelete)) {
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
