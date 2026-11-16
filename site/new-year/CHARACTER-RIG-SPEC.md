# SPEC-NY-03 — Heroine Segmentation, 2D Rig & Sprite Deformation

**Status:** IMPLEMENTED — MANUAL SEGMENTATION, RGBA LAYER EXTRACTION, JOINT AUTHORING, TWO-BONE IK AND PIECEWISE-RIGID CANVAS PREVIEW; BROWSER RUNTIME / PHOTO-SPECIFIC VISUAL ACCEPTANCE PENDING  
**Branch:** main  
**Priority:** preserve identity and source pixels; never synthesize hidden anatomy or facial details.

## 1. Objective

Build an in-browser authoring and preview workflow that converts the user's original portrait into independently controllable 2D sprite layers. The source photo remains immutable. All image processing stays in browser memory; no image upload or external image API is used.

## 2. Implemented architecture

- **SourceImage:** original raster loaded locally and retained unchanged.
- **SegmentationEditor:** manually authored polygon masks for head, torso, upper arms, forearms and hands.
- **LayerBuilder:** extracts full-source-coordinate transparent RGBA canvas layers using polygon clipping.
- **JointEditor:** source-space joint placement for root, neck, head pivot, shoulders, elbows and wrists.
- **IK2D:** analytic two-bone solver with reach clamping and side-dependent elbow bend.
- **SpriteDeformationEngine:** piecewise-rigid Canvas 2D deformation. Each upper arm rotates around its shoulder; each forearm inherits the upper-arm transform and rotates around its elbow; each hand inherits both parent transforms and rotates around the wrist.
- **PreviewRenderer:** renders static torso/head layers and articulated arm layers in a deterministic draw order.
- **ProjectExport:** JSON metadata includes masks, joints, solved target/elbow positions and angular transforms. Source image pixels are not exported.

## 3. Segment contract

Required for bilateral arm deformation:
- leftUpperArm, leftForearm, leftHand
- rightUpperArm, rightForearm, rightHand

Optional static layers:
- torso, neck, head

Layer coordinates and joint coordinates are expressed in original image pixels. Polygon masks are editable and can be retraced.

## 4. Transform model

The first deformation engine is piecewise-rigid, not mesh skinning.

For each arm:
1. Measure upper-arm and forearm lengths from the authored neutral joints.
2. Generate a deterministic preview wrist target offset from the authored wrist.
3. Solve the elbow using the two-bone law-of-cosines construction and clamp target distance to the reachable annulus.
4. Compute upper-arm angular delta from the original shoulder→elbow vector to shoulder→solved-elbow.
5. Compute forearm angular delta from the original elbow→wrist vector to solved-elbow→target-wrist.
6. Apply transforms in parent-first order around shoulder, elbow and wrist pivots.
7. Reset returns every layer to its untransformed source-space pose.

The hierarchy is applied by nested Canvas transforms, so child segments inherit parent rotations. The preview is a separate canvas and does not modify the source image or segmentation authoring canvas.

## 5. Identity, privacy and visual quality constraints

1. Never generate, replace or retouch facial details.
2. Preserve source resolution and source pixel colour values in extracted layers.
3. The source photo remains unchanged.
4. No server upload, external image API or third-party dependency.
5. Do not claim seamless joints where hidden pixels are absent.
6. Rotated parts may expose transparent gaps or clipped edges because polygon extraction does not reconstruct occluded anatomy.
7. Photo-specific quality depends on accurate masks, pivot placement and draw order; these require visual inspection against the actual heroine photo.
8. The current engine does not perform mesh warping, inverse kinematics on a deformable mesh, automatic segmentation, inpainting, pose interpolation or full-body locomotion.

## 6. Acceptance criteria

- RIG-01: source photo loads locally and remains unchanged.
- RIG-02: polygons can be drawn, closed, selected and cleared.
- RIG-03: each defined segment exports as a transparent RGBA layer in browser memory.
- RIG-04: joints can be placed in source-image coordinates.
- RIG-05: two-bone solver clamps reachable/unreachable targets and preserves segment lengths within floating-point tolerance.
- RIG-06: parent-first transform propagation is applied to upper arm, forearm and hand.
- RIG-07: applying deformation changes only the preview canvas; reset restores the neutral preview.
- RIG-08: JSON export includes authored masks/joints and computed deformation metadata without embedding image pixels.
- RIG-09: no external network request is needed for segmentation or deformation.
- RIG-10: photo-specific visual acceptance is withheld until the actual photo is loaded and mask/joint alignment is inspected.
- RIG-11: browser runtime acceptance is withheld until tested in a real browser with a representative image.

## 7. Verification status and known limitations

Static JavaScript syntax and DOM-reference checks are required before merge. Mathematical unit checks can validate the two-bone geometry independently. These checks do not prove Canvas rendering or browser interaction.

The GitHub source photo may exist in the repository, but unless its binary content is actually retrieved and visually inspected, no claim is made about its dimensions, anatomy, mask fit or visual result.

The current deformation is rigid-segment rotation. It cannot fill pixels hidden behind the torso or adjacent limbs, remove all seams automatically, or preserve realistic volume under large rotations. Manual segmentation overlap, edge feathering and hidden-pixel repair remain separate quality tasks.

**Acceptance state:** implementation and static/math checks may pass independently; runtime acceptance and photo-specific visual acceptance remain PENDING until actually performed.
