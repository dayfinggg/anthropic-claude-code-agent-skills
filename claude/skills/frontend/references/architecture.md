# Architecture and setup

## Establish the existing boundaries

Before adding a component, trace its route, data owner, rendering boundary, consumers, styling, and tests, identify which parts are product-specific and which are reusable controls, and split a piece out only when it has a distinct responsibility, state lifetime, accessibility contract, or demonstrated reuse, because a visual box alone does not justify a component and extracting tightly coupled markup only adds indirection.

<example>
The `OrderSummary` box that only `CheckoutPage` uses and that shares its state stays in the page, while the `Dropdown` used by six forms is its own component.
</example>

Keep application orchestration at a route or feature boundary where practical and give a reusable control only the values and actions it needs, extracting a hook, composable, or local module when it isolates a real concern, because passing a whole store, response object, or routing context into a generic primitive ties it to one application. A container component plus a presentation component for every view is optional, since the pattern has trade-offs and is not universal.

<example>
`Pagination` receives `page`, `pageCount`, and `onChange` and not the whole result of `useOrdersStore()`.
</example>

When incompatible modes create branching contracts, consider explicit variants, composition, or slots, and keep independent boolean states that express the contract clearly, because replacing a simple optional behavior with providers and compound components adds machinery just to avoid a boolean.

<example>
A `Card` with `compact` and `selected` booleans stays as it is, while a `Modal` with mutually exclusive `isConfirm`, `isForm`, and `isGallery` flags becomes `ConfirmModal` and `FormModal` sharing one frame through a slot.
</example>

## Put code where it changes together

Follow the repository's existing layout, colocate the UI, behavior, styles, and tests of a new feature when no local convention exists, and move code into shared UI only when its meaning and behavior are shared, because feature ownership keeps a change inside one folder and similar markup with different business rules gains nothing from a common abstraction. Leave the folder tree alone when it only differs from a preferred layout.

<example>
A new `features/invoices/` folder holds `InvoiceList.tsx`, `useInvoices.ts`, `invoices.css`, and `InvoiceList.test.tsx`, and the two cards that only look alike stay separate.
</example>

Before moving a file, inspect imports, route discovery, build aliases, test discovery, and server and client boundaries, and keep shared primitives from importing a feature's store or private components, because file-based routing and aliases break silently on a move and a primitive that imports a feature cannot be reused. Angular's feature-area and colocation advice is a model to adapt to other stacks, not a naming requirement.

<example>
Moving `pages/orders/[id].tsx` changes the URL under file-based routing, so grep for links to `/orders/` and check the rewrites in `next.config.js` first.
</example>

## Make names explain the contract

Name components after a domain concept or interaction role and not their current color, position, or wrapper shape, and name handlers after the action they perform and not the pointer event, because an appearance-based name becomes wrong at the next restyle. Distinguish committed values, drafts, selected identity, and request state, add units or scope where their absence could cause a mistake, and avoid generic helper names that hide unrelated responsibilities.

<example>
`DangerZone` instead of `RedBox`, `handleDelete` instead of `onButtonClick`, and `draftTitle` next to `savedTitle`.
</example>

Choose one owner for a changing value and expose deliberate update paths, letting state shared by unrelated views sit above them without making it application-global, because two writers drift apart after navigation and mutation. Check consistency after navigation and mutation and not only inside one component.

<example>
The cart count lives in `useCart()` and the header badge reads it, instead of the badge keeping its own copy updated by an event.
</example>

## Use standard setup only when starting a project

First determine whether the destination already contains an application, package manifest, lockfile, workspace configuration, or generated starter, and extend that application when it does, because a generator run over an existing application overwrites its configuration and a second framework splits the build.

<example>
A folder with `package.json` and `pnpm-lock.yaml` gets a new route in the existing Vite app and no fresh `create-next-app`.
</example>

For a genuinely new application, read the selected stack's official setup documentation for runtime prerequisites, package-manager syntax, generator options, and destination, select only the features the task needs, and run one generator into an empty target, because a hand-assembled manifest and toolchain drifts from the supported setup. A framework recommendation does not override an explicit stack choice, a static-site requirement, or an existing deployment constraint.

<example>
For "a small React app with TypeScript", read the Vite setup guide for the installed Node version and run its generator with the React TypeScript template into a new empty `my-app` directory.
</example>

Inspect the generated files, preserve their entry points and scripts, and run the untouched baseline before implementing UI, continuing from its output when a standard setup workflow already ran, because a baseline that fails before your change cannot be told apart from a failure you caused.

<example>
After scaffolding, `npm run build` and `npm run dev` run on the untouched output before the first component is added.
</example>

If setup fails, identify the missing runtime, network access, permission, or supported option and fix that, and skip the application framework for a small static interface, because a hand-written substitute toolchain hides the failure and a generator existing is not a requirement for a static page.

<example>
An engine error from `npm create` is solved by installing the Node version the documentation names and not by writing a `package.json` by hand, and a one-page landing stays `index.html` plus CSS.
</example>

## Check the boundary after the change

After a rename, extraction, or new folder, confirm that existing callers still use the public contract, that multiple instances do not share accidental state or duplicate IDs, and that route behavior, form identity, and rendered semantics did not change, because structural edits look behavior-neutral and still break callers and forms.

<example>
After extracting `TextField`, render two of them on one page and confirm their `id` and `for` pairs differ, then open the other form that used the old markup.
</example>
