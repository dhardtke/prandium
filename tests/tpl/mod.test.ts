import { assertEquals } from "../../deps.ts";
import { e, html } from "../../src/tpl/mod.ts";

Deno.test(`html ignores falsy values`, () => {
  assertEquals(html`${undefined}${false}`, "");
  assertEquals(html`${[undefined, false]}`, "");
});

Deno.test(`html works with multiple values and bindings`, () => {
  assertEquals(html`Hello ${"World"}`, "Hello World");
  assertEquals(html`Hello ${42}`, "Hello 42");
});

Deno.test(`html joins arrays`, () => {
  assertEquals(
    html`Hello ${["World", ".", " How ", "are ", "you ", "today", "?"]}`,
    "Hello World. How are you today?",
  );
});

Deno.test(`e returns an empty string when input is undefined`, () => {
  assertEquals(e(undefined), "");
});

Deno.test(`e escapes special HTML characters`, () => {
  const actual = e(
    `Lorem ipsum dolor sit "amet", consetetur & sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
   dolore magna aliquyam erat, <sed> diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.
    Stet clita kasd gubergren, 'no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,
     consetetur sadipscing elitr, 'sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
      sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,
       no sea takimata sanctus est Lorem ipsum dolor sit amet.`,
  );
  const expected = `Lorem ipsum dolor sit &quot;amet&quot;, consetetur &amp; sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
   dolore magna aliquyam erat, &lt;sed&gt; diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.
    Stet clita kasd gubergren, &#39;no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,
     consetetur sadipscing elitr, &#39;sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
      sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,
       no sea takimata sanctus est Lorem ipsum dolor sit amet.`;
  assertEquals(actual, expected);
});

Deno.test(`e does not change allowed UTF-8 characters`, () => {
  // see https://www.w3.org/2001/06/utf-8-test/UTF-8-demo.html for UTF-8 demo text
  const characters = `∮ E⋅da = Q,  n → ∞, ∑ f(i) = ∏ g(i), ∀x∈ℝ: ⌈x⌉ = −⌊−x⌋, α ∧ ¬β = ¬(¬α ∨ β),
  ℕ ⊆ ℕ₀ ⊂ ℤ ⊂ ℚ ⊂ ℝ ⊂ ℂ, ⊥ a ≠ b ≡ c ≤ d ≪ ⊤ ⇒ (A ⇔ B),
  2H₂ + O₂ ⇌ 2H₂O, R = 4.7 kΩ, ⌀ 200 mm
  ði ıntəˈnæʃənəl fəˈnɛtık əsoʊsiˈeıʃn
  Y [ˈʏpsilɔn], Yen [jɛn], Yoga [ˈjoːgɑ]
  ((V⍳V)=⍳⍴V)/V←,V    ⌷←⍳→⍴∆∇⊃‾⍎⍕⌈`;
  assertEquals(e(characters), characters);
});
