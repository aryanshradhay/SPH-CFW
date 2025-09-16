# CSS architecture

The refreshed layout follows a modular structure inspired by SMACSS:

- `base/` holds global tokens, resets, and utilities.
- `components/` contains reusable UI elements (buttons, navigation, hero,
  function showcase) that follow a BEM naming pattern.
- `layouts/` includes page-specific rules for the data-heavy EVA tools.

Import `styles/main.css` to bring everything together. Existing components still
use legacy class names; the shared button layer aliases the historic `.btn`
classes to the new `.button` API so migrations can happen gradually.

## Naming conventions

New styles use BEM semantics (`block__element--modifier`). Utilities that remain
from the original build are grouped under layout files until they can be
refactored. When adding new selectors, prefer:

- `block` for standalone components (`.framework-functions`)
- `block__element` for subordinate pieces (`.framework-functions__card`)
- `block__element--modifier` for state variations (`.side-nav__link--active`)

## Preprocessor recommendation

Consider moving the `base/` and `components/` layers to Sass. Variables, nesting,
`@use`, and mixins would reduce repetition and give us compile-time safety while
keeping the emitted CSS lean. The current structure is already compatible with a
future `.scss` drop-in.
