# SPEC-NY-03 — Heroine Segmentation & 2D Skeletal Rig

**Status:** IMPLEMENTED — EDITOR FOUNDATION; PHOTO-SPECIFIC RIG PENDING  
**Branch:** main  
**Priority:** preserve identity and source pixels; no synthetic replacement of facial/body features.

## 1. Objective
Build an in-browser authoring workflow that converts the user's original portrait into independently controllable 2D puppet layers. The source photo remains the immutable identity master. No image is uploaded to a server.

## 2. Architecture
- SourceImage: original uploaded raster, retained unchanged in browser memory.
- SegmentationEditor: manually authored polygon masks for head, torso, left/right upper arms, forearms and hands.
- LayerBuilder: extracts polygon-clipped RGBA layers from source image; records source-space bounds and pivot.
- RigGraph: parent-child hierarchy with local transforms.
- JointEditor: draggable joint markers; shoulder, elbow, wrist, neck and root.
- IK2D: two-bone analytic solver for upper-arm/forearm chains; reach clamping and elbow bend side.
- PoseController: neutral, greeting, singing, chorus, finale.
- Renderer: Canvas 2D; parent-first transforms; draw each part around its pivot.
- ProjectState: JSON metadata and locally stored project; image pixels remain local.

## 3. Segments
Required layers: torso, neck, head, hair (optional if separable), left upper arm, left forearm, left hand, right upper arm, right forearm, right hand. User-defined polygon masks must be editable and re-traceable.

## 4. Identity and quality constraints
1. Never generate or replace facial details.
2. Preserve source resolution and colour values in extracted layers.
3. Polygon edges support adjustable feathering; default 0.5 px.
4. Do not claim seamless joints where hidden pixels are absent.
5. Warn that occluded anatomy requires manual patch/inpainting before rotation.
6. Keep source image immutable and provide reset-to-source.
7. No server upload, external image API, or third-party dependency.

## 5. Rig and IK
- Parent chain: root → torso → neck → head.
- Arm chain: torso → shoulder → upper arm → elbow → forearm → wrist → hand.
- Two-bone IK solves elbow from shoulder, target wrist, segment lengths and bend direction.
- Clamp unreachable targets to the maximum/minimum reachable radius.
- Joint positions and bone lengths are stored in source-image coordinates.

## 6. Acceptance criteria
- RIG-01 source photo loads locally and remains unchanged.
- RIG-02 polygons can be drawn, closed, selected and cleared.
- RIG-03 each defined segment exports as a transparent layer in browser memory.
- RIG-04 joints can be placed and moved.
- RIG-05 two-bone IK is numerically stable for reachable and unreachable targets.
- RIG-06 pose changes interpolate without discontinuities.
- RIG-07 project metadata can be exported/imported as JSON.
- RIG-08 reduced-motion preference disables autoplay.
- RIG-09 no external network request is needed for segmentation/editor.
- RIG-10 photo-specific visual acceptance is withheld until the user's actual photo is loaded and each mask/joint alignment is inspected.

## 7. Known limitations
Automatic semantic segmentation and generative inpainting are intentionally not claimed in this release. This foundation provides manual polygon segmentation and a real 2D transform/IK rig. The exact heroine cannot be segmented and rigged in this repository commit because her original photo is not present in the repository or current task attachments. Once loaded in the editor, mask tracing, hidden-pixel repair and joint placement are photo-specific authoring steps.
