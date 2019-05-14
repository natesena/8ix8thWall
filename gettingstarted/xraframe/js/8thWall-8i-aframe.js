infoEl = document.querySelector('#extraInfo')
containerEl = document.createElement('p')
wordText = document.createTextNode("HOWDY")
containerEl.appendChild(wordText)
infoEl.appendChild(containerEl)


function displayText(text){
    infoEl = document.querySelector('#extraInfo')
    containerEl = document.createElement('p')
    wordText = document.createTextNode(text)
    containerEl.appendChild(wordText)
    infoEl.appendChild(containerEl)
}

// WASM Support Checking 
const wasmSupported = (() => {
    try {
    	console.log('Checking Web Assembly');
        if (typeof WebAssembly === "object"
            && typeof WebAssembly.instantiate === "function") {
            const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
            if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        }
    } catch (e) {
    }
    return false;
})();

//Registering A-frame Component
AFRAME.registerComponent('eighti', {
  //Initialisation function
  init: function () {
    displayText("registering component /n")
    //setting up variables
    //three js
    this._renderer = null;
    this._camera = null;
    this._scene = null;
    
    //eighti
    this._player = null;
    this._viewport = null;
    this._actor = null;
    this._asset = null;
    
    
    //getting ThreeJS current renderer 
    console.log(this.el.sceneEl.renderer);
    this._renderer = this.el.sceneEl.renderer;
    console.log('a-Frame Scene Renderer: ', this.el.sceneEl.renderer);
    this._renderer.autoClear = false;
    
    this._camera = this.el.sceneEl.camera;
    console.log('a-frame camera: ' ,this._camera);
    
    this._scene = this.el.sceneEl.object3D;
    console.log('a-frame scene object: ', this._scene);
    
    //////////////////////////////////////////////////
    this._clock = this.el.sceneEl.clock;
    console.log('a-frame clock: ', this._clock);
    //////////////////////////////////////////////////

    
    //eighti setup
    let applicationName= "aframecomp";
    let version = "0.1";
    
    
      // eighti
      ////////////////////////////////////////////////////
      // var data = this.data
      // console.log("data:", data)
      // this._declared = false
      // this._player = null;
      // this._viewport = null;
      // this._actor = null;
      // this._asset = null;
      // NATE TEST
      //this._scene = this.el.sceneEl.object3D
      //console.log("this._scene", this.el.sceneEl.renderer)
      //END NATE TEST
    
      // this._renderer  = this.el.sceneEl.renderer;
      // if(this.el.sceneEl.renderer){
      //  this._renderer =  this.el.sceneEl.renderer
      // }
      // console.log("this.renderer:", this._renderer)
      ////////////////////////////////////////////////////
      
    
      ////////////////////////////////////////////////////
      this._height  = this.el.sceneEl.canvas.clientHeight;
      this._width = this.el.sceneEl.canvas.clientWidth;
      //console.log({width:this._width,height:this._height});
      ////////////////////////////////////////////////////

      ////////////////////////////////////////////////////
      //this._camera = this.el.sceneEl.camera;
      ////////////////////////////////////////////////////

      EightI.Env.initialise(applicationName, version, this._onEightiInitialise.bind(this));
      console.log(JSON.stringify(EightI.Env));
  },
  _onEightiInitialise: function(){
         // Create EightI objects
          this._player = new EightI.Player(this._renderer.context);
          this._viewport = new EightI.Viewport();
          // feel like we gotta use this viewport
          //var anActor = new EightI.Actor();
          ///////////////////////////////////////////
          this._actor = new EightI.Actor();
          //////////////////////////////////////////
          let renderMethod = new EightI.RenderMethod("PointSprite");
          console.log("EIGHTI-INITIALISE- this.renderer:",this._renderer);
    
          this._asset = new EightI.Asset("https://zigcon-cdn.staging.8i.com/bridget_050418.hvrs");
          this._asset.create();
          this._asset.setLooping(true);
          // anActor.setAsset(this._asset);
          // anActor.setRenderMethod(renderMethod);
    
          this._actor.setAsset(this._asset);
          this._actor.setRenderMethod(renderMethod);
          let transform = new THREE.Matrix4();
          transform.makeScale(0.01, 0.01, 0.01);
          this._actor.setTransform(transform);
    
          //anActor.setTransform(transform);
          //this._actor = anActor;
          console.log("EIGHTI is INITIALISED");
          console.log("EightI Env after init: ",JSON.stringify(EightI.Env));
          //There needs to be some sort of callback for if the asset has been fully retrieved
     
  },
  tick: function (t){
    ////////////////////////////////////////////////
    this._camera.updateMatrixWorld();
    this._camera.matrixWorldInverse.getInverse(this._camera.matrixWorld);
    this._renderer.clear(true, true, true);
    ////////////////////////////////////////////////
        
  	if(this._player && this._actor && this._actor.asset){
        if(!this._declared){
        console.log(this._player, this._actor, this._actor.asset)
        this._declared = true
        }
         
        // Allow EightI library to update.
        EightI.Env.update();

        // Update asset.
        let assetState = this._asset.getState(); 
        
        if(!assetState.isInitialising() && !assetState.isPlaying()) {
            this._asset.play()
        }
        
        this._asset.update(t/1000);

        // Update viewport
        this._viewport.setDimensions(0, 0, this._width * window.devicePixelRatio, this._height * window.devicePixelRatio);
        this._viewport.setViewMatrix(this._camera.matrixWorldInverse);
        this._viewport.setProjMatrix(this._camera.projectionMatrix);

        // Render EightI content
        this._player.willRender(this._actor, this._viewport);
        this._player.prepareRender();
        this._player.render(this._actor, this._viewport);
    }
  }
});






