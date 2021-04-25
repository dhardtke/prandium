export const Events = {
  /**
   * The item has been created.
   */
  Create: "ArrayFieldCreate"
} as const;

const Selectors = {
  ArrayField: ".array-field",
  List: ".list-group",
  ListItem: ".list-group-item",
  BtnUp: "button[data-hook='up']",
  BtnDown: "button[data-hook='down']",
  BtnCreate: "button[data-hook='create']",
  BtnDelete: "button[data-hook='delete']",
} as const;

function ArrayField($arrayField: HTMLDivElement) {
  // TODO Move to util for re-use?
  function onClick($parent: HTMLElement, selector: string, listener: (e: MouseEvent) => void): void {
    $parent.querySelectorAll<HTMLButtonElement>(selector).forEach((el) => {
      el.addEventListener("click", listener);
    });
  }

  const $template = $arrayField.querySelector<HTMLTemplateElement>("template")!;
  const $list = $arrayField.querySelector<HTMLDivElement>(Selectors.List)!;

  function registerListeners($parent: HTMLElement) {
    function updateMoveButtons() {
      [...$list.querySelectorAll<HTMLDivElement>(Selectors.ListItem)].forEach(($item, i, $items) => {
        const $up = $item.querySelector<HTMLButtonElement>(Selectors.BtnUp);
        if ($up) {
          $up.disabled = i === 0;
        }
        const $down = $item.querySelector<HTMLButtonElement>(Selectors.BtnDown);
        if ($down) {
          $down.disabled = i === $items.length - 1;
        }
      });
    }

    onClick($parent, Selectors.BtnUp, (e) => {
      const $item = (e.target as HTMLButtonElement).closest(Selectors.ListItem);
      if ($item) {
        const $otherItem = $item.previousElementSibling;
        if ($otherItem) {
          $list.insertBefore($item, $otherItem);
          updateMoveButtons();
        }
      }
    });
    onClick($parent, Selectors.BtnDown, (e) => {
      const $item = (e.target as HTMLButtonElement).closest(Selectors.ListItem);
      if ($item) {
        const $otherItem = $item.nextElementSibling;
        if ($otherItem) {
          $list.insertBefore($otherItem, $item);
          updateMoveButtons();
        }
      }
    });
    onClick($parent, Selectors.BtnCreate, () => {
      const $fragment = $template.content.cloneNode(true) as DocumentFragment;
      registerListeners($fragment.querySelector<HTMLDivElement>(Selectors.ListItem)!);
      $list.insertBefore($fragment, $template);
      updateMoveButtons();
      const $items = $list.querySelectorAll(Selectors.ListItem);
      window.dispatchEvent(new CustomEvent(Events.Create, { detail: $items[$items.length - 1] }));
    });
    onClick($parent, Selectors.BtnDelete, (e: MouseEvent) => {
      const $item = (e.target as HTMLButtonElement).closest(Selectors.ListItem);
      $item?.remove();
      updateMoveButtons();
    });
  }

  registerListeners($arrayField);
}

export function registerArrayFields() {
  const $arrayFields = document.querySelectorAll<HTMLDivElement>((Selectors.ArrayField));
  for (const $arrayField of $arrayFields) {
    ArrayField($arrayField);
  }
}
