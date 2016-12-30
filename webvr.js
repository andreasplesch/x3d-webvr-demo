(function(){

var runtime = null;

var rtLeft, rtRight;
var _renderScale = 0.5; // 1

var vrHMD = null;

var frameData = null;
if ('VRFrameData' in window) {
  frameData = new VRFrameData();
}

var WebVRSupport = {};
window.WebVRSupport = WebVRSupport;

// defaults element IDs/defs, normally always passed
var _viewpoint = "viewpoint";
var _background = "background";
var _scene = "scene";

var _x3dEl = "x3d-elem";
var _x3dSize = {};
  
var viewpoint;
var _initialPosition;

var enterVRPrompt;
var _enterVRMessage = 'Ready to use VR headset !';
var _mirrorDisplay = false;
var _scaleToHMD = true;

/*
options
*/
function _initialize( options ) {
  _log('Initialize WebVR support');

  if (options.viewpoint)
    _viewpoint = options.viewpoint;
  if (options.background)
    _background = options.background;
  if (options.scene)
    _scene = options.scene;
  if (options.renderScale)
    _renderScale = options.renderScale;
  if (options.x3dEl)
    _x3dEl = options.x3dEl;
  if (options.enterVRMessage)
    _enterVRMessage = options.enterVRMessage;
  if (options.mirrorDisplay !== null)
    _mirrorDisplay = options.mirrorDisplay;
  if (options.scaleToHMD !== null)
    _scaleToHMD = options.scaleToHMD;
  
  if (document.readyState === 'complete') {
    load();
  } else {
    window.addEventListener('load', function ld(){
      window.removeEventListener('load', ld);
      load();
    });
  }
}

WebVRSupport.initialize = _initialize;

function load() {
  _log('Inject webvr x3d nodes');

  viewpoint = document.getElementById(_viewpoint);
  if (viewpoint === null) {
    console.log('viewpoint ID: ' + _viewpoint + ' not found');
    return;
  }
  _initialPosition = viewpoint.getFieldValue('position');
  
  // disable direct rendering, by wrapping content in non-rendered group
  
  var rootGroup = document.createElement('Group');
  rootGroup.setAttribute('render', 'false');
  var theScene = document.querySelector( '[DEF="' + _scene + '"]' );
  theScene.parentNode.appendChild(rootGroup);
  var sceneGroup = document.createElement('Group');
  sceneGroup.setAttribute('DEF', _scene);
  //x3dom needs step by step removal
  while (theScene.firstChild) {
    sceneGroup.appendChild( theScene.removeChild( theScene.firstChild ) );
  }
  theScene.parentNode.removeChild(theScene);
  rootGroup.appendChild(sceneGroup);
  
/*  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'webvr.x3d');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        var text = xhr.responseText;
*/
        var text = getStereoX3D();
        text = text.replace(/\$VIEWPOINT/g, _viewpoint);
        text = text.replace(/\$BACKGROUND/g, _background);
        text = text.replace(/\$SCENE/g, _scene);

        var node = document.createElement('Group');
        node.innerHTML = text;

        var scene = document.querySelector('Scene');
        scene.appendChild(node);

        init();
  /*
      } else {
        _log('error: could not load webvr.x3d');
      }
    }
  }

  xhr.send();
*/
}

function init() {
  runtime = document.getElementById(_x3dEl).runtime;
  //save original size
  _x3dSize.height = runtime.doc.getAttribute('height');
  _x3dSize.width = runtime.doc.getAttribute('width');
  
  var ns = "";
  ns = "Webvr__";
  rtLeft = document.getElementById( ns + 'rtLeft');
  rtRight = document.getElementById( ns + 'rtRight');


  disableControls();


  //runtime.enterFrame = enterFrame;

  requestAnimationFrame(enterFrame);
 
  // update viewpoint based on HMD pose
  function enterFrame() {
    if (!vrHMD) {
      window.requestAnimationFrame(enterFrame);
      return;
    } else {
      vrHMD.requestAnimationFrame(enterFrame); // native framerate if presenting
    }
/*
    var state = getPose(vrHMD);

    if (state.orientation !== null) {
      var o = state.orientation;
      var ori = viewpoint.requestFieldRef('orientation');
      ori.x = o[0];
      ori.y = o[1];
      ori.z = o[2];
      ori.w = o[3];
      viewpoint.releaseFieldRef('orientation');
    }
    if (state.position !== null) {
      var p = state.position;
      var posi = viewpoint.requestFieldRef('position');
      posi.x = _initialPosition.x + p[0];
      posi.y = _initialPosition.y + p[1];
      posi.z = _initialPosition.z + p[2];
      viewpoint.releaseFieldRef('position');
    }
*/
    runtime.triggerRedraw(); //necessary since no mutations anymore
    if (vrHMD.isPresenting) {
      vrHMD.submitFrame();
    }

  };

  runtime.exitFrame = function() {
    return; // temp

    runtime.triggerRedraw();
  };

  if (isWebVRSupported()) {
    navigator.getVRDisplays().then(vrDisplayCallback);
  } else {
    console.error('No WebVR 1.0 support');
  }


  // inject enter/exit VR button
  var enterVRBtn = document.createElement('button');
  enterVRBtn.setAttribute('id', 'enter-vr-btn');
  var enterVRStyle = document.createElement('style');
  enterVRStyle.textContent = ' .enter-vr-default {\
    background: rgba(0, 0, 0, 0.35) url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20245.82%20141.73%22%3E%3Cdefs%3E%3Cstyle%3E.a%7Bfill%3A%23fff%3Bfill-rule%3Aevenodd%3B%7D%3C%2Fstyle%3E%3C%2Fdefs%3E%3Ctitle%3Emask%3C%2Ftitle%3E%3Cpath%20class%3D%22a%22%20d%3D%22M175.56%2C111.37c-22.52%2C0-40.77-18.84-40.77-42.07S153%2C27.24%2C175.56%2C27.24s40.77%2C18.84%2C40.77%2C42.07S198.08%2C111.37%2C175.56%2C111.37ZM26.84%2C69.31c0-23.23%2C18.25-42.07%2C40.77-42.07s40.77%2C18.84%2C40.77%2C42.07-18.26%2C42.07-40.77%2C42.07S26.84%2C92.54%2C26.84%2C69.31ZM27.27%2C0C11.54%2C0%2C0%2C12.34%2C0%2C28.58V110.9c0%2C16.24%2C11.54%2C30.83%2C27.27%2C30.83H99.57c2.17%2C0%2C4.19-1.83%2C5.4-3.7L116.47%2C118a8%2C8%2C0%2C0%2C1%2C12.52-.18l11.51%2C20.34c1.2%2C1.86%2C3.22%2C3.61%2C5.39%2C3.61h72.29c15.74%2C0%2C27.63-14.6%2C27.63-30.83V28.58C245.82%2C12.34%2C233.93%2C0%2C218.19%2C0H27.27Z%22%2F%3E%3C%2Fsvg%3E) 50% 50% no-repeat;\
    background-size: 70% 70%;\
    border: 0;\
    bottom: 0;\
    cursor: pointer;\
    min-width: 50px;\
    min-height: 30px;\
    padding-right: 5%;\
    padding-top: 4%;\
    position: absolute;\
    right: 0;\
    transition: background-color .05s ease;\
    -webkit-transition: background-color .05s ease;\
    z-index: 9999;\
  }\
  .enter-vr-default:hover {\
    background-color: rgba(120, 120, 120, .65);\
  }';
  enterVRBtn.setAttribute('class', 'enter-vr-default enter-vr-custom');
  document.head.appendChild(enterVRStyle);
  runtime.doc.appendChild(enterVRBtn);
  enterVRBtn.addEventListener('click', function(event){
    enterVR();
  });
  
  //create mask with headset prompt
  enterVRPrompt = document.createElement('div');
  enterVRPrompt.textContent = _enterVRMessage ;
  var enterVRPromptStyle = document.createElement('style');
  enterVRPromptStyle.textContent = ' .enter-vr-prompt-default {\
    background: grey;\
    width: 100%;\
    height: 100%;\
    position: absolute;\
    z-index: 999;\
    box-sizing: border-box;\
    display: none;\
    padding: 100px;\
    font-family: monospace;\
    font-size: 24px;\
  }';
  enterVRPrompt.setAttribute('class', 'enter-vr-prompt-default enter-vr-prompt-custom');
  document.head.appendChild(enterVRPromptStyle);
  runtime.doc.appendChild(enterVRPrompt);
  
};

function isWebVRSupported() {
  return ('getVRDisplays' in navigator);
}

function getPose(vrDisplay) {
  var pose = null;
  if (vrDisplay.getFrameData) { // '1.1'
    vrDisplay.getFrameData(frameData);
    pose = frameData.pose;
  } else if (vrDisplay.getPose) { // deprecated
    pose = vrDisplay.getPose();
  }
  return pose;
}

// toggles
function enterVR() {
  if (!vrHMD) {
    _log('No VR headset attached');
    return;
  }

  if (!vrHMD.isPresenting) {
    var canvas = runtime.canvas.canvas;
    vrHMD.requestPresent( [ { source: canvas } ] )
      .then(function(){
        var leftEye = vrHMD.getEyeParameters("left");
        var rightEye = vrHMD.getEyeParameters("right");
      //attributes override all styles
        var canvas = runtime.canvas.canvas;
        if (_scaleToHMD) {
          canvas.style.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2 + 'px';
          canvas.style.height = Math.max(leftEye.renderHeight, rightEye.renderHeight) + 'px';
        }
        if (!_mirrorDisplay && vrHMD.capabilities.hasExternalDisplay) // skip if mobile or explicit mirroring
          enterVRPrompt.style.display = 'block'; //show message
        _log('Started VR presenting');
    });
  } else {
    vrHMD.exitPresent().then(function(){
      //restore attributes, or if null, styles
      var canvas = runtime.canvas.canvas;
      canvas.style.width = _x3dSize.width;
      canvas.style.height = _x3dSize.height;
      enterVRPrompt.style.display = 'none';
      _log('Exited VR presenting');
    });
  }
}

WebVRSupport.enterVR = enterVR;

function vrDisplayCallback(vrdisplays) {
  if (vrdisplays.length) {
    vrHMD = vrdisplays[0];
    window.requestAnimFrame = vrHMD.requestAnimationFrame ; // x3dom uses this; for internal animations; probably not necessary
    _log(vrHMD);
  } else {
    _log('NO VRDisplay found');
    alert("Didn't find a VR display!");
    return;
  }

  var leftEyeParams, rightEyeParams,
      leftFOV, rightFOV,
      leftTranslation, rightTranslation;

  leftEyeParams = vrHMD.getEyeParameters("left");
  rightEyeParams = vrHMD.getEyeParameters("right");
  _log(leftEyeParams);
  _log(rightEyeParams);

  if (leftEyeParams !== null) { 
    leftFOV = leftEyeParams.fieldOfView;
    rightFOV = rightEyeParams.fieldOfView;
  
  // TODO: use to updated views
  // -currently using default in x3dom: 0.064 IPD
    leftTranslation = leftEyeParams.offset;
    rightTranslation = rightEyeParams.offset;
  }
  _log(leftFOV);
  _log(rightFOV);
  _log(leftTranslation);
  _log(rightTranslation);

  //modifyRTs(leftEyeParams, rightEyeParams);
}

function modifyRTs(lEyeParams, rEyeParams) {
  var lW = Math.round(lEyeParams.renderWidth * _renderScale);
  var lH = Math.round(lEyeParams.renderHeight * _renderScale);
  var rW = Math.round(rEyeParams.renderWidth * _renderScale);
  var rH = Math.round(rEyeParams.renderHeight * _renderScale);

  var color_depth = '4';

  rtLeft.setAttribute('dimensions',  lW + ' ' + lH + ' ' + color_depth);
  rtRight.setAttribute('dimensions', rH + ' ' + rH + ' ' + color_depth);
}

var _navType = "";
function disableControls() {
  var navs = document.getElementsByTagName('navigationInfo');
  if (navs.length) {
    _navType = navs[0].getAttribute('type');
    navs[0].setAttribute('type', '');
  }
}

function enableControls() {
  var navs = document.getElementsByTagName('navigationInfo');
  if (navs.length) {
    navs[0].setAttribute('type', _navType);
  }
}

var enableLogging = true;
function _log() {
  if (!enableLogging) return;
  console.log.apply(console, arguments);
}
  
function getStereoX3D() {
  var x3dText = '\
<Group id="Webvr__stereoRt" render="true">\
  <Group DEF="left">\
    <Shape>\
      <Appearance>\
        <RenderedTexture id="Webvr__rtLeft"\
          stereoMode="LEFT_VR" vrDisplay="0" update="ALWAYS"\
          dimensions="1024 1024 4" repeatS="false" repeatT="false">\
          <Viewpoint  USE="$VIEWPOINT"  containerField="viewpoint"></Viewpoint>\
          <Background USE="$BACKGROUND" containerField="background"></Background>\
          <Group      USE="$SCENE"      containerField="scene"></Group>\
        </RenderedTexture>\
        <ComposedShader>\
          <Field name="tex" type="SFInt32" value="0"></Field>\
          <Field name="eye" type="SFInt32" value="-1.0"></Field>\
          <ShaderPart DEF="vert" type="VERTEX">\
          attribute vec3 position;\
          attribute vec2 texcoord;\
          \
          uniform mat4 modelViewProjectionMatrix;\
          uniform float eye;\
          varying vec2 fragTexCoord;\
          \
          void main()\
          {\
            vec2 pos = sign(position.xy);\
            fragTexCoord = texcoord;\
            \
            gl_Position = vec4((pos.x + 1.0 * eye) / 2.0, pos.y, 0.0, 1.0);\
          }\
          </ShaderPart>\
          <ShaderPart DEF="frag" type="FRAGMENT">\
          #ifdef GL_ES \n\
          precision highp float; \n\
          #endif \n\
          \
          uniform sampler2D tex;\
          varying vec2 fragTexCoord;\
          \
          void main()\
          {\
            gl_FragColor = texture2D(tex, fragTexCoord);\
          }\
          </ShaderPart>\
        </ComposedShader>\
      </Appearance>\
      <Plane solid="false"></Plane>\
    </Shape>\
  </Group>\
  <Group DEF="right">\
    <Shape>\
      <Appearance>\
        <RenderedTexture id="Webvr__rtRight"\
          stereoMode="RIGHT_VR" vrDisplay="0" update="ALWAYS"\
          dimensions="1024 1024 4" repeatS="false" repeatT="false">\
          <Viewpoint  USE="$VIEWPOINT"  containerField="viewpoint"></Viewpoint>\
          <Background USE="$BACKGROUND" containerField="background"></Background>\
          <Group      USE="$SCENE"      containerField="scene"></Group>\
        </RenderedTexture>\
        <ComposedShader>\
          <Field name="tex" type="SFInt32" value="0"></Field>\
          <Field name="eye" type="SFInt32" value="1.0"></Field>\
          <Shaderpart USE="vert" type="VERTEX">\
          </Shaderpart>\
          <Shaderpart USE="frag" type="FRAGMENT">\
          </Shaderpart>\
        </ComposedShader>\
      </Appearance>\
      <Plane solid="false"></Plane>\
    </Shape>\
  </Group>\
</Group>\
<Viewpoint DEF="WEBVR_AOPT_CAM"\
    centerOfRotation="3.4625 1.73998 -5.55"\
    position="3.4625 1.73998 8.69028">\
</Viewpoint>\
';
  return x3dText;
}
})();
