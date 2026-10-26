# Project bootstrap

## Decide whether this is a new project

When asked to start or initialize an application, inspect the target and its parents first for repository guidance, manifests, workspace declarations, lockfiles, source files, and existing CI, and extend an existing application instead of generating a competing root, because a second root brings a second dependency graph and a second set of conventions. Check the selected project root before invoking any generator.

<example>
Asked to set up an API in `~/code/inventory`, list `~/code/inventory` including hidden files, look in `~/code` for a parent `go.work`, and when one exists extend that workspace and skip generating a new root.
</example>

When a monorepo needs a new package, follow its workspace creation convention, because a generator launched from a child directory can still discover parent configuration, which avoids a duplicate dependency graph but makes workspace membership worth confirming. Check that the new package appears exactly once and uses the intended shared or package-local lockfile.

<example>
After creating `packages/admin` through the repository's documented script, `pnpm ls -r --depth -1` lists `admin` once, and no `packages/admin/pnpm-lock.yaml` exists next to the root lockfile.
</example>

Resolve an unsettled framework, language, database, or deployment platform from the request and the project evidence, and confirm it with the user when the evidence does not settle it, because generator convenience is not an architectural reason and the choice outlives the scaffold.

<example>
A request for a small telemetry ingest service that will run on the team's existing cluster follows the language of the services already in the repository, and does not follow whichever template a generator lists first.
</example>

## Verify the generator before executing it

For an agreed stack, use its official generator instead of recreating boilerplate by hand, after verifying the package identity, publisher source, selected version, supported runtime, and template, and then read that version's help, because running a remote CLI, including its help, executes downloaded code. Run the generator with the deployment variables removed from its environment.

<example>
Before scaffolding with Vite, `npm view create-vite name version repository.url` confirms the package comes from the Vite repository, and the generator runs in a session that has no deployment tokens in its environment.
</example>

When repeatability matters, select an explicit generator version instead of a moving tag in a reusable command, because a moving tag changes the template under an unchanged command, and upgrade the version deliberately. Check the resolved package and the generated manifest, because the requested version may not be the one that ran.

<example>
A `scripts/new-service.sh` helper runs `pipx run --spec cookiecutter==<version> cookiecutter gh:acme/api-template`, with the version recorded in the script after reading `pip index versions cookiecutter`, and the generated `pyproject.toml` is compared with the template notes.
</example>

For Vite, check the template and the argument separator for the selected package manager, and for .NET check the installed SDK's template list and the template-specific options, because a global help page does not prove that a template accepts a flag. Use a supported preview or dry run when one exists, and after a collision adapt the command instead of adding force, because force overwrites the files that caused the collision.

<example>
`dotnet new webapi --help` lists what this SDK's template accepts, `dotnet new webapi -n Shop.Api --dry-run` previews the files, and `npm create vite@<version> shop -- --template react-ts` passes the template after the `--` separator.
</example>

Before invoking a generator, check whether it also installs dependencies, initializes Git, or connects services, and separate generation from installation where supported, because that lets generated inputs be reviewed before unreviewed installation hooks run. Check that the chosen options actually suppress those extra effects.

<example>
`rails new booking --skip-bundle --skip-git` generates the app without running `bundle install` or `git init`, the generated `Gemfile` is read for unwanted gems, and only then does `bundle install` run.
</example>

## Protect the destination

Before generation, resolve the existing parent and the intended absolute target, inspect hidden files and symbolic links or junctions, and confirm the destination stays inside the requested workspace, because a relative path or a junction can place generated files in another project. Use the current directory only after proving it is the intended, suitable target. A separate new directory avoids collisions but does not suit a request for a package inside an existing workspace.

<example>
`realpath ..` and `ls -lA` show the absolute parent, hidden files, and any symbolic link before `mvn archetype:generate` runs in `~/work/inventory/services`.
</example>

When the destination contains user files, adapt the operation to the conflict instead of using overwrite or cleanup options, and after a partial generation inspect what exists before retrying, because force and clean options delete work that may have no other copy. Remove only files proven to be generated by this invocation and unnecessary to the request, and restart without resetting or recursively cleaning the directory.

<example>
A failed `django-admin startproject booking` that left `booking/manage.py` and `booking/booking/settings.py` gets a listing of the files under `booking` compared with the template before individual generated files are removed, and `git clean -fdx` is left alone because it also deletes untracked work.
</example>

## Match the actual shell

When composing generator and package-manager commands, pass paths and template names as arguments instead of building executable text, and expect PowerShell to parse native commands and batch shims such as `npm.cmd` differently from POSIX shells, because quoting rules decide whether a path with spaces stays one argument. Check paths containing spaces before a mutating command.

<example>
Before `npm create vite@<version> $target`, print `$target`, confirm with `Test-Path -LiteralPath (Split-Path -Parent $target)` that the parent exists, and quote the value when it contains spaces such as `C:\work\My Sites\shop`.
</example>

When a script is refused by execution policy, resolve the missing prerequisite and leave the policy alone, because `Set-ExecutionPolicy` changes what every later script on the account may run.

<example>
A downloaded `setup.ps1` blocked under `RemoteSigned` is read first, and `Unblock-File .\setup.ps1` clears the download mark on that one file instead of `Set-ExecutionPolicy Bypass`.
</example>

## Review and prove the generated result

When the generator finishes, inspect its files before trusting its success message, covering dependencies, scripts, hooks, CI files, network integrations, environment examples, ignore rules, and any automatic installation, and remove only unneeded generated extras within scope, because defaults reduce setup work but can include unwanted services or publishing behavior.

<example>
A generated Spring Boot project arrives with a `compose.yaml` that starts a database container and a `publish.yml` workflow that pushes to a registry, so the review removes the workflow and keeps the rest of the template.
</example>

Create the lockfile through the chosen manager, then prove installation without changing it, run the available checks and the production build, start the generated application, and exercise its page or endpoint before stopping only the process you started, because a scaffold that installs once can still fail from a clean checkout.

<example>
`go mod tidy` writes `go.sum`, then `go mod download` succeeds with `git status --short` showing no change, `go test ./...` and `go build -o bin/shop .` pass, and `curl -sI http://localhost:8080/healthz` returns 200 from the running `bin/shop` before that process is stopped by its process id, since stopping a `go run .` process instead would leave the server it started running.
</example>

When CI belongs to the bootstrap task, reuse the selected provider and add a minimal install, check, and build path built from commands that exist, with no deployment secrets and no invented test commands, because a pipeline that calls scripts the project lacks fails on its first run. Check the configuration and the real commands locally. Creating CI files is not a request to commit them, create the remote repository, push, or enable integrations, because the user decides when work is committed and the other steps change a shared account.

<example>
A `.gitlab-ci.yml` with `dotnet restore --locked-mode`, `dotnet test --no-restore`, and `dotnet publish -c Release --no-restore` is written only after the same three commands pass in a local terminal, and a commit or `git push -u origin main` waits for the user's request.
</example>
