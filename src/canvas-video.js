'use strict';

function CanvasVideo(videoSelector, canvasSelector) {

  var canvasPreviousTime,
      animationFrame,
      isPlaying,
      sourceWidth,
      sourceHeight,
      windowResizeTimeout;

  var sourceVideo   = document.querySelector(videoSelector),
      canvas        = document.createElement('canvas'),
      canvasContext = canvas.getContext('2d');

      canvas.setAttribute('id', videoSelector.replace(/#|\./, '') + '-canvas');

  var loopPlayback  = sourceVideo.hasAttribute('loop'),
      autoplay      = sourceVideo.hasAttribute('autoplay');


  /** Video & Canvas Styles
  ----------------------------------------------------------------------------*/
  /* Insert a stylesheet to turn off the default video controls for iOS safari,
   * this avoids showing the big play button UI element on the video before we
   * the video element.
   */
  (function insertHeadStyle() {
    if(document.getElementById('canvasVideoHeadStyle')) return;

    var headStyle = document.createElement('style');
    headStyle.setAttribute('id', 'canvasVideoHeadStyle');
    document.head.appendChild(headStyle);

    headStyle.sheet.addRule(videoSelector + '::-webkit-media-controls', 'display:none !important;');
  })()

  function replaceVideoWithCanvas() {
    /* allows stylesheet display property to be read properly, basically just
     * removes the inline style of display:none; we set at the end of this func
     */
    sourceVideo.style.display = '';
    var videoStyle = getComputedStyle(sourceVideo);

    for(var style in videoStyle) {
      try {
        canvas.style[style] = videoStyle[style];
      } catch(e) {}
    }
    sourceVideo.style.display = 'none';
  }


  /** Video Controls
  ----------------------------------------------------------------------------*/
  function play() {
    canvasPreviousTime = Date.now();
    isPlaying = true;
    canvasRenderLoop();
  }

  function pause() {
    isPlaying = false;
  }

  function seek(seconds) {
    if(seconds >= sourceVideo.duration) return;
    sourceVideo.currentTime = seconds;
  }

  function restart() {
    sourceVideo.currentTime = 0;
  }


  /** Render Loop
  ----------------------------------------------------------------------------*/
  function drawCanvasFrame() {
    canvasContext.drawImage(sourceVideo, 0, 0, sourceWidth, sourceHeight);
  }

  function canvasRenderLoop() {

    var canvasCurrentTime = Date.now();
    var elapsed = (canvasCurrentTime - canvasPreviousTime) / 1000;
    var frameDuration = (1 / 30); // 60 fps

    if(elapsed >= frameDuration) {
      /* Every time the video timeline updates, the
       * 'timeupdate' event fires on the video element.
       * Each frame is created with drawCanvasFrame() from there.
       */
      sourceVideo.currentTime = sourceVideo.currentTime + elapsed;
      canvasPreviousTime = canvasCurrentTime;
    }

    // If we are at the end of the video loop to the start
    if (sourceVideo.currentTime >= sourceVideo.duration && loopPlayback) {
      sourceVideo.currentTime = 0;
    }

    if (isPlaying) {
      animationFrame = requestAnimationFrame(function(){
        canvasRenderLoop();
      });
    } else {
      cancelAnimationFrame(animationFrame);
    }
  }


  /** Event Handlers
  ----------------------------------------------------------------------------*/
  function videoLoaded() {
    sourceWidth = this.videoWidth;
    sourceHeight = this.videoHeight;
    /* These are the dimensions of the canvas before being transformed by CSS,
     * so it should be the same as the intrinsic video source dimensions so that
     * any CSS applied in stylesheets to the video element does the same thing
     * to the canvas element.
     */
    canvas.setAttribute('width', this.videoWidth + 'px');
    canvas.setAttribute('height', this.videoHeight + 'px');
    replaceVideoWithCanvas();
  }

  function videoTimeUpdate() {
    drawCanvasFrame();
  }

  function videoCanPlay() {
    // Draw the first frame while laoding
    sourceVideo.pause();
    drawCanvasFrame();
  }

  // Update canvas styles to match video upon resize of the window, ensures that
  // any media query styles are applied appropriately.
  function updateCanvasOnResize() {
    if(windowResizeTimeout) clearTimeout(windowResizeTimeout);

    windowResizeTimeout = setTimeout(function() {
      replaceVideoWithCanvas();
    }, 100)
  }


  /** Load the video, insert the canvas to replace it
  ----------------------------------------------------------------------------*/
  sourceVideo.load();
  sourceVideo.parentNode.insertBefore(canvas, sourceVideo);


  /** Event Listeners
  ----------------------------------------------------------------------------*/
  sourceVideo.addEventListener('loadedmetadata', videoLoaded);
  sourceVideo.addEventListener('timeupdate', videoTimeUpdate);
  sourceVideo.addEventListener('canplay', videoCanPlay);
  // not sure what we're catching here... by whatever.
  // if (sourceVideo.readyState >= 2) {
  //   drawCanvasFrame();
  // }
  window.addEventListener('resize', updateCanvasOnResize)


  /** Autoplay
  ----------------------------------------------------------------------------*/
  if(autoplay) play();


  /** API
  ----------------------------------------------------------------------------*/
  return {
    play: play,
    pause: pause,
    seek: seek,
    restart: restart
  }

}
