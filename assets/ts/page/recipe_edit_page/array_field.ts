const SELECTORS = {
  ARRAY_FIELD: ".array-field",
  LIST: ".list-group",
  LIST_ITEM: ".list-group-item",
  BTN_UP: "button[data-hook='up']",
  BTN_DOWN: "button[data-hook='down']",
  BTN_CREATE: "button[data-hook='create']",
  BTN_DELETE: "button[data-hook='delete']",
};

function ArrayField($arrayField: HTMLDivElement) {
  // TODO Move to util for re-use?
  function onClick($parent: HTMLElement, selector: string, listener: (e: MouseEvent) => void): void {
    $parent.querySelectorAll<HTMLButtonElement>(selector).forEach((el) => {
      el.addEventListener("click", listener);
    });
  }

  const $template = $arrayField.querySelector<HTMLTemplateElement>("template")!;
  const $list = $arrayField.querySelector<HTMLDivElement>(SELECTORS.LIST)!;

  function registerListeners($parent: HTMLElement) {
    function updateMoveButtons() {
      [...$list.querySelectorAll<HTMLDivElement>(SELECTORS.LIST_ITEM)].forEach(($item, i, $items) => {
        $item.querySelector<HTMLButtonElement>(SELECTORS.BTN_UP)!.disabled = i === 0;
        $item.querySelector<HTMLButtonElement>(SELECTORS.BTN_DOWN)!.disabled = i === $items.length - 1;
      });
    }

    onClick($parent, SELECTORS.BTN_UP, (e) => {
      const $item = (e.target as HTMLButtonElement).closest(SELECTORS.LIST_ITEM);
      if ($item) {
        const $otherItem = $item.previousElementSibling;
        if ($otherItem) {
          $list.insertBefore($item, $otherItem);
          updateMoveButtons();
        }
      }
    });
    onClick($parent, SELECTORS.BTN_DOWN, (e) => {
      const $item = (e.target as HTMLButtonElement).closest(SELECTORS.LIST_ITEM);
      if ($item) {
        const $otherItem = $item.nextElementSibling;
        if ($otherItem) {
          $list.insertBefore($otherItem, $item);
          updateMoveButtons();
        }
      }
    });
    onClick($parent, SELECTORS.BTN_CREATE, () => {
      const $fragment = $template.content.cloneNode(true) as DocumentFragment;
      registerListeners($fragment.querySelector<HTMLDivElement>(SELECTORS.LIST_ITEM)!);
      $list.insertBefore($fragment, $template);
      updateMoveButtons();
    });
    onClick($parent, SELECTORS.BTN_DELETE, (e: MouseEvent) => {
      const $item = (e.target as HTMLButtonElement).closest(SELECTORS.LIST_ITEM);
      $item?.remove();
      updateMoveButtons();
    });
  }

  registerListeners($arrayField);
}

export function registerArrayFields() {
  const $arrayFields = document.querySelectorAll<HTMLDivElement>((SELECTORS.ARRAY_FIELD));
  for (const $arrayField of $arrayFields) {
    ArrayField($arrayField);
  }
}
