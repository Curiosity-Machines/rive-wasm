import "regenerator-runtime";
import { VideoSource, MeshPlane, Texture, WebGLRenderer, Application, Assets, Container, Sprite, RenderTexture, SCALE_MODES } from 'pixi.js';

// (Debug) Canvas Advanced Single
// import RiveCanvas from "../../build/bin/debug/canvas_advanced_single.mjs";

// (Debug) Canvas Advanced
// import RiveCanvas from "../../build/bin/debug/canvas_advanced.mjs";

// (Release) WebGL Advanced Single
// import RiveCanvas from "../../../js/npm/webgl_advanced_single/webgl_advanced_single.mjs";

// (Release) WebGL2 Advanced Single
import RiveCanvas from "../../build/webgl2_advanced_single.mjs"

// (Release) Canvas Advanced Single
// import RiveCanvas from "../../../js/npm/canvas_advanced_single/canvas_advanced_single.mjs";

// (Release) Canvas Advanced Single Lite
// import RiveCanvas from "../../build/canvas_advanced_lite_single/bin/release/canvas_advanced_single.mjs";

// import {checkForLeaks} from "./checkForLeaks";

import AvatarAnimation from "./look.riv";
import TapeMeshAnimation from "./tape.riv";
import BirdAnimation from "./birb.riv";
import TruckAnimation from "./truck.riv";
import AlienAnimation from "./alien_spider.riv";
import GuyAnimation from "./lil_guy.riv";
import BallAnimation from "./ball.riv";
import SwitchAnimation from "./switch_event_example.riv";
import StarAnimation from "./star.riv";
import TestText from "./text_test_2.riv";
import "./main.css";

let elapsedSeconds = 0
let drawTime = 0

const RIVE_EXAMPLES = {
  0: {
    riveFile: GuyAnimation,
    hasStateMachine: true,
    stateMachine: "State Machine 1",
  },
  1: {
    riveFile: StarAnimation,
    hasStateMachine: true,
    stateMachine: "State Machine 1",
  },
  2: {
    riveFile: TapeMeshAnimation,
    animation: "Animation 1",
  },
  3: {
    riveFile: SwitchAnimation,
    hasStateMachine: true,
    stateMachine: "Main State Machine",
  },
  4: {
    riveFile: BirdAnimation,
    animation: "idle",
  },
  5: {
    riveFile: AvatarAnimation,
    animation: "idle",
  },
  6: {
    riveFile: TestText,
    hasStateMachine: true,
    stateMachine: "State Machine 1",
  },
};

// Load in the Rive File, retrieve the default artboard, a named state machine, or a named animation
async function retrieveRiveContents({ rive, riveEx, num }) {
  async function loadDefault() {
    const { hasStateMachine } = riveEx;
    const bytes = await (
      await fetch(new Request(riveEx.riveFile))
    ).arrayBuffer();
    const file = await rive.load(new Uint8Array(bytes));
    artboard = file.defaultArtboard();
    console.log(artboard)
    if (hasStateMachine) {
      stateMachine = new rive.StateMachineInstance(
        artboard.stateMachineByName(riveEx.stateMachine),
        artboard
      );
    } else {
      animation = new rive.LinearAnimationInstance(
        artboard.animationByName(riveEx.animation),
        artboard
      );
    }
  }
  await loadDefault();

  let artboard, stateMachine, animation;

  return { artboard, stateMachine, animation };
}

async function main() {
  const numRivesToRender = 1;

  // Set canvas surface area based on the amount of rivs to render
  // To keep this simple, we'll just render each Rive with an area
  // of 250x250
  const docCanvas = document.getElementById("rive-canvas");
  docCanvas.width = 800;
  docCanvas.height = 800;

  // On touch down, make canvas full screen
  // docCanvas.addEventListener("touchstart", () => {
  //   docCanvas.requestFullscreen();
  // });

  const canvas = docCanvas.transferControlToOffscreen();
  const context = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });

  // Get camera feed, create, video element, and set src
  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;

  // NOTE this is slower on the device
  //video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 800, height: 800 } });
  video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', height: { min: 800 }, width: { min: 800 }}})

  // Print out video resolution
  await new Promise(res => video.addEventListener("loadedmetadata", res))
  console.log("Video resolution:", video.videoWidth, video.videoHeight)

  const rive = await RiveCanvas();
  await rive.onRuntimeInitialized((gl) => { })
  const riveRenderer = rive.makeRenderer(canvas, false);

  const app = new Application()
  await app.init({ canvas, width: 800, height: 800, context, preference: "webgl", autoStart: false });
  const pixiRenderer = app.renderer;

  const foregroundContainer = new Container();
  foregroundContainer.scale.set(1, -1)
  foregroundContainer.position.set(0, 800) // Rive draws upsidedown, this flips it.

  const backgroundContainer = new Container();
  backgroundContainer.scale.set(1, -1)
  backgroundContainer.position.set(0, 800) // Rive draws upsidedown, this flips it.

  const texture = await Assets.load('https://pixijs.com/assets/bunny.png');
  const camTextureSource = new VideoSource({
    resource: video,
    antialias: false,
    autoGenerateMipmaps: false,
    alphaMode: 'premultiply-alpha-on-upload'
  });

  camTextureSource.requestVideoFrameCallback = (callback) => video.requestVideoFrameCallback(callback)

  const camTexture = new Texture({ source: camTextureSource })
  const camSprite = new Sprite(camTexture);
  camSprite.scale.set(video.videoWidth/800, video.videoHeight/800)
  const bunnies = []

  for (let i = 0; i < 25; i++)
  {
     const bunny = new Sprite(texture);

     bunny.anchor.set(0.5);
     bunny.x = (i % 5) * 40 + 100 + 300;
     bunny.y = Math.floor(i / 5) * 40 + 100;
     bunnies.push(bunny)
     foregroundContainer.addChild(bunny);
  }

  for (let i = 0; i < 25; i++)
  {
     const bunny = new Sprite(texture);

     bunny.anchor.set(0.5);
     bunny.x = (i % 5) * 40 + 100 + 200;
     bunny.y = Math.floor(i / 5) * 40 + 100 + 200;
     bunnies.push(bunny)
     backgroundContainer.addChild(bunny);
  }

  app.stage.addChild(camSprite);

  // Track the artboard, animation/state machine of each Rive file we load in
  let instances = [];
  for (let i = 0; i < numRivesToRender; i++) {
    instances.push(await retrieveRiveContents({ rive, riveEx: RIVE_EXAMPLES[0] }));
  }

  const renderTexture = RenderTexture.create({ width: 800, height: 800, format: 'rgba8uint', scaleMode: 'linear', resolution: 1 });
  const outSprite = new MeshPlane({ texture: renderTexture, verticesX: 10, verticesY: 10 });
  outSprite.scale.set(1, -1);
  outSprite.position.set(0, 800); // Rive draws upsidedown, this flips it.
  const { buffer } = outSprite.geometry.getAttribute('aPosition');
  let waveTimer = 0
  rive.enableFPSCounter()

  app.stage.addChild(outSprite);

  let lastTime = 0;

  // Bind the rive offscreen texture to the pixi render texture
  riveRenderer.allocateOffscreenTargetTexture();
  const offscreenTextureId = riveRenderer.getOffscreenTargetTextureID();

  for (const prop of Object.getOwnPropertyNames(rive)) {
    const value = rive[prop]

    if (value && value.counter) {
      const esmGL = value

      for (const prop of Object.getOwnPropertyNames(esmGL)) {
        const list = esmGL[prop]

        if (list && list.constructor == Array && list[offscreenTextureId]?.constructor == WebGLTexture) {
          const renderTargetSystem = pixiRenderer.renderTarget;
          const oldCreateTexture = context.createTexture

          // HACK, 'create' the new texture by monkey patching the gl createTexture function to return rive's render target.
          context.createTexture = function() { return list[offscreenTextureId]; }
          renderTargetSystem.bind(renderTexture, false, [0, 0, 0, 0]); // Has the side effect of creating the render target
          context.createTexture = oldCreateTexture;
        }
      }
    }
  }

  function draw(time) {
    if (!lastTime) lastTime = time;
    const elapsedMs = time - lastTime;
    elapsedSeconds = elapsedMs / 1000;
    lastTime = time;
    drawTime = time;

    pixiRenderer.state.reset()
    pixiRenderer.shader._activeProgram = null
    pixiRenderer.geometry._activeVao = null
    pixiRenderer.geometry._activeGeometry = null
    pixiRenderer.render({ container: backgroundContainer, clear: true, target: renderTexture })

    riveRenderer.clear(true /* preserveRenderTarget */);

    // // Needed to ensure rive renders properly after pixi
    context.pixelStorei(context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    let trackX = 0;
    let trackY = 0;
    const colMax = 2;

    // For each Rive we loaded, advance the animation/state machine and artboard by elapsed
    // time since last frame draw and render the Artboard to a piece of the canvas using
    // the Renderer's align methoj
    for (let i = 0; i < numRivesToRender; i++) {
      let { artboard, stateMachine, animation } = instances[i];
      if (artboard) {
        if (stateMachine) {
          stateMachine.advance(elapsedSeconds);
        }
        if (animation) {
          animation.advance(elapsedSeconds);
          animation.apply(1);
        }
        artboard.advance(elapsedSeconds);
        riveRenderer.save();
        // Draw to a 250x250 piece of the canvas and track "position"
        // in grid to move to the next piece to render the next Rive
        riveRenderer.align(
          rive.Fit.contain,
          rive.Alignment.center,
          {
            minX: trackX,
            minY: trackY,
            maxX: trackX + 800,
            maxY: trackY + 800,
          },
          artboard.bounds
        );
        if ((i + 1) % colMax === 0) {
          trackX = 0;
          trackY += 20;
        } else {
          trackX += 20;
        }

        // Pass along our Renderer to the artboard, so that it can draw onto the canvas
        artboard.draw(riveRenderer);
        riveRenderer.restore();
      }
    }
    
    riveRenderer.flush();
    riveRenderer.unbindResources();

    for (const bunny of bunnies) {
        bunny.rotation += elapsedSeconds * 5;
    }

    for (let i = 0; i < buffer.data.length; i++)
    {
        buffer.data[i] += Math.sin(waveTimer / 15 + i) * 0.4;
    }

    buffer.update();
    waveTimer++;

    pixiRenderer.state.reset()
    context.activeTexture(context.TEXTURE0); // Needed because rive doesn't reset the active texture

    //// // Need to reset all the GL state in pixi that isn't done normally
    pixiRenderer.shader._activeProgram = null
    pixiRenderer.geometry._activeVao = null
    pixiRenderer.geometry._activeGeometry = null

    pixiRenderer.render({ container: foregroundContainer, clear: false, target: renderTexture })
    pixiRenderer.render({ container: app.stage, target: null })

    // docContext.globalCompositeOperation = "copy";
    // docContext.drawImage(canvas, 0, 0);
    // Call the next frame!
    rive.requestAnimationFrame(draw);
  }
  // Start the animation loop
  rive.requestAnimationFrame(draw);
}

main();
