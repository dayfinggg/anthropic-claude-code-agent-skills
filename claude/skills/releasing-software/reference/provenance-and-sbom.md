# Provenance, signing, and SBOM

Re-resolve action SHAs before use. Each comment names the release the SHA pointed to when checked.

## Contents

- GitHub artifact attestations
- Verifying attestations and releases
- Sigstore signing outside GitHub Actions
- SBOM
- Build once and promote

## GitHub artifact attestations

Sources are the [GitHub Docs on artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations) and the [actions/attest README](https://github.com/actions/attest).

- **Action.** `actions/attest` replaces `actions/attest-build-provenance`.
- **Scope.** Attest release artifacts. Frequent test builds get no attestation.
- **Level.** Attestations alone give SLSA v1.0 Build Level 2, as GitHub states.
- **Predicate.** Without `sbom-path`, `actions/attest` creates SLSA build provenance. With `sbom-path`, it attests a JSON SPDX or CycloneDX SBOM of at most 16 MB.
- **Files.** Put them in `subject-path`, which accepts globs.
- **Images.** Use `subject-name` without a tag, plus `subject-digest` as `sha256:<hex>`. Add `push-to-registry: true` to store the attestation beside the image.
- **Permissions.** `id-token: write`, `attestations: write`, and `contents: read`. Images on GHCR also need `packages: write`.
- **Transparency.** Public repositories use a public transparency log. Private repositories have none.

```yaml
  attest:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
      attestations: write
    steps:
      - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
        with:
          name: binaries
          path: dist/
      - uses: actions/attest@1e69f48acb82d1966a394da916b4c1698aa569d6 # v4.2.2
        with:
          subject-path: "dist/*"
```

## Verifying attestations and releases

```bash
gh attestation verify dist/app-linux-amd64 -R example-org/example-app
gh attestation verify oci://ghcr.io/example-org/example-app@sha256:<hex> -R example-org/example-app
gh release verify v1.4.0
gh release verify-asset v1.4.0 dist/app-linux-amd64
```

- **Meaning.** An attestation proves origin, not safety.
- **Flags.** `-R` or `--owner` is required. `--predicate-type` selects another attestation type, such as an SBOM.
- **Images.** Verifying an `oci://` image needs a prior `docker login` to its registry.
- **Releases.** `gh release verify` checks that a release exists and is immutable. `gh release verify-asset` checks a local file against the release.
- **Source archives.** `verify-asset` cannot check the source archive that GitHub generates.
- **Immutable releases.** They lock the tag and the assets and create a release attestation automatically.

## Sigstore signing outside GitHub Actions

Sigstore keyless signing binds a short-lived certificate to the CI's OIDC identity, so no long-lived key exists. Sign images by digest. Verify against the expected identity and issuer, not just the presence of a signature.

```bash
cosign sign "registry.example.com/app@${DIGEST}"
cosign verify "registry.example.com/app@${DIGEST}" --certificate-identity="${SIGNER_IDENTITY}" --certificate-oidc-issuer="${OIDC_ISSUER}"
```

## SBOM

- **Source.** Generate it from the built artifact or pushed image, so it lists what shipped.
- **Format.** Use CycloneDX or SPDX, whichever the project or its consumers use. When nothing is set, ask the user.
- **Release.** Attach the SBOM to the release and attest it.
- **Tool.** `anchore/sbom-action` runs Syft. Its `format` input accepts `spdx`, `spdx-json`, `cyclonedx`, and `cyclonedx-json`.
- **Default.** `spdx-json` is the default format. Set `format` when the project uses CycloneDX.

```yaml
      - uses: anchore/sbom-action@66cbf4bc1f1c0d2edc94016e65bc221b6bb0ad6c # v0.24.3
        with:
          image: ghcr.io/${{ github.repository }}@${{ steps.push.outputs.digest }}
          format: cyclonedx-json
          output-file: sbom.cdx.json
      - uses: actions/attest@1e69f48acb82d1966a394da916b4c1698aa569d6 # v4.2.2
        with:
          subject-name: ghcr.io/${{ github.repository }}
          subject-digest: ${{ steps.push.outputs.digest }}
          sbom-path: sbom.cdx.json
          push-to-registry: true
```

## Build once and promote

- Build each artifact once, because a rebuild ships untested bytes.
- Deploy images by digest.
- The build job outputs the digest. Every later job receives it and never builds again.
- Deploy jobs run `gh attestation verify` on that digest before production.
- Read environment settings at deploy time, not at build time.
