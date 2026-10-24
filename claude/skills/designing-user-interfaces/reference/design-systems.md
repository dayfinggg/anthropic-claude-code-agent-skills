# Design systems, tokens, and Figma

## Design tokens

Use the Design Tokens Community Group format, version 2025.10. It is stable, but it is a Community Group report and not a W3C Standard.

Each token has `$value` and `$type`. An alias is a dotted path in curly braces.

```json
{
  "color": {
    "blue": { "600": { "$type": "color", "$value": "#2563eb" } },
    "action": { "primary": { "$type": "color", "$value": "{color.blue.600}" } }
  }
}
```

| Tier | Example | Purpose |
|---|---|---|
| Primitive | `color.blue.600` | Raw palette and scales, never used directly in components |
| Semantic | `color.action.primary` | Roles, which change per theme or brand |
| Component | `button.primary.background` | Only when a component needs its own override |

- Name by role, as in `space.md` and `text.secondary`, not by value such as `space-16` or `gray-text`.
- Themes remap semantic tokens to other primitives.

## Figma structure

- Keep primitives and semantic tokens in separate variable collections. Use modes for light and dark, brands, and density.
- Use nested auto layout with spacing variables.
- Use component properties for text, icons, and booleans. Use variants only for real structural or state differences.
- Component and property names match the code, as in `Button` with `variant=primary` and `size=md`.

## From Figma to code

1. Read the design's variables and components, not raw pixel values. Map every color, size, and spacing to an existing token. Flag values that match no token instead of hard-coding them.
2. Reuse existing code components that match Figma components.
3. Recreate auto layout as flexbox or grid with the same gaps and alignment.
4. Implement all states and responsive behavior even when the design shows one. Ask when behavior is unclear.
5. Compare the result with the design at several widths.
