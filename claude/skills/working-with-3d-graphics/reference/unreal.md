# Unreal Engine 5

Read the engine version from the `.uproject` file and follow that version's documentation.

## C++ and Blueprints

- Hold UObject references in `UPROPERTY()` members as `TObjectPtr<T>`, so garbage collection tracks them.
- Use `TWeakObjectPtr` for references that must not keep an object alive.
- Use `TSoftObjectPtr` or `TSoftClassPtr` for assets loaded on demand.
- Create components in the constructor with `CreateDefaultSubobject`. Do gameplay setup in `BeginPlay`.
- Set `PrimaryActorTick.bCanEverTick = false` unless the actor needs ticking. Prefer timers or events.
- Put systems and performance-critical logic in C++.
- Expose tunables with `UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Gameplay")`.
- Expose logic with `UFUNCTION(BlueprintCallable)`.
- Use Enhanced Input with Input Actions and Input Mapping Contexts.
- In multiplayer, replicate state with `Replicated` or `ReplicatedUsing`. Validate client requests on the server.

## Asset naming

Follow the project's existing prefixes. Without any, use Epic's recommended set, which Epic marks as optional.
Mesh and material prefixes are `SM_` static mesh, `SK_` skeletal mesh, `M_` material, `MI_` material instance, and `T_` texture.
Other prefixes are `BP_` Blueprint, `ABP_` Animation Blueprint, `WBP_` Widget Blueprint, and `FXS_` Niagara system.
Texture suffixes such as `_N` vary between projects, so match the project.

Move and rename assets only inside the editor, because references break otherwise.

## Materials

- Build a few master materials with parameters. Use material instances for variations.
- Use static switches sparingly, because each combination compiles a new shader permutation.
- Use Substrate only when the project has it enabled. Its toon mode is experimental in 5.8.

## Rendering features

- **Nanite** suits high-polygon static meshes and replaces manual LODs for them.
- **Lumen** provides dynamic global illumination and reflections.
- **Virtual Shadow Maps** pair with Nanite.
- Pick features per target platform, and check the scalability settings for each.

Status in 5.8, which the 5.8 release notes state.

| Feature | Status |
|---|---|
| MegaLights | Production ready |
| Lumen Lite | Beta |
| Interchange USD import | Production ready for assets, experimental for levels |

## Importing

- Import at correct scale with transforms applied in the source tool. Check next to the mannequin.
- Set normal map compression to `Normalmap`.
- Use the Interchange import framework where the project uses it, with saved presets.

## Editor scripting

- Use the Python editor scripting plugin for batch asset work, such as `unreal.EditorAssetLibrary` and `unreal.EditorAssetSubsystem`.
- Use Editor Utility Widgets for tools artists run.
- Run scripts on a copy or under source control, because asset changes are hard to undo.

## Large worlds

- Profile with `stat unit`, `stat gpu`, and Unreal Insights.
- Use HLODs and World Partition for large worlds, and instanced static meshes for repeated objects.
