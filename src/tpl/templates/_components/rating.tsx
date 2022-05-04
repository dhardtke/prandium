/** @jsxImportSource https://esm.sh/preact@10.7.1?pin=v66 */
import { classNames } from "../../../../deps.ts";
import { Icon, IconName } from "./icon.tsx";

export const Rating = (props: { name: string; value?: number; readonly?: boolean; small?: boolean }) => {
  const Stars = () => {
    const comparisonValue = Math.round((props.value ?? 0) * 2) / 2;

    const data: { half: boolean; currentValue: number; i: number }[] = [];

    for (let i = 10; i >= 1; i--) {
      const half = i % 2 !== 0;
      const currentValue = i / 2;
      data.push({ half, currentValue, i });
    }

    return (
      <>
        {data.map(({ half, currentValue, i }) => (
          <>
            <input
              type="radio"
              id={`${props.name}-${i}`}
              name={props.name}
              value={currentValue}
              autocomplete={props.readonly ? "" : "off"}
              checked={currentValue === comparisonValue}
              disabled={props.readonly}
            />
            <label htmlFor={`${props.name}-${i}`} title={props.readonly ? "" : String(currentValue)} class={classNames({ "half": half })}>
              <Icon name={`star-${half ? "half" : "fill"}` as IconName} />
            </label>
          </>
        ))}
      </>
    );
  };

  return (
    <div class={classNames("rating", { "disabled": props.readonly, "small": props.small })}>
      <Stars />
    </div>
  );
};
