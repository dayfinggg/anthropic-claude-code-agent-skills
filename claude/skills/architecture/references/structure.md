# Project structure

## Starting a project

When creating a project, establish its runtime, framework, build system, and delivery target before choosing directories, use their documented entry points and discovery rules, and add packages for current responsibilities, because imagined enterprise layers add navigation without owning anything. Check a real use case through the normal build, startup, and test paths.

<example>
A new FastAPI service starts as `app/main.py`, `app/routers/`, and `tests/`, runs in development with `fastapi dev`, and gets a `billing/` package only once billing code exists.
</example>

When the framework already supplies a useful layout, keep it unless a demonstrated problem justifies departing from it, tell required placement apart from harmless convention, and check the current framework documentation before moving discovered routes, migrations, resources, or generated sources, because runtimes and tools find these files by location. Check that the features are still discovered by the actual runtime and not only by the editor.

<example>
Moving `migrations/` out of the package Django scans makes `python manage.py migrate` report nothing to apply, so run `python manage.py showmigrations shop` after any such move and confirm that it lists the app's migrations and not `(no migrations)`.
</example>

## Organizing existing code

When feature work is scattered across technical directories, consider grouping related behavior by capability where the stack permits it, and keep genuine shared infrastructure apart from domain-specific operations, because a feature spread over `controllers/`, `models/`, and `views/` needs a search through all of them for every change. Check that one feature can be found, changed, and tested without searching unrelated capabilities, since a directory move alone does not establish encapsulation or data ownership.

<example>
`invoices/` holds its routes, model, and tests together, while `shared/db.py` stays outside because every feature uses it.
</example>

When reorganization is justified, separate location changes from behavior changes where feasible, and inspect imports, package exports, registration, runtime discovery, build inputs, and dependent jobs before moving files, because a change that mixes a rename with a behavior change hides regressions inside the rename. Preserve published import paths, or treat their removal as a compatibility change. Check consumer builds and representative execution paths after each independently valid slice.

<example>
The first slice moves `utils/dates.py` to `core/dates.py` and leaves a `utils/dates.py` that re-exports from it, the build and tests pass, and only then does a second slice change behavior, with the paths in `.github/workflows` checked before the move.
</example>

## Naming components

When naming a component, use the responsibility and vocabulary its consumers recognize, qualify a term when contexts give it different meanings, and let technical components keep technical names, because a name that hides the responsibility forces readers to open the component to learn its scope. Avoid names such as `common` or `manager` only when they hide the actual responsibility. Check that callers can predict the component's scope without opening its internals.

<example>
`invoice_numbering` tells a reader its scope and `http_client` is a fine technical name, while `common/helpers.py` that collects date formatting, retries, and slug generation does not.
</example>

When a name is already published, separate improving internal terminology from breaking the supported name, and trace exports, configuration, serialized names, and external callers before renaming, because a cleaner folder name is not permission to change an API. Check that existing consumers still resolve the old contract during the supported transition.

<example>
Renaming the internal folder `lib/usr` to `lib/users` is an edit, while the exported `usr_get` and the config key `usr.timeout` keep an alias until their consumers have migrated.
</example>

## Package granularity and visibility

When build or test isolation motivates smaller packages, compare the saved work with the dependency-maintenance overhead, and use the current language and build system's packaging model instead of a universal file-to-package ratio, because smaller build targets do not require smaller business components. Check that representative incremental builds and affected-test selection improve.

<example>
Splitting one large package into `core`, `api`, and `cli` pays off only if editing `cli` no longer rebuilds `core`, which a timed incremental build confirms.
</example>

When a boundary must hold, restrict visibility through the existing language, export, or build mechanisms, and declare directly used dependencies instead of relying on another package's accidental imports, because folder names without enforcement are only an organizational aid. Check that normal consumers compile, and inspect or test a forbidden access where practical.

<example>
The `exports` map in the `package.json` of `@acme/billing` lists only `./client`, so an import of `@acme/billing/internal/ledger` fails in a consumer build.
</example>
