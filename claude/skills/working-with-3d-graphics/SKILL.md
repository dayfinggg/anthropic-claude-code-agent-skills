---
name: working-with-3d-graphics
description: Builds, fixes, and reviews 3D work in Blender bpy, Unreal Engine 5, three.js, React Three Fiber, and glTF/GLB. Use for scenes, shaders, TSL, materials, textures, export, scale, or a broken scene.
---

# Working with 3D graphics

Read the version in use first. Check `bpy.app.version`, the engine version in the `.uproject`, or `three` in `package.json`.
Follow that version's documentation, because recalled APIs are often removed or renamed.
Use the simplest engine feature before a custom system, such as instancing or a material instance.

| Tool | Up axis | Handedness | Unit |
|---|---|---|---|
| Blender | Z | Right-handed | 1 unit is 1 meter |
| glTF 2.0 | Y | Right-handed, front faces +Z | Meters |
| three.js | Y | Right-handed | Meters by convention |
| Unreal Engine | Z | Left-handed | 1 unit is 1 centimeter |

- Model at real-world scale in meters and let exporters convert.
- Apply rotation and scale before export.
- Check imported size against a known reference, such as a 1.8 meter human or the UE mannequin.

## Done means a passing check

A 3D change is done only when a check the agent can run passes.

| Target | Check |
|---|---|
| Blender script | `blender -b file.blend --python script.py --python-exit-code 1` exits 0 |
| Exported GLB | `gltf-transform validate model.glb` reports no errors |
| Scale | Bounding box dimensions match the expected size in meters |
| Web scene | Screenshot matches the reference, and `renderer.info` counts stay flat after load and unload |
| Unreal level | High resolution screenshot looks right, and `stat unit` meets the frame budget |

Say which checks ran and which did not.

## Reference files

Read the file for the tool in use before the first change.

- [reference/blender.md](reference/blender.md) for bpy scripting, version API changes, extensions, headless runs, and export.
- [reference/unreal.md](reference/unreal.md) for UE5 C++ and Blueprints, naming, materials, feature status, importing, and editor scripting.
- [reference/web.md](reference/web.md) for three.js with WebGPU and TSL, React Three Fiber, glTF loading and optimization, and disposal.
- [reference/materials.md](reference/materials.md) for color spaces, texture channels, normal map convention, compression, file formats, and untrusted files.
