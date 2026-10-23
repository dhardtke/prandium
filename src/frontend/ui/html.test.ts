import { describe, expect, test } from 'bun:test';
import { escapeHtml, html, raw, RawHtml } from './html.ts';

// No markup in these templates: bun fmt would reformat HTML inside html`` literals.

describe('escapeHtml', () => {
  test('escapes the five characters that can break out of text or an attribute', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });

  test('stringifies what is not a string', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('null');
  });

  test('escapes an ampersand that already looks like an entity, so it displays as typed', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });
});

describe('html', () => {
  test('escapes an interpolated script tag', () => {
    expect(String(html`${'<script>alert(1)</script>'}`)).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('escapes a quote that would close the attribute it is interpolated into', () => {
    expect(String(html`value="${'" onfocus="alert(1)'}"`)).toBe('value="&quot; onfocus=&quot;alert(1)"');
  });

  test('returns RawHtml, so its output nests without being escaped twice', () => {
    const inner = html`${raw('<b>')}${'a & b'}`;

    expect(inner).toBeInstanceOf(RawHtml);
    expect(String(html`${inner}`)).toBe('<b>a &amp; b');
  });

  test.each([null, undefined, false])('renders %p as nothing, so a condition can be interpolated directly', (value) => {
    expect(String(html`[${value}]`)).toBe('[]');
  });

  test('renders 0 and true, which are values rather than absent conditions', () => {
    expect(String(html`${0}|${true}`)).toBe('0|true');
  });

  test('joins arrays and escapes each item unless it is RawHtml', () => {
    const items = ['<i>', html`${raw('<li>')}${'&'}`, ['<u>', raw('<br>')]];

    expect(String(html`[${items}]`)).toBe('[&lt;i&gt;<li>&amp;&lt;u&gt;<br>]');
  });

  test('keeps the literal parts around every interpolation', () => {
    expect(String(html`a${1}b${2}c`)).toBe('a1b2c');
    expect(String(html`plain`)).toBe('plain');
  });
});
