## Terraform and OpenTofu defaults

- Terraform 1.17 (1.17.0 on 2026-10-21) and OpenTofu 1.13 (1.13.0 on 2026-09-30) are current. Their features diverged after the fork, so confirm which binary runs before using anything below.
- Lock S3 state with `use_lockfile = true` (Terraform 1.10+, OpenTofu 1.10+). It defaults to `false`, and DynamoDB locking (`dynamodb_table`) is deprecated. The credentials need `s3:GetObject`, `s3:PutObject` and `s3:DeleteObject` on `<key>.tflock`. Set both options while migrating from DynamoDB.
- Keep secrets out of state and plan files with ephemeral values: `ephemeral` resources, variables and outputs (Terraform 1.10, OpenTofu 1.11) and write-only arguments such as `password_wo` (Terraform 1.11, OpenTofu 1.11). `sensitive = true` only hides a value in output, and the value still lands in state.
- Import declaratively with `import` blocks. They accept `for_each` (1.7 in both tools) and, in Terraform 1.12+, `identity` instead of `id`. Terraform 1.16+ allows `import` blocks inside child modules, earlier versions only in the root module.
- Terraform 1.15+ lets module `source` and `version` reference locals and variables declared with `const = true`, and 1.17 extends this to `required_providers`. Terraform backend blocks still take literals only. OpenTofu 1.8+ accepts variables and locals in module sources and backend blocks and infers constness.
- Mark retiring inputs and outputs with `deprecated = "<migration hint>"` (Terraform 1.15, OpenTofu 1.10).
- `terraform test` and `tofu test` run blocks default to `command = apply`, which creates real infrastructure. Use `command = plan` or `mock_provider` (Terraform 1.7+, OpenTofu 1.8+) for unit tests. Mocking ephemeral resources needs Terraform 1.17.
- Terraform only: `action` blocks and list resources in `.tfquery.hcl` files run by `terraform query` (1.14), Terraform Policy through `-policies` (GA in 1.17), and Stacks.
- OpenTofu only: state and plan encryption (1.7), `lifecycle { enabled = <bool> }` instead of the `count = cond ? 1 : 0` toggle (1.11), `for_each` on provider configurations (1.9), `-exclude` (1.9), OCI registry sources for modules and providers (1.10), `prevent_destroy` from variables (1.12), and `.tofu` files that replace a same-named `.tf` file so one module can serve both tools (1.8).
- For how CI authenticates to cloud providers (OIDC), see concise:github-actions.

## Terraform and OpenTofu gotchas

- Changing a write-only argument alone does nothing, because its value is never stored or compared. Increment the companion version argument (`password_wo_version`, or the provider's equivalent) in the same change.
- A `removed` block destroys the real object by default. Add `lifecycle { destroy = false }` to only drop it from state. Resources accept the same `destroy = false` lifecycle option in Terraform 1.16+ and OpenTofu 1.12+.
- `prevent_destroy` does not protect a resource whose block is deleted, because lifecycle rules are not stored in state.
- An apply error saying the object already exists (HTTP 409 on many providers) means it exists outside this state, for example after an interrupted apply. Adopt it with an `import` block. Retrying fails again, and renaming the resource to dodge the conflict creates a duplicate.
- `init` through a provider mirror or plugin cache records hashes for the current platform only, so runs on another OS or CPU fail later. Run `terraform providers lock -platform=linux_amd64 -platform=darwin_arm64` with one flag per platform in use. OpenTofu 1.12+ records every registry checksum at `init`. Run `init -lockfile=readonly` in CI so it fails instead of rewriting the lock file.
- OpenTofu refuses to read unencrypted state once encryption is configured. Migrate with a `method "unencrypted"` referenced from a `fallback` block, then remove it and set `enforced = true`. Renaming a key provider or method after encryption breaks decryption, so keep the old one in `fallback` or set `encrypted_metadata_alias`. A lost key means lost state.
