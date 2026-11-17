## Custom Themes

The dashboard supports custom themes, allowing users to create their own visual identities without modifying the core application.

Themes can customize:
- Color palettes, backgrounds and accents.
- Typography, font sizes and weights.
- Panels, cards, buttons and interface components.
- Borders, shadows and visual details.
- Animations, transitions and visual effects.
- Additional JavaScript-powered effects and dynamic elements.

### Theme Template

A dedicated `theme-template.css` file is provided in:

`app/static/modularStylesheet/theme-template.css`

This file serves as the starting point for creating custom themes. It contains the predefined design tokens and CSS selectors used throughout the dashboard, providing a consistent structure for implementing a new visual style.

Copy the template, rename it and customize its properties and styles to create your own theme.

### JavaScript Extensions

Themes can optionally include custom JavaScript modules for additional functionality, such as animated backgrounds, visual effects, environmental elements or dynamic interface behavior.

These modules are loaded automatically by the Theme Manager when the corresponding theme is selected.

Themes without additional functionality only require a CSS file.

### Installation

To install a custom theme:

1. **Create your theme:** Copy `theme-template.css` and customize it.
2. **Add the files:** Place your CSS file inside `app/static/modularStylesheet/themes/`. If your theme includes JavaScript modules, place them in the same theme directory.
3. **Register the theme:** Open `app/config/frontend/themes.json` and add a new entry to the `themes` array:

```json
{
    "id": 14,
    "name": "my-custom-theme",
    "path": "/static/modularStylesheet/themes/my-custom-theme/my-custom-theme.css",
    "scripts": [
        "/static/modularStylesheet/themes/my-custom-theme/my-custom-theme.js"
    ]
}
```

The `scripts` property is optional. Remove it if your theme does not require JavaScript.

4. **Select your theme:** Open the dashboard and use the Theme Selector to activate it.

Each theme must have a unique ID and a valid stylesheet path. The `name` property identifies the theme in the selector.

The `SelectedTheme` property in `themes.json` determines the default theme when no previously selected theme is stored.

### Theme Architecture

Custom themes are loaded independently by the Theme Manager. The application's core functionality and structural layout remain separate from the visual layer.

This allows themes to be created, modified and distributed without changing the dashboard's underlying functionality.

**Create freely, customize independently, and keep the core untouched.**