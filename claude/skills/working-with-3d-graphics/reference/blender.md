# Blender

Major releases remove APIs. Check `bpy.app.version` and read that version's Python API release notes.

## Scripting rules

- Prefer the data API over `bpy.ops`. The data API means `bpy.data`, object and mesh properties, and `bmesh`.
- Operators depend on context, selection, and mode, and they are slow in loops.
- Give an unavoidable operator its context with `bpy.context.temp_override(window=window)`.
- Create meshes with `mesh.from_pydata(vertices, edges, faces)` and `mesh.update()`.
- Link new objects with `collection.objects.link(obj)`.
- For `bmesh`, finish with `bm.to_mesh(mesh)` and `bm.free()`.
- Use `foreach_get` and `foreach_set` with NumPy arrays for bulk vertex or attribute work.
- Read evaluated data, with modifiers applied, through `obj.evaluated_get(depsgraph)`.
- Look data up again by name after undo or file reload. Held Python references go stale.

## API changes by version

| Version | Change |
|---|---|
| 5.0 | `bgl` is removed, so draw with the `gpu` module |
| 5.0 | The legacy action API is removed, including `action.fcurves` and `action.groups`. Use layered actions with channelbags and `bpy_extras.anim_utils` |
| 5.0 | The EEVEE engine id is `BLENDER_EEVEE` |
| 5.0 | `scene.node_tree` is replaced by `scene.compositing_node_group` |
| 5.0 | Render pass names are spelled out, such as `Diffuse Color` instead of `DiffCol` |
| 5.0 | Properties defined with `bpy.props` are not reachable through dictionary syntax such as `scene["cycles"]` |
| 5.1 | Bundled Python is 3.13 |
| 5.2 LTS | Geometry Nodes modifier property access changed |
| 5.2 LTS | Socket identifiers changed for the Compare and Random Value nodes |
| 5.2 LTS | Sculpt automasking settings moved into `MeshAutomaskingSettings` |

Compiled wheels in an add-on must match the bundled Python version.

## Add-ons as extensions

Add-ons ship as extensions with a `blender_manifest.toml` next to `__init__.py`.

```toml
schema_version = "1.0.0"
id = "my_tool"
version = "1.0.0"
name = "My Tool"
tagline = "Short description of what it does"
maintainer = "Name <email@example.com>"
type = "add-on"
blender_version_min = "4.2.0"
license = ["SPDX:GPL-3.0-or-later"]

[permissions]
files = "Export models to disk"
```

- Build with `blender --command extension build` in the add-on folder.
- Validate with `blender --command extension validate`.
- Bundle third-party packages as wheels listed under `wheels` in the manifest. Do not install them into Blender's Python at runtime.
- Permission keys are `files`, `network`, `clipboard`, `camera`, and `microphone`.
- Each permission reason is one sentence without end punctuation.
- Request only the permissions the add-on uses.

## Running headless

```bash
blender -b scene.blend --python script.py --python-exit-code 1 -- --output out.glb
```

- `--python-exit-code 1` makes an uncaught Python exception exit non-zero, so pipelines notice.
- Arguments after `--` reach the script through `sys.argv`.
- Render a still with `-o //render_ -F PNG -f 1` and look at the image.

## Geometry nodes

Use geometry nodes for procedural geometry an artist will tweak. Give the group interface named, ranged inputs.
Pass data between nodes and to export with named attributes.

## Export

- Export glTF with `bpy.ops.export_scene.gltf(export_format='GLB', export_apply=True)` and leave Y-up conversion on.
- Export FBX for Unreal with apply transform and correct unit scale. Check the size in the engine.
- Materials export as Principled BSDF with image textures connected directly. Bake complex node setups to textures.
- Pack texture paths or make them relative, so exports hold no local absolute paths.
