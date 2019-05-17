// To serve this
//./serve/bin/serve -d ./gettingstarted/xr3js from the folder root directory

// Made with teamwork between 8i and 8thWall, 2019
var applicationName = "8thWall-8i"
var version = "0.1"

var theScene = null
var theRenderer = null
var theCamera = null
var thePlayer = null
var theActor = null
var theAsset = null
var assetState = null
var theViewport = null
var viewportWidth = null
var viewportHeight = null


var clock = null
var textureLoader = null
var floorImage = null

//8i is dependent on Web Assembly to be fast!
const wasmSupported = (() => {
  try {
      if (typeof WebAssembly === "object"
          && typeof WebAssembly.instantiate === "function") {
          const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
          if (module instanceof WebAssembly.Module)
              return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
  } catch (e) {
    console.log("error: ", e)
  }
  return false;
})();

const onxrloaded = () => {

  // Populates some object into an XR scene and sets the initial camera position. The scene and
  // camera come from xr3js, and are only available in the camera loop lifecycle onStart() or later.
  const initXrScene = ({scene, camera}) => {
    viewportWidth = window.innerWidth
    viewportHeight = window.innerHeight
  
    ENVSummary = JSON.stringify(EightI.Env)

    if(wasmSupported) {
      EightI.Env.registerFileURL("libeighti.wasm", "https://player.cdn.8i.com/interface/1.4/libeighti.wasm");
      EightI.Env.registerFileURL("libeighti.wast", "https://player.cdn.8i.com/interface/1.4/libeighti.wast");
      EightI.Env.registerFileURL("libeighti.temp.asm.js", "https://player.cdn.8i.com/interface/1.4/libeighti.temp.asm.js");
      let script = document.createElement('script');
      script.src = "https://player.cdn.8i.com/interface/1.4/libeighti.js";
      document.body.append(script);
      console.log('Web Assembly is available')
    } 
    else { 
      console.log('Browser does not support Web Assembly!')
    }
    textureLoader = new THREE.TextureLoader()
    textureLoader.load('./img/floor_logo_cropped.png', 
      function(texture) {
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
            
        var material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
        });
        var plane = new THREE.PlaneBufferGeometry(1, 1);
        var floor = new THREE.Mesh(plane, material);
        floor.rotation.x = Math.PI * 1.5;
        floor.scale.set(10, 10, 10);
        scene.add(floor)
      }
    )

    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.++
    camera.position.set(0, 3, 5)
  }

  XR.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
    XR.Threejs.pipelineModule(),                 // Creates a ThreeJS AR Scene.
    XR.XrController.pipelineModule(),            // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
  ])

  // Add custom logic to the camera loop. This is done with camera pipeline modules that provide
  // logic for key lifecycle moments for processing each camera frame. In this case, we'll be
  // adding onStart logic for scene initialization, and onUpdate logic for scene updates.
  XR.addCameraPipelineModule({
    // Camera pipeline modules need a name. It can be whatever you want but must be unique within
    // your app.
    name: '8thWall-8i',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR.Threejs scene to be ready before we can access it to add content. It was created in
    // XR.Threejs.pipelineModule()'s onStart method.
    onStart: ({canvasWidth, canvasHeight}) => {
      playbackContainer= document.querySelector("#playbackContainer")
      playbackContainer.style.display = "block"
      // Get the 3js scene from xr3js.
      const {scene, camera, renderer} = XR.Threejs.xrScene()
      theScene = scene
      theRenderer = renderer
      theRenderer.context.getExtension('WEBGL_debug_renderer_info')  
      theCamera = camera
      clock = new THREE.Clock()
      // Add some objects to the scene and set the starting camera position.
      initXrScene({scene, camera})
      
      try{
        EightI.Env.initialise(applicationName, version, onEightiInitialise);
      }
      catch(err){
        // displayText("initXR Error: " + err + "/n")
      }

      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
      XR.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion,
      })
    },

    // onUpdate is called once per camera loop prior to render. Any 3js geometry scene
    // would typically happen here.
    onUpdate: () => {
      //Guessing this moves everything around appropriately
      theCamera.updateMatrixWorld();
      theCamera.matrixWorldInverse.getInverse(theCamera.matrixWorld);
      theRenderer.clear(true,true,true)
    },
    onRender: () =>{
      //8i animate function takes argument t for time 
      var t = clock.getElapsedTime()

      if (thePlayer && theActor && theActor.asset){
        //What does this do?
        EightI.Env.update();
        // Update asset.
        assetState = theAsset.getState(); 
      
        if(!assetState.isInitialising() && !assetState.isPlaying()) {
            theAsset.play()
        }
        theAsset.update(t);

        // Update viewport
        theViewport.setDimensions(0, 0, viewportWidth * window.devicePixelRatio, viewportHeight * window.devicePixelRatio);
        theViewport.setViewMatrix(theCamera.matrixWorldInverse);
        theViewport.setProjMatrix(theCamera.projectionMatrix);

        // Render EightI content
        thePlayer.willRender(theActor, theViewport);
        thePlayer.prepareRender();
        thePlayer.render(theActor, theViewport);

        theRenderer.state.reset();
        theRenderer.render(theScene, theCamera);
        
      }
      //End 8i--------------------------------------------------------------------------
    }
  })

  // Call xrController.pause() / xrController.resume() when the button is pressed.
  const pauseButton = document.getElementById('pause')
  pauseButton && pauseButton.addEventListener(
    'click',
    () => {
      if (!XR.isPaused()) {
        XR.pause()
        pauseButton.innerHTML = "<i class='fas fa-play'></i>"
      } else {
        XR.resume()
        pauseButton.innerHTML = "<i class='fas fa-pause'></i>"
      }
    },
    true)
  const muteButton = document.getElementById('mute')
  muteButton && muteButton.addEventListener('click', () =>{
    console.log("Mute Clicked")
    muteButton.style.color = "black"
    muteButton.style.backgroundColor = "white"
  })

  const canvas = document.getElementById('camerafeed')
  // Call XrController.recenter() when the canvas is tapped with two fingers. This resets the
  // ar camera to the position specified by XrController.updateCameraProjectionMatrix() above.
  canvas.addEventListener(
    'touchstart', (e) => { e.touches.length == 2 && XR.XrController.recenter() }, true)
  // Open the camera and start running the camera run loop.
  XR.run({canvas})
}

function onEightiInitialise(){
  thePlayer = new EightI.Player(theRenderer.context);
  theViewport = new EightI.Viewport();
  theActor = new EightI.Actor();
  let renderMethod = new EightI.RenderMethod("PointSprite");
  theAsset = new EightI.Asset("./hvrs/Odyssey_S46B_T01_Web600_20181107_111442.hvrs");
  theAsset.create();
  theAsset.setLooping(true);
  theActor.setAsset(theAsset); //This line of code is giving me an error
  theActor.setRenderMethod(renderMethod);
  let transform = new THREE.Matrix4();
  //used to be all .01
  let scale = 0.02
  transform.makeScale(scale, scale, scale);
  theActor.setTransform(transform);
   console.log("EIGHTI is INITIALISED");
   console.log("EightI Env after init: ", JSON.stringify(EightI.Env));
}

window.onload = () => {window.XR ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)}