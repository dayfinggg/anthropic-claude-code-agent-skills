# Web 3D

WebGPU support varies by browser, OS, and GPU, so keep a WebGL 2 fallback.
three.js releases often and renames APIs, so read the version in `package.json` and its migration guide.

## Choosing a library

- **three.js** for custom scenes and the widest ecosystem.
- **React Three Fiber** with drei when the app is built in React.
- **Babylon.js** or **PlayCanvas** for game-like apps that want physics, an inspector, and an editor.
- **model-viewer** to show a single product model.
- Raw **WebGPU** only for compute or rendering that libraries cannot express.

Babylon.js scenes are left-handed by default. Its glTF loader adds a `__root__` node that converts coordinates.
Set `scene.useRightHandedSystem` before loading to skip the conversion, and never mirror the model twice.

## three.js setup

- Import from `three/webgpu` and create `WebGPURenderer`. It falls back to WebGL 2 by itself.
- Pass `forceWebGL: true` to force the WebGL 2 backend.
- Drive frames with `renderer.setAnimationLoop`, which initializes the renderer on the first frame.
- Call `await renderer.init()` only for on-demand rendering, feature detection, or before synchronous methods.
- Use `WebGLRenderer` when the project depends on GLSL `ShaderMaterial`, `onBeforeCompile`, or WebGL-only add-ons.
- `WebGPURenderer` does not support those, so port that code to node materials and TSL.
- Cap pixel ratio with `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- Set `texture.colorSpace = THREE.SRGBColorSpace` on manually loaded color textures. GLTFLoader sets color spaces itself.
- Light PBR materials with an environment map, for example `RoomEnvironment` through `PMREMGenerator`. They look flat without one.
- Resize with a `ResizeObserver` on the canvas container. Render static viewers only on change.

## Shaders with TSL

Write custom shaders in TSL from `three/tsl`. It compiles to WGSL for WebGPU and GLSL for WebGL.
Assign nodes to node material properties such as `colorNode` and `positionNode`. Use TSL compute nodes for GPU simulations.

```javascript
import * as THREE from "three/webgpu";
import { color, mix, positionLocal, sin, time, uniform } from "three/tsl";

const speed = uniform(1.5);
const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.4 });
const wave = sin(positionLocal.y.mul(6).add(time.mul(speed))).mul(0.5).add(0.5);
material.colorNode = mix(color("#1d4ed8"), color("#f59e0b"), wave);
```

## Loading glTF

- Attach decoders to `GLTFLoader`. Use `DRACOLoader` for Draco, `KTX2Loader` for KTX2, and `MeshoptDecoder` for meshopt.
- With `WebGPURenderer`, call `ktx2Loader.detectSupport(renderer)` after `await renderer.init()`.
- Show progress with `LoadingManager`, and show a visible message on load errors.
- Clone loaded assets instead of loading again. Use `SkeletonUtils.clone` for skinned meshes.

## Optimizing assets

- Optimize every GLB before shipping, then validate it. The CLI installs globally and runs as `gltf-transform`.
- Defaults may not suit every scene, so pass explicit flags.

```bash
gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp
gltf-transform validate out.glb
```

- Prefer KTX2 with Basis Universal for textures, because it stays compressed on the GPU. WebP and AVIF only shrink downloads.
- Texture sizes are often 1024 or 2048 pixels at most.
- GLTFLoader reads `KHR_materials_*` extensions for clearcoat, transmission, iridescence, anisotropy, dispersion, volume, ior, specular, and emissive_strength.
- It also reads `KHR_texture_transform`, `KHR_lights_punctual`, `KHR_mesh_quantization`, `KHR_texture_basisu`, `KHR_draco_mesh_compression`, `EXT_meshopt_compression`, and `EXT_mesh_gpu_instancing`.
- `KHR_gaussian_splatting` is ratified, but three.js loads it through a separately registered plugin.
- Check the installed version for that plugin and its backend support.

## Resource management

GPU resources are not garbage collected. Call `dispose()` on these when removing them.

- Geometries, materials, and their textures.
- Render targets, the PMREM generator, and loaders.
- The renderer, after `setAnimationLoop(null)` stops the loop.

Growing geometry and texture counts in `renderer.info` reveal leaks.

## React Three Fiber

- Mutate refs inside `useFrame` instead of calling `setState` per frame.
- Load models with `useGLTF`, preload them, and wrap them in `Suspense`.
- Use `frameloop="demand"` for static scenes, and call `invalidate()` on change.

## Performance

- `InstancedMesh` for many copies of one mesh, `BatchedMesh` for many meshes sharing a material.
- `three-mesh-bvh` for raycasting on complex meshes.
- Lower pixel ratio, shadows, and post-processing on weak devices based on measured frame time.
- Test on a mid-range phone.
