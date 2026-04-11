# Conventions

## Code Style

- **Vanilla JavaScript**: Pure JS without framework abstractions.
- **Variables**: `const` first, `let` when mutation is expected. No `var`.
- **Event Delegation**: Widespread use of delegated event listeners instead of massive sets of individual event handlers. No inline `onclick` attributes.
- **DOM Manipulation**: Use safe methods (`textContent`, `createElement`) instead of unsafe HTML injection to prevent XSS.
- **State Persistence**: Uses debounced tracking when saving to `localStorage`.

## UI and Accessibility

- **CSS Custom Properties**: Strong use of CSS variables (`:root`) for easily switchable themes.
- **Responsive**: Mobile-first design principles.
- **Accessibility**: ARIA labels, semantic HTML tags (`main`, `aside`, `nav`), role definitions, keyboard focus management.
- **Color Palettes**: Pre-selected modern themes spanning dark/light modes and dynamic Aurora backgrounds.

## Error Handling

- Safe `try/catch` wrapping around JSON parsing for `localStorage` loading.
- Handling mathematical errors gracefully (e.g., divide by zero checks, format validation).
