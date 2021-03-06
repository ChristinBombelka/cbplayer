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

<video class="js-cbplayer" poster="image.jpg" data-duration="250">
    <source data-src="my/video.mp4" type="video/mp4">
    <track kind="subtitles" label="German" srclang="de" src="german.vtt">
    <track kind="subtitles" label="English" srclang="en" src="english.vtt">
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
    overlaySpinner: true,
     /*  Values: true, false
     *   Show overlayer loading animation
     */
    controlHide: true,
    /*  Values: true, false
     *   Hide controls on leave player, or mouse stop moving longer as 3 seconds (controlHideTimeout)
     */
    controlHideTimeout: 3000,
    /*  Values: Number
     *   Duration for hide controls on stop mouse moving
     */
    backtracking: true,
    /*  Values: true, false
     *  Disable backtracking in progressbar
     */
    controlShowLoad: true,
    /* Values: true, false
     * Show loading animation on Play/Pause/Replay button position 
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
    disableClick: false,
    /*  Values true, false
     *  Disable click events to start/stop video
     */
}
```


## Events

### mediaIsInit

Return the initialized media element.

`mediaIsInit: function(container){}`

### mediaIsReady

Media source is set and video can play

`mediaIsReady: function(container){}`

### mediaIsPlay

Return video is start

`mediaIsPlay: function(container){}`

### mediaIsPause

Return video is paused

`mediaIsPause: function(container){}`

### mediaIsEnd

Return video is end

`mediaIsEnd: function(container){}`

### mediaChangeVolume

Return volume ist change

`mediaChangeVolume: function(container, volume){}`

### mediaTimeupdate

Return current time

`mediaTimeupdate: function(container, time)`

## Methods

### mediaPauseAll

Call to pause all played videos, with the exception of videos in backgroundmode

`$('classname').cbplayer('mediaPauseAll')`

### mediaPause

Call to pause a selected media item

`$('classname').cbplayer('mediaPause')`

### mediaPlay

Call to start a selected media initialLiveManifestSize

`$('classname').cbplayer('mediaPlay')`

### mediaRestart

Call to restart a media item, set the current time to beginning and play the media

`$('classname').cbplayer('mediaRestart')`

### mediaSetVolume

Set new Volume size (0-100)

`$('.classname').cbplayer('mediaSetVolume', 50);`

### mediaSetTime

Set new time in hh:mm:ss or ss

`$('.classname').cbplayer('mediaSetTime', '01:12');`



## Template
 ```html

 <div class="cb-player">
    <video playsinline class="js-player cb-player-media" poster="image.jpg">
 		<source data-src="video_source.m3u8" type="application/x-mpegURL">
        <track kind="subtitles" label="German" srclang="de" src="german.vtt">
        <track kind="subtitles" label="English" srclang="en" src="english.vtt">
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
        <li class="cb-player-context-item">CBplayer x.x.x</li>
        <li class="cb-player-context-item link" data-link="debug">Debug-info</li>
    </ul>

    <div class="cb-player-controls">
        <div class="cb-player-play cb-player-toggle-play">
            <span class="cb-player-button-play"></span>
            <span class="cb-player-button-pause"></span>
            <span class="cb-player-button-replay"></span>
            <span class="cb-player-button-load"></span>
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

        <div class="cb-player-subtitle">
            <div class="cb-player-subtitle-button"></div>
            <ul class="cb-player-subtitle-items">
                <li class="cb-player-subtitle-item cb-player-subtitle--selected" data-lang="">OFF</li>
                <li class="cb-player-subtitle-item" data-lang="de">German</li>
                <li class="cb-player-subtitle-item" data-lang="en">English</li>
            </ul>
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
