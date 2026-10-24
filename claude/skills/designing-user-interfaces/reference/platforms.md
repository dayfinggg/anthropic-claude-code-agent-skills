# Platforms

Follow the conventions of the target platform. Check the current guidelines for the OS version the app targets.

## Apple platforms

### Liquid Glass

Liquid Glass is Apple's material for the controls and navigation layer. It was introduced in 2025 for iOS 26, iPadOS 26, macOS 26, tvOS 26, and watchOS 26.

- Use it for the layer above content, such as tab bars, toolbars, sidebars, and navigation controls.
- Keep it out of the content layer. A slider while it is dragged is an exception.
- Standard SwiftUI and UIKit components adopt it automatically, so prefer them. Apply `glassEffect` to custom controls sparingly.
- Use the regular variant by default. Use the clear variant over photos and video, with a dimming layer behind text when the media is bright.
- Do not stack glass on glass.
- Reduce Transparency and Increase Contrast change how glass looks. Legibility must never depend on transparency.

### Sizes and type

| Platform | Default hit target | Default text size |
|---|---|---|
| iOS, iPadOS | 44 by 44 pt | 17 pt |
| macOS | 28 by 28 pt | 13 pt |
| watchOS | 44 by 44 pt | 16 pt |
| visionOS | 60 by 60 pt | 17 pt |
| tvOS | 66 by 66 pt | 29 pt |

On iOS, 44 by 44 pt is the floor for touch controls. Leave about 12 points around bezeled controls and 24 points around controls without a bezel.

### Conventions

- Use SF Pro and system text styles so Dynamic Type works. Support text enlargement of at least 200 percent.
- Use SF Symbols for icons and system colors for dark mode and Increase Contrast.
- Use tab bars for top-level sections on iPhone and sidebars on iPad and Mac. Use navigation stacks for drill-down and sheets for focused tasks.
- Never override system gestures such as swipe back.

## Android and Material Design 3

- Use Material 3 components and dynamic color roles such as primary, surface, and on-surface, not fixed hex values.
- Touch targets are at least 48 by 48 dp. Pad a 24 dp icon to reach that size.
- Use the Material type scale with font scaling.
- Use a navigation bar for three to five top destinations on phones.
- Use a navigation rail on tablets and foldables, and adapt layouts with window size classes.
- The back gesture always works.
- Use Material 3 Expressive where the brand calls for more shape, color, and motion. Keep core flows calm.

## Web

- Use CSS custom properties for tokens and `rem` for type and spacing, so browser font settings apply.
- Use container queries for components.
- Respect `prefers-color-scheme`, `prefers-reduced-motion`, and `prefers-contrast`.
- Reserve space for images to avoid layout shift, and lazy-load below the fold.
