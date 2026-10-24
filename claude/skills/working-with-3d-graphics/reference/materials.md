# Materials, performance, and exchange

## Materials and color

- Use the metallic-roughness model. Metallic is 0 or 1 for almost every surface.
- Keep base color of non-metals roughly between 30 and 240 in sRGB.
- Color textures such as base color and emissive are sRGB.
- Data textures such as normal, roughness, metallic, and occlusion are linear.
- Linear means Non-Color in Blender and sRGB unchecked in Unreal.
- In glTF, metalness is read from the blue channel and roughness from the green channel.
- Occlusion is a separate `occlusionTexture`, read from red.
- A packed ORM image works when both textures reference the same image.
- Normal maps use the OpenGL convention with green up in Blender, glTF, and three.js.
- Unreal expects DirectX normal maps with green down.
- Flip the green channel or set the importer option when a map moves between them.
- Confirm the flip by checking the lighting direction.
- Pick one tone mapper per project and set it explicitly.

## Performance and exchange

- Profile before changing anything. Use Unreal Insights, the browser performance panel, or `renderer.info`.
- Size textures to their on-screen size, with mipmaps and GPU compression.
- Use KTX2 on the web and BC formats in engines.
- Ship GLB for web and real-time delivery.
- FBX is common for meshes and animation into Unreal.
- OpenUSD suits large layered scenes.
- Make exports repeatable with a script or saved settings.

## Untrusted input

- Keep automatic Python execution off when opening a `.blend` file from an unknown source. Blender disables it by default.
- Limit size and validate untrusted glTF or GLB files before loading them.
- Serve decoders from the app's own path or a pinned CDN version.
