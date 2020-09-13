/*!
 * jQuery CBplayer 1.4.5
 * 2020-09-12
 * Copyright Christin Bombelka
 * https://github.com/ChristinBombelka/cbplayer
 */

;(function ( $, window, document, undefined ) {
	var pluginName = 'cbplayer',
	 	playerVersion = '1.4.5',
		hls,
		watchProgress,
		watchFullscreen,
		watchControlHide,
		timeoutMeta,
		defaults = {
		tpl : 'default',
		/*
			use custom player template
			settings: default, false
		*/
		controlBar: true,
		/* enable/disable complete controls */
		controlTime: true,
		/* enable/disable  current/duration time */
		controlProgress: true,
		/* enable/disable progress bar */
		controlFullscreen: true,
		/* enable/disable fullscreen button */
		controlAudio: true,
		/* enable/disable mute/volume */
		overlayButton: true,
		/* enable/disable overlay play button*/
        overlaySpinner: true,
        /* enable/disable overlay spinner*/
		controlHide: true,
		/* hide controls on leave container or mousemove stop longer as 'controlHideTimeout' */
		controlHideTimeout: 3000,
		/* timeout to hide control on mousemove */
		backtracking: true,
		/* disable duratuon/progressbar */
		controlShowLoad: true,
		/* show loading animation on play/pause/replay button*/
		hlsStopLoad: false,
		/* stop buffering hls stream on video stop*/
		volume: 100,
		/* set volume */
		volumeOrientation: 'vertical',
		/* set volumeslider orientation - vertival/horizontal */
		contextInfo: false,
		/* set context info - debug mode */
		backgroundMode: false,
		/* video autostart/loop/muted - never stop on start other videos */
		autoplay: false,
		/* video autoplay */
		muted: false,
		/* video muted*/
		loop: false,
		/* video loop*/
		disableClick: false,
		/* disable click events on media */
		mediaIsInit: false,
		/* callback media container create */
		mediaIsReady: false,
		/* ballback media is ready to play*/
		mediaIsPlay: false,
		/* callback media start play */
		mediaIsPause: false,
		/* callback media stop */
		mediaIsEnd: false,
		/* callback media end play */
		mediaChangeVolume: false,
		/* callback change volume */
		mediaTimeupdate: false,
		/* callback time update */
		initSource: $,
		mediaStopAll: $,
		mediaStop: $,
		mediaPlay: $,
		mediaRestart: $,
		mediaSetVolume : $,
		mediaSetTime : $
	}

	function isTouchDevice(){
		return 'ontouchstart' in window || navigator.maxTouchPoints;
	}

	function timeRangesToString(r) {
		var log = [];
		for (var i = 0; i < r.length; i++) {
			log.push(Math.round(r.start(i)) + "," + Math.round(r.end(i)));
		}
		return log;
	}

	function videoBuffer(container) {
		var player = container.find('.cb-player-media')[0];
		var buffer = player.buffered;
		var bufferingDuration;

		if (buffer) {
			var pos = player.currentTime,bufferLen;
			  for (var i=0, bufferLen=0; i < buffer.length; i++) {
				var start = buffer.start(i) / player.duration;
				var end = buffer.end(i) / player.duration;
				if(pos >= buffer.start(i) && pos < buffer.end(i)) {
				  bufferLen = buffer.end(i) - pos;
				}
			}

			container.data({
				'buffer' : bufferLen,
			});
		}

		if(!container.data('duration')){
			var timeRanges = timeRangesToString(player.played),
				duration = 0;

			if(timeRanges.length){
				var t = timeRanges[0];
				duration = t.split(',')[0];

				if(duration == 0){
					duration = player.duration;
				}
			}

			container.data({
				'duration': Math.round(duration),
			});
		}

		var timeRanges = timeRangesToString(player.seekable),
			currentDuration = 0;

		if(timeRanges.length){
			var t = timeRanges[0];
			currentDuration = t.split(',')[1];
		}

		container.data({
			'currentDuration' : currentDuration,
		});
	}

	function displayError(container, message){
		container.find('.cb-player-error-message').text(message);
		container.addClass('cb-media-is-error');
		container.removeClass('cb-player-is-loaded');
	}

	function fileExist(src){
		var http = new XMLHttpRequest();

	    http.open('HEAD', src, false);
	    http.send();

	    return http.status != 404;
	}

	function getPlayerSrc(container, autostart){
		if(container.hasClass('cb-player-is-loaded') || container.hasClass('cb-media-is-ready')){
			return;
		}

		if (typeof autostart === 'undefined' || autostart === null) {
			var autostart = true;
		}

		if(!container.data('backtracking')){
			container.addClass("cb-player-progressbar-off");
		}

		container.removeClass("cb-payer-is-replay");

		var settings = container.data('settings'),
			media = container.find(".cb-player-media"),
			timeoutMeta;

		if(media.attr('src')){
			mediaSrcEl = media;
			mediaSrc = mediaSrcEl.attr('src');
		}else if(media.data('src')){
			mediaSrcEl = media;
			mediaSrc = mediaSrcEl.data('src');
		}else if(media.find("source").attr('src')){
			mediaSrcEl = media.find("source");
			mediaSrc = mediaSrcEl.attr('src');
		}else if(media.find("source").data('src')){
			mediaSrcEl = media.find("source");
			mediaSrc = media.find("source").data('src');
		}else{
			return
		}

		if(mediaSrc.match(/(.m3u8)/) && typeof Hls === 'undefined'){
			displayError(container, 'hls.js ist not found');
			return;
		}

		if(mediaSrc.match(/(.m3u8)/) && Hls.isSupported()){
			var config = {
				startPosition : -1,
				capLevelToPlayerSize: false,
				debug: false,
				defaultAudioCodec: undefined,
				initialLiveManifestSize: 1,
				maxBufferLength: 30,
				maxMaxBufferLength: 600,
				maxBufferSize: 60*1000*1000,
				maxBufferHole: 0.5,
				lowBufferWatchdogPeriod: 0.5,
				highBufferWatchdogPeriod: 3,
				nudgeOffset: 0.1,
				nudgeMaxRetry : 3,
				maxFragLookUpTolerance: 0.2,
				liveSyncDurationCount: 3,
				enableWorker: true,
				enableSoftwareAES: true,
				manifestLoadingTimeOut: 10000,
				manifestLoadingMaxRetry: 1,
				manifestLoadingRetryDelay: 500,
				manifestLoadingMaxRetryTimeout : 64000,
				startLevel: undefined,
				levelLoadingTimeOut: 10000,
				levelLoadingMaxRetry: 4,
				levelLoadingRetryDelay: 500,
				levelLoadingMaxRetryTimeout: 64000,
				fragLoadingTimeOut: 20000,
				fragLoadingMaxRetry: 6,
				fragLoadingRetryDelay: 500,
				fragLoadingMaxRetryTimeout: 64000,
				startFragPrefetch: false,
				appendErrorMaxRetry: 3,
				enableWebVTT: true,
				enableCEA708Captions: true,
				stretchShortVideoTrack: false,
				maxAudioFramesDrift : 1,
				forceKeyFrameOnDiscontinuity: true,
				abrEwmaFastLive: 5.0,
				abrEwmaSlowLive: 9.0,
				abrEwmaFastVoD: 4.0,
				abrEwmaSlowVoD: 15.0,
				abrEwmaDefaultEstimate: 500000,
				abrBandWidthFactor: 0.95,
				abrBandWidthUpFactor: 0.7,
				minAutoBitrate: 0
			}

			hls = new Hls(config);
			hls.attachMedia(media[0]);
			hls.loadSource(mediaSrc);
			container.addClass("cb-media-is-ready");

			hls.on(Hls.Events.ERROR,function(event, data) {
				if(container.hasClass('cb-player-is-playing')){
					return;
				}

				switch(data.details) {
					case Hls.ErrorDetails.MANIFEST_LOAD_ERROR:
						try {
							displayError(container, 'cannot Load Manifest' + data.context.url);
							if(data.response.code === 0) {
								displayError(container, "this might be a CORS issue, consider installing <a href=\"https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi\">Allow-Control-Allow-Origin</a> Chrome Extension");
							}
						} catch(err) {
							displayError(container, 'cannot Load' + data.context.url);
					}
					break;
				case Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT:
					displayError(container, 'timeout while loading manifest');
					break;
				case Hls.ErrorDetails.MANIFEST_PARSING_ERROR:
					displayError(container, 'error while parsing manifest:' + data.reason);
					break;
				case Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT:
					displayError(container, 'timeout while loading level playlist');
					break;
				case Hls.ErrorDetails.FRAG_LOAD_ERROR:
					displayError(container, 'error while loading fragment');
					break;
				case Hls.ErrorDetails.FRAG_LOAD_TIMEOUT:
					displayError(container, 'timeout while loading fragment');
					break;
				case Hls.ErrorDetails.BUFFER_APPEND_ERROR:
					displayError(container, 'Buffer Append Error');
					break;
				default:
					break;
				}

				if(data.fatal){
					displayError(container, 'The Livestream is not available.');

					container.removeClass("cb-player-is-loaded");
					hls.destroy();
					return;
				}
			});

			hls.on(Hls.Events.MEDIA_ATTACHED, function (event, data){
				container.addClass("cb-player-is-loaded");
			});

			hls.on(Hls.Events.MANIFEST_PARSED,function(event, data) {
				container.removeClass('cb-player-initialized');

				setVolume(container, container.data('volume'));

				if(autostart){
					toggleMediaStartSTopp(container);
				}

				container.data({
					'levels': data.levels,
					'level': hls.currentLevel + 1,
					'is_hls': true,
					'videowidth': data.levels[0].width,
					'videoheight': data.levels[0].height
				});
			});

			var firstLoad = true,
				watchLiveDuration = 0;
			hls.on(Hls.Events.LEVEL_LOADED,function(event,data) {

				if(data.details.live){
					container.addClass('cb-player-is-livestream');
					container.data({
						'is-livestream': data.details.live,
						'fragmentDuration': data.details.averagetargetduration,
					});
				}

				if(firstLoad){

					if(container.data('is-livestream')){
						container.find('.cb-player-progress').attr('aria-valuenow', 100);
					}

					container.find('.cb-player-time-duration').text(formatTime(data.details.totalduration, container));
					container.data('duration', data.details.totalduration);

					if(!mediaSrcEl.attr('video')){
						mediaSrcEl.remove();
					}

					firstLoad = false;
				}
			});

			hls.on(Hls.Events.FRAG_BUFFERED,function(event, data) {

				if(!container.data('bufferTimer')){
					container.data('bufferTimer', true);

					hls.bufferTimer = window.setInterval(function(){
						videoBuffer(container);
					}, 200);
				}

				container.data({
					'level': hls.currentLevel + 1,
				});

				container.removeClass("cb-player-is-loaded");
			});

		}else if(mediaSrc.match(/(.mp4)/) || (mediaSrc.match(/(.m3u8)/) && Hls) ){
			// (Hls && (!isSupported() && mediaSrc.match(/(.m3u8)/)) || mediaSrc.match(/(.mp4)/)

			if(fileExist(mediaSrc) === false){
				displayError(container, 'File not exist');
				return;
			}

			mediaSrcEl.attr("src", mediaSrc);
			media[0].load();

			container.addClass("cb-player-is-loaded");

			media.on('loadstart', function(){
				timeoutMeta = setTimeout(function(){
					//displayError(container, 'Timeout - File cannot loaded');
				}, 3000);
			});

			media.on('loadedmetadata', function(){

				clearTimeout(timeoutMeta);

				var mediaDuration = formatTime(media[0].duration, media.closest(".cb-player"));
				media.closest(".cb-player").find(".cb-player-time-duration").text(mediaDuration);

				container.addClass("cb-media-is-ready");
				container.removeClass('cb-player-initialized');

				container.data({
					'videowidth': media[0].videoWidth,
					'videoheight': media[0].videoHeight,
					'duration': media[0].duration
				});

				setVolume(container, container.data('volume'));

				if(autostart){
					toggleMediaStartSTopp(container);
				}
			});

		}else if (mediaSrc.match(/(.mp3)/)){

			if(fileExist(mediaSrc) === false){
				displayError(container, 'File not exist');
				return;
			}
			mediaSrcEl.attr("src", mediaSrc);
			media[0].load();

			container.addClass("cb-player-is-loaded");

			media.on('loadstart', function(){
				timeoutMeta = setTimeout(function(){
					//displayError(container, 'Timeout - File cant loaded');
				}, 3000);
			});

			media.on('loadedmetadata', function(){
				var mediaDuration = formatTime(media[0].duration, media.closest(".cb-player"));

				clearTimeout(timeoutMeta);

				media.closest(".cb-player").find(".cb-player-time-duration").text(mediaDuration);

				container.addClass("cb-media-is-ready");
				container.removeClass('cb-player-initialized');

				container.data({
					'duration': media[0].duration
				});

				if(autostart){
					toggleMediaStartSTopp(container);
				}
			});

		}else{
			displayError(container, 'File Type not Supported.');
			return;
		}

		if ($.isFunction(settings.mediaIsReady)) {
			settings.mediaIsReady.call(this, container);
		}
	}

	function stopPlayingAll(el){
		$('.cb-player-is-playing').not(el).each(function(){
			var container = $(this),
				player = container.find('.cb-player-media')[0];

			if(!container.data('backgroundMode')){
				if(container.hasClass('cb-media-is-ready') && !player.paused){
					//Fix Clear DOM before call pause
					$('body').height();

					player.pause();
				}
			}
		});
	}

	function videoStart(container, player){
		if(typeof hls !== 'undefined' && container.data('hlsStopLoad')){
			hls.startLoad();
		}

		var promise = player.play();

		if (promise !== undefined) {
			promise.then( function() {
				clearInterval(watchProgress);

				if(!container.data('backgroundMode')){
					stopPlayingAll(container);
				}

				watchProgress = setInterval(function(){
					watchProgressLoading(player);
				}, 500);
			}).catch( function() {
				console.log(promise);
			});
		}
	}

	function videoStop(player){
		player.pause();

		clearInterval(watchProgress);
	}

	function toggleMediaStartSTopp (container){
		var player = container.find('.cb-player-media')[0];

		if(!container.data('backgroundMode')){
			stopPlayingAll(container);
		};

		if (player.paused) {

			videoStart(container, player);

		} else {

			videoStop(player);
		}

		container.removeClass('cb-player-initialized');
	}

	function initPlayer(container) {

		if(container.hasClass('cb-player-initialized')){
			return;
		}

		container.addClass('cb-player-initialized');

		if(container.hasClass("cb-media-is-ready")){
			toggleMediaStartSTopp(container);
		}else{
			getPlayerSrc(container);
		}
	}

	function watchProgressLoading(player){
		var container = $(player).closest(".cb-player");

		if(container.data('backtracking') == true){
			for (var i = 0; i < player.buffered.length; i++) {
				var buffer = player.buffered,
					time = player.currentTime;

				if(buffer.start(i) <= time && time <= buffer.end(i)){
					var loadPercentage = buffer.end(i) / player.duration * 100;
				}
			}

			container.find('.cb-player-progress-load').css('width', loadPercentage + '%');
		}
	}

	function setVolume(container, volume) {
		var player = container.find('.cb-player-media'),
			slider = container.find(".cb-player-volume-hide"),
			progress = container.find(".cb-player-volume-bar");

		if(volume.target){
			var e = volume;

			var sliderContainerV = container.find(".cb-player-volume-vertical"),
				sliderContainerH = container.find(".cb-player-volume-horizontal");

			if(sliderContainerH.length){
				volume =(e.pageX - slider.offset().left) / slider.width() * 100;
			}else if(sliderContainerV.length){
				volume = ((e.pageY - slider.offset().top - slider.width()) / slider.width()) * -1;
				volume = volume  * 100;
			}

			volume = Math.round(volume);

			if(volume < 0){
				volume = 0;
			}

			if(volume > 100){
				volume = 100;
			}
		}

		if(typeof volume === 'undefined'){
			return;
		}

		player[0].volume = volume / 100;

		if(slider.length && progress.length){
			slider.attr('aria-valuenow', volume);
			progress.css('width', volume + '%');
		}

		if(volume == 0){
			container.addClass("cb-player-is-muted");
			player.prop('muted', true);
		}else{
			container.removeClass("cb-player-is-muted");
			player.prop('muted', false);
		}

		settings = container.data('settings');
		if ($.isFunction(settings.mediaChangeVolume)) {
		    settings.mediaChangeVolume.call(this, container, volume);
		}
	}

	function setTimeformat(el, format){
		if(!el.data('timeformat')){
			el.data('timeformat', format);

			var time;

			//set current playtime
			if(format == 'hh:mm:ss'){
				time = '00:00:00';
			}

			el.find('.cb-player-time-current').text(time);
		}
	}

	function formatTime(time, el){
		var time = time,
			timeNegative = false,
			timeArray = [];

		if(!$.isNumeric(Math.ceil(time))){
			return false;
		}

		if(typeof el === 'undefined'){
			el = false;
		}

		h = Math.floor(Math.abs(time) / 3600);
		if(h != 0 || el.data('timeformat') == 'hh:mm:ss'){
			h = (h >= 10) ? h : "0" + h;

			timeArray.push(h.toString());
			setTimeformat(el, 'hh:mm:ss');
		}

		m = Math.floor(Math.abs(time) / 60) % 60;
		m = (m >= 10) ? m : "0" + m;

		timeArray.push(m.toString());
		setTimeformat(el, 'mm:ss');


		s = Math.floor(Math.abs(time) % 60);
		s = (s >= 10) ? s : "0" + s;
		timeArray.push(s.toString());

		var t = timeArray.join(':');

		if(time < 0){
			//negative time
			time = Math.abs(time);
			timeNegative = true;

			t = '-' + t;
		}

		return t;
	}

	function setCurrentTime(container, time){
		var player = container.find('.cb-player-media');

		player[0].currentTime = time;
	}

	function playPosition(player, value) {
		var container = player.closest('.cb-player');

		if(container.data('is-livestream')){

			var totalDuration = container.data('duration'),
				duration = Math.ceil(totalDuration * (value / 100));

			playbacktime = totalDuration - duration
			currentDuration = container.data('currentDuration');

			setCurrentTime(container, currentDuration - playbacktime);

		}else{
			setCurrentTime(container, player[0].duration * (value / 100));
		}
	}

	function watchTimer(container) {
		var player = container.find('.cb-player-media'),
			progress = container.find('.cb-player-progress');
			progressVisibile = container.find('.cb-player-progress-play');

		if(!player[0].duration){
			return;
		}

		if(container.data('is-livestream')){
			var duration = container.data('duration');
			var progresstime = (container.data('currentDuration') / duration) * 100;

			var playtime = player[0].currentTime;

			if(container.data('backtracking')){
				playtime = playtime - duration;
			}

		}else{
			var progresstime = player[0].currentTime * (100 / player[0].duration);
			var playtime = player[0].currentTime;
		}

		if(container.data('contextInfo') && container.data('is_hls')){
			container.find('.cb-debug-resolution').text(player[0].videoWidth + 'x' + player[0].videoHeight);
			container.find('.cb-debug-levels').text(container.data('level') + ' of ' + container.data('levels').length);
			container.find('.cb-debug-buffer').text(Math.round(container.data('buffer')) + 's');
			container.find('.cb-debug-duration').text(container.data('duration') + 's');
			container.find('.cb-debug-current').text(Math.round(player[0].currentTime) + 's');
		}

		if(container.data('is-livestream')){
			ariaValue = progress.attr('aria-valuenow');

			var value = ariaValue;
				progressTime = Math.ceil(duration / 100 * value);
				progressPercentage = progressTime / duration * 100;

			if(container.data('backtracking')){
				//check livestream position
				progressVisibile.css('width', progressPercentage + '%');

				if(Math.round(ariaValue) >= 99){

				}else{
					playtime = -Math.abs((progressPercentage - 100) / 100 * duration);
				}
			}else{
				playtime = 'Live';
			}

		}else{
			progressVisibile.css('width', progresstime + '%');
			container.find('.cb-player-progress').attr('aria-valuenow', progresstime);
		}

		if($.isNumeric(playtime)){
			var playtime = formatTime(playtime, player.closest(".cb-player"))
		}

		player.closest(".cb-player").find(".cb-player-time-current").text(playtime);
	}

	function watchFullscreenStart(){
		if(!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement && !document.webkitDisplayingFullscreen) {
			$(".cb-player-is-fullscreen").removeClass("cb-player-is-fullscreen cb-player-control-hide");

			clearInterval(watchFullscreen);
		}
	}

	function toggleFullscreen(container, player){
		if(!$('.cb-player-is-fullscreen').length){

			if (player.requestFullScreen) {
				player.requestFullScreen();
			} else if (player.mozRequestFullScreen) {
				container[0].mozRequestFullScreen();
			} else if (player.webkitRequestFullscreen) {
				if(isTouchDevice()){
					player.webkitEnterFullScreen();
				}else{
					// container[0].webkitEnterFullScreen(Element.ALLOW_KEYBOARD_INPUT);
					container[0].webkitRequestFullscreen();
				}
			} else if (player.msRequestFullscreen) {
				player.msRequestFullscreen();
			}else if(player.webkitSupportsFullscreen){
				//fullscreen support for ios
				player.webkitEnterFullScreen();
			}

			watchFullscreen = setInterval(watchFullscreenStart, 250);
			container.addClass("cb-player-is-fullscreen");

		} else {
			if (document.cancelFullScreen) {
				document.cancelFullScreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
		}
	};

	function displayTime(container, position){
		if(container.data('is-livestream')){
			var duration = container.data('duration');
			displaytime = (position / 100 * duration) - duration;
		}else{
			var player = container.find('.cb-player-media');
			displaytime = player[0].duration * position / 100;
		}

		if(displaytime < 0 && !container.data('is-livestream')){
			displaytime = 0;
		}

		return displaytime;
	}

	function tooltip(container, position){
		var tip = container.find('.cb-player-progress-tooltip');

		var tooltipTime = formatTime(displayTime(container, position), container);

		if(tooltipTime !== false){
			tip.css('left', position + '%').text(tooltipTime);
		}
	}

	var lastTouchCoordinate = null;
	function seeking(e, container){
		if(e.type == 'touchmove' || e.type == 'touchstart'){
			var x = e.originalEvent.touches[0].pageX;

			lastTouchCoordinate = x;
		}else if(e.type == 'touchend'){
			x = lastTouchCoordinate;

			lastTouchCoordinate = null;
		}else{
			var x = e.pageX;
		}

		var progress = container.find('.cb-player-progress'),
			position = (x - progress.offset().left) / progress.width() * 100,
			position = position.toFixed(4);

		// container.find('.cb-player-poster').remove();

		if(position < 0){
			position = 0;
		}

		if(position > 100){
			position = 100
		}

		if(container.hasClass('cb-media-is-ready') && container.data('backtracking')){
			progress.attr('aria-valuenow', position);
			container.find('.cb-player-time-current').text(formatTime(displayTime(container, position), container));

			tooltip(container, position);

			if(e.type != 'touchmove'){
				playPosition(container.find(".cb-player-media"), position);
			}

			if(e.type == 'touchmove'){
				container.find('.cb-player-progress-play').css('width', position + '%');
			}
		}
	}

	function getbacktrackingPosition(container){
		var media = container.find('video, audio');

		if(container.data('duration')){
			var durationTime = Math.round((media[0].duration) - container.data('duration')),
				playTime = Math.round(media[0].currentTime - container.data('duration'));

			return durationTime - playTime;
		}

		return false;
	}

	function startWatchControlHide(container){
		if(container.hasClass("cb-player-is-playing") && settings.controlHide){
			clearTimeout(watchControlHide);
			container.removeClass('cb-player-control-hide');

			watchControlHide = setTimeout(function(){
				container.addClass('cb-player-control-hide');
			}, settings.controlHideTimeout);
		}
	}

	function Plugin( element, options ) {
        this.options = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this.element = element;
        this.init(this.options);
        this.attachEvents(this.element, this.options);
    }

	Plugin.prototype = {
		init: function(options) {
			var el = $(this.element);

			if(el.is('video') || el.is('audio')){
				if(el.closest('.cb-player').data('initialized')){
					return;
				}

				if(el.closest('.cb-player').length){
					el = el.closest('.cb-player');
				}

			}else{
				if(el.data('initialized')){
					return;
				}
			}

			var settings = options; // $.extend(settings, options);

			var	spinner = $('<div class="cb-player-spinner-wrap"><div class="cb-player-spinner"></div></div>'),
				overlayerButton = $('<div class="cb-player-overlayer-button"></div>');

			if(el.is("audio")){
				el.addClass('cb-player-media');

				el.wrap('<div class="cb-player"></div>');
				var wrap = el.closest('.cb-player');
			}else if(el.is("video")){
				el.addClass('cb-player-media');

				el.wrap('<div class="cb-player"></div>');
				var wrap = el.closest('.cb-player');
			}else{
				var wrap = el;

				el = wrap.find("video, audio");
				el.addClass('cb-player-media');
			}

			if(settings.overlaySpinner && !wrap.find('.cb-player-spinner-wrap').length){
				spinner.appendTo(wrap);
			}

			if(settings.overlayButton && !wrap.find('.cb-player-overlayer-button').length){
				overlayerButton.appendTo(wrap);
			}

			if(!el.find("source").data("src") && !el.find("source").attr('src') && !el.attr('src') && !el.data('src')){
				console.warn('Source is empty');
				return;
			}

			// if(el.attr('poster')){
			// 	$('<div class="cb-player-poster" style="background-image: url('" + el.attr('poster') + "')"></div>').appendTo(wrap);
			// }

			var control = $('<div class="cb-player-controls"></div>');
			var play = $('<div class="cb-player-play cb-player-toggle-play"><span class="cb-player-button-play"></span><span class="cb-player-button-pause"></span><span class="cb-player-button-replay"></div>');
			var time = $('<div class="cb-player-time"><span class="cb-player-time-current">00:00</span><span class="cb-player-time-seperator">/</span><span class="cb-player-time-duration">00:00</span></div>');
			var progress = $('<span class="cb-player-progress" role="slider" aria-valuenow="0"><div class="cb-player-progress-hide"></div><div class="cb-player-progress-play"></div><div class="cb-player-progress-load"></div></span>');
			var mute = $('<div class="cb-player-volume-wrap"><div class="cb-player-toggle-mute"><span class="cb-player-button-sound"></span><span class="cb-player-button-mute"></span></div></div>');
			var volume = $('<div class="cb-player-volume-' + settings.volumeOrientation + '"><span class="cb-player-volume"><div class="cb-player-volume-hide" role="slider" aria-valuenow=""></div><div class="cb-player-volume-bar"></div></span></div>');
			var fullscreen = $('<div class="cb-player-fullscreen cb-player-toggle-fullscreen"><span class="cb-player-button-fullscreen-on"></span><span class="cb-player-button-fullscreen-off"></span></div>');

			var tooltip = $('<span class="cb-player-progress-tooltip"></span>').prependTo(progress);

			var context = $('<ul class="cb-player-context"><li class="cb-player-context-item">CBplayer ' + playerVersion + '</li></ul>');

			if(settings.contextInfo){

				var debugLink = $('<li class="cb-player-context-item link" data-link="debug">Debug-info</li>');
				context.append(debugLink);

				var debug = $('<div class="cb-player-overlayer cb-player-debug"><div class="cb-player-overlayer-close"></div></div>');

				debug.append($('<div class="cb-player-debug-item"><div class="cb-player-debug-item-type">Resolution:</div><div class="cb-player-debug-item-value cb-debug-resolution"></div></div>'));
				debug.append($('<div class="cb-player-debug-item"><div class="cb-player-debug-item-type">QualityLevels:</div><div class="cb-player-debug-item-value cb-debug-levels"></div></div>'));
				debug.append($('<div class="cb-player-debug-item"><div class="cb-player-debug-item-type">Buffer:</div><div class="cb-player-debug-item-value cb-debug-buffer"></div></div>'));
				debug.append($('<div class="cb-player-debug-item"><div class="cb-player-debug-item-type">Duration:</div><div class="cb-player-debug-item-value cb-debug-duration"></div></div>'));
				debug.append($('<div class="cb-player-debug-item"><div class="cb-player-debug-item-type">CurrentTime:</div><div class="cb-player-debug-item-value cb-debug-current"></div></div>'));

				wrap.append(debug);
			}

			if(el.is("video")){
				wrap.append(context);
			}

			if(settings.tpl == 'default' && !settings.backgroundMode && !wrap.find('.cb-player-controls').length){

				control.append(play);

				if(settings.controlShowLoad){
					control.find('.cb-player-play').append($('</span><span class="cb-player-button-load"></span>'));
				}

				if(settings.controlTime){
					control.append(time);
				}

				if(settings.controlProgress){
					control.append(progress);
				}

				if(settings.controlAudio){
					volume.appendTo(mute);
					control.append(mute);
				}

				if(!el.is("audio") && settings.controlFullscreen){
					control.append(fullscreen);
				}

				if(settings.controlBar){
					wrap.append(control);
				}
			}

			function createTrackItem(id, lang, label){
				var item = $('<li>');

				item.addClass('cb-player-subtitle-item')
					.attr('data-lang', lang)
					.text(label);

				return item;
			}

            var tracks = el.find('track');
			if(tracks.length){
                var subtitlesContainer = $('.cb-player-subtitle'),
                    subtitleList = $('.cb-player-subtitle-items');

                if(!subtitlesContainer.length){
                    subtitlesContainer = $('<div class="cb-player-subtitle"></div>');
                    subtitlesContainer.append($('<div class="cb-player-subtitle-button"></div>'));
                    subtitlesContainer.appendTo(wrap.find('.cb-player-controls'));
                }

                if(!subtitleList.length){
                    subtitleList = $('<ul class="cb-player-subtitle-items"></ul>');
                    subtitlesContainer.append(subtitleList);
                }

                var trackSelected;
                tracks.each(function(i, s){
                    var track = $(s);
                    var item = subtitleList.append(createTrackItem('subtitles-' + track.attr('srclang'), track.attr('srclang'), track.attr('label')));

                });

                subtitleList.prepend(createTrackItem('subtitles-off', '', 'OFF'));
                subtitleList.find('.cb-player-subtitle-item').eq(0).addClass('cb-player-subtitle--selected');
            }

			if(!wrap.find('.cb-player-error').length){
				$('<div class="cb-player-error"><div class="cb-player-error-message"></div></div>').appendTo(wrap);
			}

			var volume = settings.volume;
			if(settings.muted || settings.backgroundMode || el.is('[muted]') ){
				el.prop('muted', true);
				volume = 0;
			}

			var autoplay = settings.autoplay;
			if(el.is('[autoplay]')){
				el.removeAttr('autoplay');
				autoplay = true;
			}

			var loop = settings.loop;
			if(settings.backgroundMode || el.is('[loop]')){
				el.removeAttr('loop');
				loop = true;
			}

			if(wrap.data('duration') && wrap.find('.cb-player-time-duration').length){
				wrap.find('.cb-player-time-duration').text(formatTime(wrap.data('duration')));
			}

            if(wrap.find('.cb-player-button-load').length){
                wrap.find('.cb-player-play').addClass('cb-player-with-load');
            }

			wrap.data({
				'initialized': true,
				'backtracking': settings.backtracking,
				'contextInfo': settings.contextInfo,
				'backgroundMode': settings.backgroundMode,
				'autoplay': autoplay,
				'volume': volume,
				'loop': loop,
				'hlsStopLoad': settings.hlsStopLoad,
				'settings': settings
			});

			//duation from data
			if(el.data('duration')){
				wrap.find('.cb-player-time-duration').text(formatTime(el.data('duration'), el));
			}

			el.on("timeupdate", function(){
				var container = $(this).closest(".cb-player"),
					progress = container.find(".cb-player-progress-play"),
					media = container.find('video, audio');

				if ($.isFunction(settings.mediaTimeupdate)) {
				 	settings.mediaTimeupdate.call(this, wrap, media[0].currentTime);
				}

				if(container.hasClass("cb-media-is-ready") && progress.length){
					watchTimer(container);
				}
			});

            $(tracks).on('cuechange', function(e){
                var track = e.originalEvent.srcElement.track;

                if(track){
                    var cues = track.cues;

                    for (var i = 0; i < cues.length; i++){

                        var cue = cues[i];
                        cue.onenter = function(text){
                            if(track.mode == 'showing'){
                                $('<div class="cb-player-subtitle-text"></div>').append(text.srcElement.text).appendTo(wrap);
                            }
                        }

                        cue.onexit = function(){
                            wrap.find('.cb-player-subtitle-text').remove();
                        }
                    }   
                }
            });

			el.on('durationchange', function(e){
				var container = $(this).closest(".cb-player"),
					progress = container.find(".cb-player-progress"),
					slider = progress.find(".cb-player-progress-hide");

				if(container.data('pause') && container.data('is-livestream') && container.data('backtracking')){

					if(slider.length){
						//media backtracking duration - current duration - current playtime / backtracking duration * 100
						var position = (container.data('duration') - getbacktrackingPosition(container)) / container.data('duration') * 100,
							position = position.toFixed(4);

						progress.attr('aria-valuenow', position);

						container.data('pause', false);
					}
				}
			});

			var setLevel;

			el.on('play', function(e){
				var container = $(this).closest(".cb-player"),
					progress = container.find(".cb-player-progress");

                //is current position behind media duration, set new position
			    if(getbacktrackingPosition(container) >= container.data('duration') && container.data('backtracking') && container.data('is-livestream')){
					position = 0.01;

					progress.attr('aria-valuenow', position);
					playPosition(el, position);
				}

				if ($.isFunction(settings.mediaIsPlay)) {
				    settings.mediaIsPlay.call(this, wrap);
				}
			});

			el.on('playing', function(e){
				var container = $(this).closest(".cb-player");

				container.addClass("cb-player-is-playing");
			});

			el.on('pause', function(e){

				var container = $(this).closest(".cb-player");

				clearTimeout(watchControlHide);

				//set new current position for livestreaming after media stoped
				container.data('pause', true);

				if ($.isFunction(settings.mediaIsPause)) {
				    settings.mediaIsPause.call(this, wrap);
				}

				if(container.hasClass('cb-player-is-seeking')){
					return;
				}

				container.removeClass("cb-player-is-playing cb-player-control-hide");

				if(typeof hls !== 'undefined' && container.data('hlsStopLoad')){
					hls.stopLoad();
				}
			});

			el.on('seeking', function(e){
				var container = $(this).closest(".cb-player");

				clearTimeout(watchControlHide);
				container.removeClass('cb-player-control-hide');
			});

			el.on('seeked', function(e){
				var container = $(this).closest(".cb-player");
				startWatchControlHide(container);
			});

			el.on('waiting', function(){
				var container = $(this).closest(".cb-player");
				container.addClass("cb-player-is-loaded");
			});

			el.on('canplay', function(){
				var container = $(this).closest(".cb-player");
				container.removeClass("cb-player-is-loaded");
			});

			el.on('ended', function(){
				var container = $(this).closest(".cb-player");

				container.removeClass("cb-player-is-playing cb-player-control-hide").addClass("cb-payer-is-replay");
                container.find('.cb-player-subtitle-text').remove();

				if ($.isFunction(settings.mediaIsEnd)) {
				    settings.mediaIsEnd.call(this, wrap);
				}

				if(wrap.data('loop')){
					toggleMediaStartSTopp(wrap);
				}
			});

			wrap.mouseenter(function(){
				var container = $(this);

				if(container.hasClass("cb-player-is-playing") && settings.controlHide){
					clearTimeout(watchControlHide);
					container.removeClass('cb-player-control-hide');
				}
			});

			wrap.mouseleave(function(){
				var container = $(this);

				if(container.hasClass("cb-player-is-playing") && settings.controlHide){
					container.addClass('cb-player-control-hide');
				}
			});

			wrap.mousemove(function(){
				var container = $(this);
				startWatchControlHide(container);
			});

			if ($.isFunction(settings.mediaIsInit)) {
			    settings.mediaIsInit.call(this, wrap);
			}

			setTimeout(function(){
				if((wrap.data('autoplay') && $('.cb-player-is-playing').length == 0) || (wrap.data('autoplay') && wrap.data('backgroundMode'))){
					initPlayer(wrap);
				}
			});
		},
		attachEvents: function(el, options) {
			var touchtimer = false,
				container = $(el).closest('.cb-player');

			container.on('touchstart', '.cb-player-toggle-play, .cb-player-media', function(e){
				if(container.data('backgroundMode') || options.disableClick){
					return;
				}

				if(container.hasClass('cb-player-control-hide')){
					//show controls on tocuh start
					container.removeClass('cb-player-control-hide');

				}else{
					touchtimer = true

					setTimeout(function(){
						touchtimer = false;
					}, 300);
				}
			});

			container.on(isTouchDevice() ? 'touchend' : 'click', '.cb-player-toggle-play, .cb-player-media, .cb-player-overlayer-button', function(e){
				if(container.hasClass('cb-player-is-loaded') || container.data('backgroundMode') || options.disableClick){
					return;
				}

				if(e.type == 'touchend'){
					if(touchtimer){
				        initPlayer(container);

				        touchtimer = false;
					}
				}else{
					initPlayer(container);
				}
			});

			container.on(isTouchDevice() ? 'touchstart' : 'mouseenter', '.cb-player-progress-hide', function(e){
				if(!container.hasClass('cb-media-is-ready')){
					return;
				}

				if(container.data('backtracking') && e.type == "mouseenter"){
					container.find('.cb-player-progress-tooltip').stop().fadeIn(250);
				}
			});

			container.on('mouseleave', '.cb-player-progress-hide', function(e){
				if(container.hasClass('cb-player-is-seeking')){
					return;
				}

				container.find('.cb-player-progress-tooltip').stop().fadeOut(250);
			});

			container.on('mousemove', '.cb-player-progress-hide', function(e){
				var progress = $(this).closest('.cb-player-progress');
					position = (e.pageX - progress.offset().left) / progress.width() * 100,
					position = position.toFixed(4);

				if(!container.hasClass('cb-media-is-ready')){
					return;
				}

				if(container.data('backtracking')){
					tooltip(container, position);
				}
			});

			container.on('click', '.cb-player-progress-hide', function(e){
				var position = e;

				if(!container.hasClass('cb-media-is-ready')){
					getPlayerSrc(container, false);

					function checkIsReady(container){
						if(container.hasClass('cb-media-is-ready')){
							seeking(position, container);
						}else{
							setTimeout(function(){
								checkIsReady(container);
							}, 100);
						}
					}

					checkIsReady(container);
				}
			});

			container.on(isTouchDevice() ? 'touchstart' : 'mousedown' ,'.cb-player-progress', function(e){
				if(e.type == "mousedown"){
					if(e.which != 1){
						return false;
					}
				}

				var progress = $(this),
					container = $(this).closest('.cb-player'),
					player = container.find('.cb-player-media');

				container.addClass("cb-player-is-seeking");

				seeking(e, container);

				$(document).bind('mousemove.cbplayer-seeking touchmove.cbplayer-seeking', function(e){
					var e = e;

					if(container.data('is-livestream')){

						//fire seeking after mouseup

					}else{

						if(container.hasClass('cb-player-is-playing') && !player[0].paused && !container.hasClass('cb-player-is-loaded')){
							container.data('stopTemporary', true);
							player[0].pause();
						}

						seeking(e, container);
					}
				});

				e.stopPropagation();
				//e.preventDefault();
			});

			container.on('mousedown','.cb-player-volume-hide', function(e){
				if(e.type == "mousedown"){
					if(e.which != 1){
						return false;
					}
				}

				var progress = $(this),
					container = $(this).closest('.cb-player');

				container.addClass("cb-player-is-setvolume");

				setVolume(container, e);

				$(document).bind('mousemove.cbplayer-setvolume', function(e){
					var e = e;

					setVolume(container, e);
				});

				e.preventDefault();
				e.stopPropagation();
			});

			container.on(isTouchDevice() ? 'touchstart' : 'click', '.cb-player-toggle-mute', function(){
				var player = container.find('.cb-player-media');

				if(player.prop('muted')){
					volumevalue = 100;
				}else{
					volumevalue = 0;
				}

				setVolume(container, volumevalue);
			});

			container.on(isTouchDevice() ? 'touchstart' : 'click', '.cb-player-toggle-fullscreen', function(){
				var player = container.find(".cb-player-media")[0];

				toggleFullscreen(container, player);
			});

			container.on('contextmenu', function(e){
				var container = $(e.target).closest('.cb-player');

				if(container.length){
					var context = container.find('.cb-player-context');

					if(context.hasClass('cb-player-context-active')){
						context.removeClass('cb-player-context-active');
						return false;
					}

					context.addClass('cb-player-context-active');

					var cursorX = e.pageX - container.offset().left,
						cursorY = e.pageY - container.offset().top,
						contextXEnd = cursorX + context.width(),
						contextYEnd = cursorY + context.height();

					if(container.width() > contextXEnd){
						context.css('left', cursorX);
					}else{
						context.css('left', cursorX - context.width());
					}

					if(container.height() > contextYEnd){
						context.css('top', cursorY);
					}else{
						context.css('top', cursorY - context.height());
					}
					return false;
				}
			});

			container.on('click', '.cb-player-context-item.link', function(){
				var item = $(this);

				container.find('.cb-player-' + item.data('link')).css('display', 'block');
			});

			container.on('click', '.cb-player-overlayer-close', function(){
				$(this).closest('.cb-player-overlayer').css('display', 'none');
			});

			container.on('click', '.cb-player-subtitle-item', function(){
				var item = $(this),
					video = container.find('.cb-player-media')[0];

				item.closest('.cb-player-subtitle-items').find('.cb-player-subtitle-item').removeClass('cb-player-subtitle--selected');
				item.addClass('cb-player-subtitle--selected');

				var tracks = container.find('track');

				for (var i = 0; i < video.textTracks.length; i++) {

					var track = video.textTracks[i];

					if(track.language == item.data('lang')){
						track.mode = 'showing';
					}else{
						track.mode = 'hidden';
					}
				}
			});

			if (!$(document).data('cbplayer-initialized')) {

				$(document).on('mouseup', function(e){
					var container = $('.cb-player-is-setvolume');

					if(e.type == "mouseup" && container.hasClass("cb-player-is-setvolume")){
						if(e.which != 1){
							return false;
						}

						$(this).unbind("mousemove.cbplayer-setvolume");

						container.removeClass("cb-player-is-setvolume");

						e.stopPropagation();
						e.preventDefault();
					}
				});

				$(document).on(isTouchDevice() ? 'touchend' : 'mouseup', function(e){
					var container = $('.cb-player-is-seeking'),
						progress = container.find('.cb-player-progress'),
						player = container.find('.cb-player-media');

					if((e.type == 'touchend' || e.type == "mouseup") && container.hasClass("cb-player-is-seeking")){
						if(e.which != 1 && e.type == "mouseup"){
							return false;
						}

						$(this).unbind("mousemove.cbplayer-seeking");
						$(this).unbind("touchmove.cbplayer-seeking");

						container.removeClass("cb-player-is-seeking");

						if(!$(e.target).hasClass('cb-player-progress-hide')){
							container.find('.cb-player-progress-tooltip').fadeOut(250);
						}

						if(container.data('stopTemporary') && player[0].paused && !container.hasClass('cb-player-is-loaded')){
							container.data('stopTemporary', false);
							player[0].play();
						}

						if(e.type == 'touchend'){
							seeking(e, container);
						}

						e.stopPropagation();
					}
				});

				$(document).on('click', function(){
					if($('.cb-player-context-active').length){
						$('.cb-player-context-active').removeClass('cb-player-context-active');
					}
				});

				$(document).data('cbplayer-initialized', true);
			}
		}
	}

	$.fn.cbplayer = function(options) {
		if (options == "mediaSetVolume") {
			var volume = Array.prototype.slice.call( arguments, 1 );

			$(this).each(function(){
				var container = $(this).closest('.cb-player'),
					media = container.find('.cb-player-media');

				if(volume.length){
					volume = volume.toString();

					if(volume >= 0 && volume <= 100){
						setVolume(container, volume);
					}else{
						console.warn('Wrong value in mediaSetVolume');
					}
				}
			});
			return;
		}

		if (options == "mediaSetTime") {
			var time = Array.prototype.slice.call( arguments, 1 );

			$(this).each(function(){
				var container = $(this).closest('.cb-player'),
					media = container.find('.cb-player-media');

				if(time.length && container.hasClass('cb-media-is-ready')){
					time = time.toString();

					if(time.match(/(:)/)){

						time = time.split(':');

						if(time.length == 3){

							var h = time[0] * 60 * 60,
								m = time[1] * 60,
								s = time[2];

							time = parseFloat(h) + parseFloat(m) + parseFloat(s);

						}else if(time.length == 2){

							var m = time[0] * 60,
								s = time[1];

							time = parseFloat(m) + parseFloat(s);

						}else{
							time = time[0];
						}
					}

					if(time <= container.data('duration')){
						setCurrentTime(container, time);
					}else{
						console.warn('Wrong value in mediaSetTime: Video duration ' +  container.data('duration') + ', your set time ' + time);
					}
				}
			});
			return;
		}

		if (options == "mediaStopAll") {
			stopPlayingAll();
			return;
		}

        return this.each(function() {
			var container = $(this);

			if(($(this).is("video") || $(this).is("audio")) &&  $(this).closest('.cb-player').length){
				container = container.closest('.cb-player');
			}

            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
            else if ($.isFunction(Plugin.prototype[options])) {
                $.data(this, 'plugin_' + pluginName)[options]();
            }

			if(options == 'initSource'){
				if(container.data('is-livestream')){
					return;
				}

				getPlayerSrc(container, false);
				return;
			}

			if(options == 'mediaStop'){
				if(container.data('loop')){
					container.data({
						'loop' : false,
						'loopDefault' : true
					});
				}

				var media = container.find('.cb-player-media')[0];

				videoStop(media);
				return;
			}

			if(options == 'mediaPlay'){
				if(container.data('loopDefault') && container.data('loopDefault') != container.data('loop')){
					container.data('loop', container.data('loopDefault'));
				}

				if(!container.hasClass('cb-media-is-ready')){
					initPlayer(container);
				}else{
					var media = container.find('.cb-player-media')[0];
					videoStart(container, media);
				}
				return;
			}

			if (options == "mediaRestart") {
				var media = container.find('.cb-player-media')[0];

				media.currentTime = 0;
				if(!container.hasClass('cb-media-is-ready')){
					initPlayer(container);
				}else{
					videoStart(container, media);
				}
			}
        });
    }
})( jQuery, window, document );
