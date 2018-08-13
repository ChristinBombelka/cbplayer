# cbplayer

cbplayer is a HTML5 Video and Audio Player.

This player supportet m3u8 live streaming, include [hls.js](https://github.com/video-dev/hls.js) to use it.

## Get Started

 ```html
<html>
<head>
<link rel="stylesheet" type="text/css" media="all" href="styles/cbplayer.css" />
</head>

<body>

<video class="js-cbplayer" poster="image.jpg">
    <source data-src="my/video.mp4" type="video/mp4">
</video>

<script type="text/javascript" src="scripts/jquery-1.11.0.min.js"></script>
<script type="text/javascript" src="scripts/hls.light.min.js"></script>
<script type="text/javascript" src="scripts/cbplayer.js"></script>
<script>
$(".js-cbplayer").cbplayer();
</script>
</body>
</html>
 ```

## Options:

```js
{
    tpl: 'default',
    /*  Values: text,
     *  Add a other Value to use your coustom template, based of the basic template.
     */
    controlBar: true,
    /*  Values: true, false
     *  Show or hide controllbar
     */
    controlTime: true,
    /*  Values: true, false
     *  Show timer in controlls  
     */
    controlProgress: true,
    /*  Values: true, false
     *   Show progressbar in controlls
     */
    controlFullscreen: true,
    /*  Values: true, false
     *   Show fullscreen button in video controlls
     */
    controlAudio: true,
    /*  Values: true, false
     *   Show Audio bar in controlls
     */
    overlayButton: true,
    /*  Values: true, false
     *   Show overlayer play button on video player
     */
    controlHide: true,
    /*  Values: true, false
     *   Hide controls on leave player, or mouse stop moving longer as 3 seconds (controlHideTimeout)
     */
    controlHideTimeout: 3000,
    /*  Values: Number
     *   Duration for hide controls on stop mouse moving
     */
    controlHideTimeout: true,
    /*  Values: true, false
     *  Disable backtracking in progressbar
     */
    hlsStopLoad: true,
    /*  Values: true, false
    *   Stopp buffering livestreaming on stop video
    */
    volume: 100,
    /*  Values: 0-100
    *   Set default volume
    */
    volumeOrientation: 'vertical',
    /*  Values: 'vertical', 'horizontal'
    *   Set volume bar orientation
    */
    contextInfo: true,
    /*  Values: true, false
    *   Show Debug info in context menu
    */
    backgroundMode: false,
    /*  Values: true, false
    *   Video start in background mode, the video is muted, looped and automatically started. All controls be hidden and the Video not stop if started a other Video.
    */
    autoplay: false,
    /*  Values: true, false
    *   Simular with "autoplay" in HTML5 Video Tag
    */
    muted: false,
    /*  Values: true, false
    *   Simular with "muted" in HTML5 Video Tag
    */
    loop: false,
    /*  Values: true, false
    *   Simular with "loop" in HTML5 Video Tag
    */
    loop: false,
    /*  Values: true, false
    *   Simular with "loop" in HTML5 Video Tag
    */
}
```


## Events

### mediaIsInit

Return the initialized media element.

`mediaIsInit: function(container){}`

### mediaIsPlay

Return video is start stopPlayingAll

`mediaIsPlay: function(container){}`

### mediaIsPause

Return video is paused

`mediaIsPause: function(container){}`

### mediaIsEnd

Return video is end

`mediaIsEnd: function(container){}`    



## Callbacks

### mediaStopAll

Call to stop all played videos, with the exception of videos in backgroundmode

`$('classname').cbplayer('mediaStopAll')`

### mediaStop

Call to stop a selected media item

`$('classname').cbplayer('mediaStop')`

### mediaPlay

Call to start a selected media initialLiveManifestSize

`$('classname').cbplayer('mediaPlay')`

### mediaRestart

call to restart a media item, set the current time to beginning and play the media

`$('classname').cbplayer('mediaRestart')`



## Template
 ```html

 <div class="cb-player">
     <video class="js-player cb-player-media" poster="image.jpg">
 		<source data-src="video_source.m3u8" type="application/x-mpegURL">
 	</video>

    <div class="cb-player-spinner-wrap">
        <div class="cb-player-spinner"></div>
    </div>

    <div class="cb-player-overlayer-button"></div>

    <div class="cb-player-overlayer cb-player-debug">
        <div class="cb-player-overlayer-close"></div>
        <div class="cb-player-debug-item">
            <div class="cb-player-debug-item-type">Resolution:</div>
            <div class="cb-player-debug-item-value cb-debug-resolution"></div>
        </div>
        <div class="cb-player-debug-item">
            <div class="cb-player-debug-item-type">QualityLevels:</div>
            <div class="cb-player-debug-item-value cb-debug-levels"></div>
        </div>
        <div class="cb-player-debug-item">
            <div class="cb-player-debug-item-type">Buffer:</div>
            <div class="cb-player-debug-item-value cb-debug-buffer"></div>
        </div>
        <div class="cb-player-debug-item">
            <div class="cb-player-debug-item-type">Duration:</div>
            <div class="cb-player-debug-item-value cb-debug-duration"></div>
        </div>
        <div class="cb-player-debug-item">
            <div class="cb-player-debug-item-type">CurrentTime:</div>
            <div class="cb-player-debug-item-value cb-debug-current"></div>
        </div>
    </div>

    <ul class="cb-player-context">
        <li class="cb-player-context-item">CBplayer 1.2.4</li>
        <li class="cb-player-context-item link" data-link="debug">Debug-info</li>
    </ul>

    <div class="cb-player-controls">
        <div class="cb-player-play cb-player-toggle-play">
            <span class="cb-player-button-play"></span>
            <span class="cb-player-button-pause"></span>
            <span class="cb-player-button-replay"></span>
        </div>

        <div class="cb-player-time">
            <span class="cb-player-time-current">00:00</span>
            <span class="cb-player-time-seperator">/</span>
            <span class="cb-player-time-duration">00:00</span>
        </div>

        <span class="cb-player-progress" role="slider" aria-valuenow="0">
            <span class="cb-player-progress-tooltip"></span>
            <div class="cb-player-progress-hide"></div>
            <div class="cb-player-progress-play"></div>
            <div class="cb-player-progress-load"></div>
        </span>

        <div class="cb-player-volume-wrap">
            <div class="cb-player-toggle-mute">
                <span class="cb-player-button-sound"></span>
                <span class="cb-player-button-mute"></span>
            </div>

            <div class="cb-player-volume-vertical">
                <span class="cb-player-volume">
                    <div class="cb-player-volume-hide" role="slider" aria-valuenow=""></div>
                    <div class="cb-player-volume-bar"></div>
                </span>
            </div>
        </div>

        <div class="cb-player-fullscreen cb-player-toggle-fullscreen">
            <span class="cb-player-button-fullscreen-on"></span>
            <span class="cb-player-button-fullscreen-off"></span>
        </div>
    </div>

    <div class="cb-player-error">
        <div class="cb-player-error-message"></div>    
    </div>  
</div>

```
