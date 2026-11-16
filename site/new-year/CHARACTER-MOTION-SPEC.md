# SPEC-NY-02 — Character Motion System

**Status:** IMPLEMENTED WITH LIMITATIONS  
**Branch:** main  
**Scope:** add controlled character movement to the New Year performance scene without replacing the user's reference photograph.

## 1. Goal
Introduce a lightweight, dependency-free 2D motion layer for the existing HTML scene. Preserve the uploaded photograph as the identity-bearing visual source.

## 2. Architecture
- CharacterMotionController: scene state, motion intensity, reduced-motion handling.
- BodyMotion: subtle whole-image sway and breathing.
- HeadMotion: conservative whole-portrait tilt only; this is not independent head articulation.
- ArmMotion: independent decorative sleeve/hand overlays for greeting and open-arm gestures.
- MusicMotionSync: bounded reaction to analyser amplitude; audio remains the timing source.
- SceneState: intro, verse, chorus, finale.

## 3. Scene mapping
| State | Body | Arms | Head/portrait |
|---|---|---|---|
| intro | calm breathing | relaxed | very subtle sway |
| verse | gentle sway | restrained gesture | small tilt |
| chorus | stronger rhythmic sway | open celebratory gesture | gentle rhythmic tilt |
| finale | slow settle | welcoming then settle | return to neutral |

## 4. Functional requirements
1. Keep original uploaded image intact and recognizable.
2. Provide motion enable/disable and intensity control.
3. Animate torso/photo smoothly with bounded transforms.
4. Animate independent overlay arms for greeting/open-arm gestures.
5. React to music analyser without unbounded amplitude or excessive motion.
6. Stop/reduce motion when prefers-reduced-motion is active.
7. Keep all user media local in the browser.
8. Avoid external libraries and network dependencies.

## 5. Known limitation
The uploaded photo is a single raster layer. True independent rotation of the real head, shoulders, elbows, wrists and torso requires segmentation/rigging. The current implementation does not claim full skeletal animation: it animates the portrait as a whole and adds independent stylized arm overlays. Exact alignment of overlays depends on the uploaded image framing. A segmented asset workflow is a separate future scope.

## 6. Acceptance tests
- MOT-01 body sway remains bounded and smooth.
- MOT-02 portrait tilt remains subtle; independent head articulation is explicitly NOT TESTED / NOT IMPLEMENTED.
- MOT-03 arm overlays change pose by scene.
- MOT-04 scene changes update motion state.
- MOT-05 analyser amplitude is normalized and clamped.
- MOT-06 original photo remains the visible identity reference.
- MOT-07 only one animation loop is active; cleanup on pause/end/unload.
- MOT-08 controls remain usable at mobile widths.
- MOT-09 reduced-motion preference disables continuous character motion.

## 7. Verification
Static source checks, JavaScript syntax check, HTML/CSS structural checks, and repository read-back are required. Real browser/device visual alignment and live audio playback must be reported separately if no browser runtime is available.
