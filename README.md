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

## Minimal setup
 
 ```html
 <div class="cb-player js-player" data-src="VIDEO_SOURCE/URL"></div>
 ```

## Options:

```js
{
    tpl: 'default',
    /*  Values: text,
     *  Add a other Value to use your coustom template, based of the basic template.
        Template example: 
        [
            {name: 'play'},
            {name: 'time', value: ['current']},
            {name: 'progress'},
            {name: 'time', value: ['duration']},
            {name: 'mute'},
            {name: 'subtitle'},
            {name: 'fullscreen'}
        ]
     */
    controlBar: true,
    /*  Values: true, false
     *  Show or hide controllbar
     */
    controlLoadButton: true,
    /*  Values: true, false
     *  Show or hide load animation on play button 
     */
    controlTime: true,
    /*  Values: true, false
     *  Show timer in controlls
     */
    controlTimeBackwards: false
    /*  Values: true, false
     *  Show timer in controlls
     */
    controlProgress: true,
    /*  Values: true, false
     *   show remaining time on duration
     */
    controlTooltip: true,
    /*  Values: true, false
     *   show tooltip on progress 
     */
    controlFullscreen: true,
    /*  Values: true, false
     *   Show fullscreen button in video controlls
     */
    controlVolume: true,
    /*  Values: true, false
     *   Show volume bar
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
    contextInfo: false,
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

### mediaMetaIsLoaded

Return media meta is loaded

`mediaMetaIsLoaded: function(container){}`

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

### mediaControlsChange

Return controls show/hide

`mediaControlsChange: function(container, isHIdden)`

## Methods

### initSource

Call init source from data attribute 

`$('classname').cbplayer('initSource')`

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
<div class="cb-player cb-player--with-subtitles cb-media-is-ready">
    <div class="cb-player-media">
        <video playsinline="" class="player js-player-self cb-player-media-source" poster="image.jpg">
            <source data-src="files/sample.mp4" type="video/mp4">
            <track default="" kind="subtitles" label="German" srclang="de" src="files/german.vtt">
            <track kind="subtitles" label="English" srclang="en" src="files/english.vtt">
        </video>
    </div>
    <div class="cb-player-spinner-wrap">
        <div class="cb-player-spinner"></div>
    </div>
    <div class="cb-player-overlayer-button"></div>
    <ul class="cb-player-context">
        <li class="cb-player-context-item">CBplayer 1.6.0</li>
    </ul>
    <div class="cb-player-controls">
        <div class="cb-player-play cb-player-toggle-play cb-player-with-load">
            <span class="cb-player-button-play"></span>
            <span class="cb-player-button-pause"></span>
            <span class="cb-player-button-load"></span>
        </div>
        <div class="cb-player-time">
            <span class="cb-player-time-current">00:00</span>
            <span class="cb-player-time-seperator">/</span>
            <span class="cb-player-time-duration">00:00</span>
        </div>
        <div class="cb-player-progress" aria-valuenow="" role="slider">
            <div class="cb-player-progress-tooltip"></div>
            <div class="cb-player-progress-hide"></div>
            <div class="cb-player-progress-play"></div>
            <div class="cb-player-progress-load"></div>
        </div>
        <div class="cb-player-volume-wrap">
            <div class="cb-player-sound">
                <span class="cb-player-sound-on"></span>
                <span class="cb-player-sound-off"></span>
            </div>
            <div class="cb-player-volume-vertical">
                <span class="cb-player-volume">
                    <div class="cb-player-volume-hide" role="slider" aria-valuenow="50"></div>
                    <div class="cb-player-volume-bar" style="width: 50%;"></div>
                </span>
            </div>
        </div>
        <div class="cb-player-subtitle">
            <div class="cb-player-subtitle-button"></div>
            <ul class="cb-player-subtitle-items">
                <li class="cb-player-subtitle-item" data-lang="">OFF</li>
                <li class="cb-player-subtitle-item cb-player-subtitle--selected" data-lang="de">German</li>
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
