/*!
 * jQuery CBplayer 1.6.10
 * 2022-07-27
 * Copyright Christin Bombelka
 * https://github.com/ChristinBombelka/cbplayer
 */

;(function ( $, window, document, undefined ) {
	var pluginName = 'cbplayer',
		playerVersion = '1.6.10',
		hls,
		watchProgress,
		watchFullscreen,
		watchControlHide,
		urls = {
			vimeo: {
				iframe: 'https://player.vimeo.com/video/{0}?{1}',
				sdk: 'https://player.vimeo.com/api/player.js',
			},
			youtube: {
				sdk: 'https://www.youtube.com/iframe_api',
			},
		},
		youtubeInit = false,
		vimeoInit = false;

	let defaults = {
		tpl : 'default',
		/*
			use custom player template
			settings: default, false, array[]
			example:
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
		/* enable/disable complete controls */
		controlLoadButton: true,
		/* controll show loading animation button*/
		controlTime: true,
		/* enable/disable  current/duration time */
		controlTimeBackwards: false,
		/* show remaining time */
		controlProgress: true,
		/* enable/disable progress bar */
		controlTooltip: true,
		/* enable/disable tooltip on progress bar */
		controlFullscreen: true,
		/* enable/disable fullscreen button */
		controlVolume: true,
		/* enable/disable volume bar */
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
		youtube: {
			noCookie: true,
			showinfo: 0, // Hide Video Info
			controls: 0, // Disable YouTube controls
			disablekb: 1, // Disable key navigation
			playsinline: 1, // IOS play video inline
			rel: 0, // Related videos
		},
		vimeo: {
			referrerPolicy: null, // https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/referrerPolicy
			fitIframe: true,
		},
		/* config youtube */
		disableClick: false,
		/* disable click events on media */
		mediaIsInit: false,
		/* callback media container create */
		mediaIsReady: false,
		/* callback media is ready to play*/
		mediaMetaIsLoaded: false,
		/* wait for media meta data */
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
		mediaControlsChange: false,
		/* callback controls hide/show */
		initSource: $,
		mediaPauseAll: $,
		mediaPause: $,
		mediaPlay: $,
		mediaRestart: $,
		mediaSetVolume: $,
		mediaSetTime: $
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
		var player = container.find('.cb-player-media-source')[0];
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

		http.open('HEAD', src, true);
		http.send();

		return http.status != 404;
	}

	function getSource(media){
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
		}else if(media.parent().data('src')){
			mediaSrcEl = media.parent();
			mediaSrc = media.parent().data('src');
		}else{
			return false;
		}

		return {
			mediaSrcEl,
			mediaSrc
		}
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

		//container.removeClass("cb-payer-is-replay");

		var settings = container.data('settings'),
			media = container.find(".cb-player-media-source");

		let source = getSource(media);
		if(!source){
			return;
		}

		if(source.mediaSrc.toLowerCase().match(/(.m3u8)/) && typeof Hls === 'undefined'){
			displayError(container, 'hls.js ist not found');
			return;
		}

		let provider = getProvider(source.mediaSrc);

		if(source.mediaSrc.toLowerCase().match(/(.m3u8)/) && Hls.isSupported()){
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
			hls.loadSource(source.mediaSrc);
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
					toggleMediaPlayPause(container);
				}

				container.data({
					'levels': data.levels,
					'level': hls.currentLevel + 1,
					'is_hls': true,
					'videowidth': data.levels[0].width,
					'videoheight': data.levels[0].height,
					'ratio': data.levels[0].width / data.levels[0].height
				});

				if ($.isFunction(settings.mediaMetaIsLoaded)) {
					settings.mediaMetaIsLoaded.call(this, container);
				}
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

					if(!source.mediaSrcEl.attr('video')){
						source.mediaSrcEl.remove();
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

		}else if(source.mediaSrc.toLowerCase().match(/(.mp4)/) || isVimeoProgressive(source.mediaSrc) || (source.mediaSrc.toLowerCase().match(/(.m3u8)/) && Hls) ){
			// (Hls && (!isSupported() && mediaSrc.match(/(.m3u8)/)) || mediaSrc.match(/(.mp4)/)

			if(fileExist(source.mediaSrc) === false){
				displayError(container, 'File not exist');
				return;
			}

			source.mediaSrcEl.attr("src", source.mediaSrc);

			//fix firefox content by ajax
			setTimeout(function(){
				media[0].load();
				container.addClass("cb-player-is-loaded");
			});

			media.on('loadedmetadata', function(){
				var mediaDuration = formatTime(media[0].duration, media.closest(".cb-player"));
				media.closest(".cb-player").find(".cb-player-time-duration").text(mediaDuration);

				container.addClass("cb-media-is-ready");
				container.removeClass('cb-player-initialized');

				container.data({
					'videowidth': media[0].videoWidth,
					'videoheight': media[0].videoHeight,
					'ratio': media[0].videoWidth / media[0].videoHeight,
					'duration': Math.floor(media[0].duration)
				});

				setVolume(container, container.data('volume'));

				if(autostart){
					toggleMediaPlayPause(container);
				}

				if ($.isFunction(settings.mediaMetaIsLoaded)) {
					settings.mediaMetaIsLoaded.call(this, container);
				}
			});

		}else if (source.mediaSrc.toLowerCase().match(/(.mp3)/) || source.mediaSrc.toLowerCase().match(/(.wav)/)){

			if(fileExist(source.mediaSrc) === false){
				displayError(container, 'File not exist');
				return;
			}
			source.mediaSrcEl.attr("src", source.mediaSrc);

			setTimeout(function(){
				media[0].load();
				container.addClass("cb-player-is-loaded");
			});

			media.on('loadedmetadata', function(){
				var mediaDuration = formatTime(media[0].duration, media.closest(".cb-player"));
				media.closest(".cb-player").find(".cb-player-time-duration").text(mediaDuration);

				container.addClass("cb-media-is-ready");
				container.removeClass('cb-player-initialized');

				container.data({
					'duration': media[0].duration
				});

				if(autostart){
					toggleMediaPlayPause(container);
				}

				if ($.isFunction(settings.mediaMetaIsLoaded)) {
					settings.mediaMetaIsLoaded.call(this, container);
				}
			});

		}else if(provider == 'vimeo' || provider == 'youtube'){
			//check is Viemo or Youtube iFrame
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
				player = container.find('.cb-player-media-source')[0];

			if(!container.data('backgroundMode')){
				if(container.hasClass('cb-media-is-ready') && !player.paused){
					//Fix Clear DOM before call pause
					$('body').height();

					videoStop(container, player);
				}
			}
		});
	}

	function videoStart(container, player){
		if(typeof hls !== 'undefined' && container.data('hlsStopLoad')){
			hls.startLoad();
		}

		if(container.data('iframe') && container.data('iframe') == 'youtube'){
			container.data('instance').playVideo();
		}else{

			if(container.data('iframe') == 'vimeo'){
				player = container.data('embed');
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
	}

	function videoStop(container, player){
		if(container.data('iframe')){
			if(container.data('iframe') == 'youtube'){
				container.data('instance').pauseVideo();
			}else if (container.data('iframe') == 'vimeo'){
				player = container.data('embed');

				player.pause();
				clearInterval(watchProgress);
			}
		}else{
			player.pause();
			clearInterval(watchProgress);
		}
	}

    function showPoster(container){
        container.find('.cb-player-poster').show()
    }

	function hidePoster(container){
		container.find('.cb-player-poster').hide()
	}

	function toggleMediaPlayPause (container){
		var player = container.find('.cb-player-media-source')[0];

		if(!container.data('backgroundMode')){
			stopPlayingAll(container);
		};

		if(container.data('iframe')){

			if(container.data('iframe') == 'youtube'){
				//check youtube is playing
				//0 - End
				//1 - Playing
				//2 - Pause
				//3 - buffered
				//5/-1 unstarted

				if(container.data('instance').getPlayerState() != 1){
					videoStart(container, false)
				}else if(container.data('instance').getPlayerState() == 1){
					videoStop(container, false)
				}
			}else if(container.data('iframe') == 'vimeo'){
				var embedPlayer = container.data('embed');

				embedPlayer.getPaused().then(function(paused) {
					if(paused){
						videoStart(container, embedPlayer);
					}else{
						videoStop(container, embedPlayer);
					}
				});
			}
		}else{
			if (player.paused) {
				videoStart(container, player);
			} else {
				videoStop(container, player);
			}
		}

		container.removeClass('cb-player-initialized');
	}

	function initPlayer(container) {

		if(container.hasClass('cb-player-initialized')){
			return;
		}

		container.addClass('cb-player-initialized');

		if(container.hasClass("cb-media-is-ready")){
			toggleMediaPlayPause(container);
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
					var loadPercentage = Math.floor(buffer.end(i)) / Math.floor(player.duration) * 100;
				}
			}

			container.find('.cb-player-progress-load').css('width', loadPercentage + '%');
		}
	}

	function setVolume(container, volume) {
		var player = container.find('.cb-player-media-source'),
			slider = container.find(".cb-player-volume-hide"),
			progress = container.find(".cb-player-volume-bar");

		if(volume.target){
			var e = volume;

			var sliderContainerV = container.find(".cb-player-volume-wrap--vertical"),
				sliderContainerH = container.find(".cb-player-volume-wrap--horizontal");

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

		if(container.data('iframe')){
			if(container.data('iframe') == 'youtube'){
				container.data('instance').setVolume(volume);
			}else if(container.data('iframe') == 'vimeo'){
				var embedPlayer = container.data('embed');

				embedPlayer.setVolume(volume / 100);
			}


		}else{
			player[0].volume = volume / 100;
		}

		if(slider.length && progress.length){
			slider.attr('aria-valuenow', volume);
			progress.css('width', volume + '%');
		}

		if(volume == 0){
			container.addClass("cb-player-is-muted");

			if(container.data('iframe')){
				if(container.data('iframe') == 'youtube'){
					container.data('instance').mute();
				}
			}else{
				player.prop('muted', true);
			}

		}else{
			container.removeClass("cb-player-is-muted");

			if(container.data('iframe')){
				if(container.data('iframe') == 'youtube'){
					container.data('instance').unMute();
				}
			}else{
				player.prop('muted', false);
			}
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

	function formatTime(time, container){
		var time = time,
			timeNegative = false,
			timeArray = [];

		if(!$.isNumeric(Math.ceil(time))){
			return false;
		}

		if(typeof container === 'undefined'){
			container = false;
		}

		h = Math.floor(Math.abs(time) / 3600);
		if(h != 0 || container.data('timeformat') == 'hh:mm:ss'){
			h = (h >= 10) ? h : "0" + h;

			timeArray.push(h.toString());
			setTimeformat(container, 'hh:mm:ss');
		}

		m = Math.floor(Math.abs(time) / 60) % 60;
		m = (m >= 10) ? m : "0" + m;

		timeArray.push(m.toString());
		setTimeformat(container, 'mm:ss');


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
		var player = container.find('.cb-player-media-source');

		if(container.data('iframe')){
			if(container.data('iframe') == 'youtube'){
				container.data('instance').seekTo(time);
			}else if(container.data('iframe') == 'vimeo'){
				var embedPlayer = container.data('embed');

				embedPlayer.setCurrentTime(time);
			}

		}else{
			player[0].currentTime = time;
		}
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

			var duration;

			if(container.data('iframe')){
				duration = container.data('duration');
			}else{
				duration = player[0].duration;
			}

			setCurrentTime(container, duration * (value / 100));
		}
	}

	function updatePlaytime(player, playtime){
		if($.isNumeric(playtime)){
			playtime = formatTime(playtime, player.closest('.cb-player'));
		}

		player.closest('.cb-player').find('.cb-player-time-current').text(playtime);
	}

	function updateRemainingPlayTime(player, time){
		if(!player.length && !time){
			return;
		}

		time = formatTime(time, player.closest(".cb-player"));
		player.closest('.cb-player').find('.cb-player-time-duration').text(time);
	}

	function updateProgress(container, progresstime){
		var progressVisibile = container.find('.cb-player-progress-play');

		if(container.length){
			progressVisibile.css('width', progresstime + '%');
		}

		container.find('.cb-player-progress').attr('aria-valuenow', progresstime);
	}

	function watchTimer(container) {
		var player = container.find('.cb-player-media-source'),
			progress = container.find('.cb-player-progress'),
			progressVisibile = container.find('.cb-player-progress-play'),
			progresstime,
			playtime;

		if(!player[0].duration && !container.data('iframe') && !container.hasClass('cb-media-is-ready')){
			return;
		}

		if(container.data('is-livestream')){
			var duration = container.data('duration');

			progresstime = (container.data('currentDuration') / duration) * 100;
			playtime = player[0].currentTime;

			if(container.data('backtracking')){
				playtime = playtime - duration;
			}
		}else if(container.data('iframe')){

			if(container.data('iframe') == 'youtube'){
				//youtube current playtime
				playtime = container.data('instance').getCurrentTime();
				progresstime = playtime * (100 / container.data('duration'));
			}else if(container.data('iframe') == 'vimeo'){

				var embedPlayer = container.data('embed');

				embedPlayer.getCurrentTime().then(function(seconds){
					updatePlaytime(player, seconds);

					progresstime = seconds * (100 / container.data('duration'));
					updateProgress(container, progresstime)
				});
			}
		}else{
			playtime = player[0].currentTime;
			progresstime = player[0].currentTime * (100 / player[0].duration);

		}

		if(container.data('contextInfo')){
			let videoWidth, videoHeight;

			if(container.data('iframe') == 'vimeo'){
				var embedPlayer = container.data('embed');

				Promise.all([embedPlayer.getVideoWidth(), embedPlayer.getVideoHeight()]).then((dimensions) => {
					container.find('.cb-debug-resolution').text(dimensions[0] + 'x' + dimensions[1]);
				});

				embedPlayer.getCurrentTime().then((seconds) => {
					container.find('.cb-debug-current').text(Math.floor(seconds) + 's');
				});
			}else{
				container.find('.cb-debug-resolution').text(player[0].videoWidth + 'x' + player[0].videoHeight);
				container.find('.cb-debug-current').text(Math.floor(player[0].currentTime) + 's');

				if(container.data('level')){
					container.find('.cb-debug-levels').text(container.data('level') + ' of ' + container.data('levels').length);
				}

				if(container.data('buffer')){
					container.find('.cb-debug-buffer').text(Math.round(container.data('buffer')) + 's');
				}
			}

			container.find('.cb-debug-duration').text(container.data('duration') + 's');
		}

		if(container.data('is-livestream')){
			ariaValue = progress.attr('aria-valuenow');

			var value = ariaValue;
				progressTime = Math.ceil(duration / 100 * value);
				progressPercentage = progressTime / duration * 100;

			if(container.data('backtracking')){
				//check livestream position
				if(container.length){
					progressVisibile.css('width', progressPercentage + '%');
				}

				if(Math.round(ariaValue) >= 99){

				}else{
					playtime = -Math.abs((progressPercentage - 100) / 100 * duration);
				}
			}else{
				playtime = 'Live';
			}

		}else if(container.data('iframe') != 'vimeo'){
			updateProgress(container, progresstime);
		}

		if(container.data('iframe') != 'vimeo'){
			updatePlaytime(player, playtime);
		}

		if(container.data('settings')['controlTimeBackwards']){
			var remainingPlayTime = false;

			if(container.data('iframe')){
				if(container.data('iframe') == 'youtube'){
					remainingPlayTime = container.data('duration') - container.data('instance').getCurrentTime();
				}else if (container.data('iframe') == 'vimeo'){
					let embedPlayer = container.data('embed');
					embedPlayer.getCurrentTime().then(function(seconds){
						let remainingPlayTime = container.data('duration') - seconds

						updateRemainingPlayTime(player, remainingPlayTime)
					});
				}

			}else{
				remainingPlayTime = player[0].duration - player[0].currentTime;
			}

			if(remainingPlayTime){
				updateRemainingPlayTime(player, remainingPlayTime)
			}
		}
	}

	function watchFullscreenStart(){
		let nativeFullscreen = $('.cb-player.cb-player-is-native-fullscreen')

		if(nativeFullscreen.length){

			if(nativeFullscreen.data('iframe') == 'vimeo'){
				player = nativeFullscreen.data('embed');

				player.getFullscreen().then(function(fullscreen){
					if(fullscreen === false){
						nativeFullscreen.removeClass("cb-player-is-native-fullscreen");
						clearInterval(watchFullscreen);
					}
				});
			}

		} else if(!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement && !document.webkitDisplayingFullscreen) {
            const fullscreenPlayer = $('.cb-player-is-fullscreen')
            controlsToggle(fullscreenPlayer, false);

            fullscreenPlayer.removeClass('cb-player-is-fullscreen');

			clearInterval(watchFullscreen);
		}
	}

	function toggleFullscreen(container, player){
		if(!$('.cb-player-is-fullscreen').length){

			let fullscreenActive = true
			if (player.requestFullScreen) {
				player.requestFullScreen();
			} else if (player.mozRequestFullScreen) {
				container[0].mozRequestFullScreen();
			}else if (player.webkitRequestFullscreen) {
				//fullscreen support android
				container[0].webkitRequestFullscreen();
			} else if (player.msRequestFullscreen) {
				//fullscreen IE 11
				container[0].msRequestFullscreen();
			}else if(player.webkitSupportsFullscreen){
				//fullscreen support for ios
				player.webkitEnterFullScreen();
			}else{
				fullscreenActive = false

				//show native fulscreen for vimeo
				if(container.data('iframe') == 'vimeo'){
					player = container.data('embed');

					player.requestFullscreen().then(function() {
						watchFullscreen = setInterval(watchFullscreenStart, 250);
						container.addClass("cb-player-is-native-fullscreen");
					});
				}
			}

			if(fullscreenActive){
				watchFullscreen = setInterval(watchFullscreenStart, 250);
				container.addClass("cb-player-is-fullscreen");
			}

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
		var displaytime;

		if(container.data('is-livestream')){
			var duration = container.data('duration');

			displaytime = (position / 100 * duration) - duration;
		}else if(container.data('iframe')){

			displaytime = container.data('duration') * position / 100;

		}else{
			player = container.find('.cb-player-media-source');
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
				playPosition(container.find(".cb-player-media-source"), position);
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
		var settings = container.data('settings');

		if(container.hasClass("cb-player-is-playing") && settings.controlHide){
			clearTimeout(watchControlHide);
			controlsToggle(container, false)

			watchControlHide = setTimeout(function(){
				controlsToggle(container, true)
			}, settings.controlHideTimeout);
		}
	}

	function watchSubtitles(container){
		var el = container.find('.cb-player-media-source'),
			tracks = el[0].textTracks,
			lastCueId = container.data('lastCueId'),
			settings = container.data('settings');

		if(tracks && container.hasClass('cb-player--with-subtitles')){
			for (var i = 0; i < tracks.length; i++){
				var textTrack = el[0].textTracks[i],
					currentCue = false;

				if(textTrack.mode == 'showing'){

					for (var i = 0; i < textTrack.cues.length; i++){
						var cue = textTrack.cues[i];

						if(cue.startTime < el[0].currentTime && cue.endTime > el[0].currentTime){
							currentCue = cue;
						}
					}

					var currentSubtitle = container.find('.cb-player-subtitle-layer');

					if(currentCue){

						if(lastCueId != currentCue.startTime){
							currentSubtitle.remove();

							$('<div class="cb-player-subtitle-layer"><span class="cb-player-subtitle-text">'+currentCue.text+'</span></div>').appendTo(container);

						   container.data('lastCueId', currentCue.startTime);

							if ($.isFunction(settings.mediaTrackChange)) {
								settings.mediaTrackChange.call(this, container, currentCue.text);
							}
						}
					}else{
						if(currentSubtitle.length){
							lastCueId = false;
							currentSubtitle.remove();
						}
					}
				}
			}
		}
	}

	function getProvider(url){
		// YouTube
		if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(url)) {
			return "youtube";
		}

		// Vimeo
		if (/^https?:\/\/(player.vimeo.com\/video\/|vimeo.com)\d{0,9}(?=\b|\/)/.test(url)) {
			return "vimeo";
		}

		if (url.toLowerCase().match(/(.mp4)/)){
			return "mp4";
		}

		if (url.toLowerCase().match(/(.m3u8)/)){
			return "stream";
		}

		if (url.toLowerCase().match(/(.mp3)/)){
			return "mp3";
		}

		if (url.toLowerCase().match(/(.wav)/)){
			return "wav";
		}

		return null;
	}

	function getYoutubeId(url) {
		var regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		return url.match(regex) ? RegExp.$2 : url;
	}

	function setDuration(container){
		if(container.data('duration')){
			var media = container.find('.cb-player-media-source');

			container.find('.cb-player-time-duration').text(formatTime(container.data('duration'), container));
		}
	}

	function getYoutubeHost(config){
		if(config.youtube.noCookie){
			return 'https://www.youtube-nocookie.com';
		}

		if (window.location.protocol === 'http:') {
			return 'http://www.youtube.com';
		}

		return undefined;
	}

	function isVimeoProgressive(url){
		var regex = /^.*(player.vimeo.com\/progressive_redirect\/playback\/(\d+)\/rendition\/(\d+[p])).*/;
		return url.match(regex) ? RegExp.$2 : false;
	}

	function getVimeoId(url){
		var regex = /^.*(vimeo\.com\/(video\/|))([0-9]+)/;
		return url.match(regex) ? RegExp.$3 : url;
	}

	function format(input) {
		for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			args[_key - 1] = arguments[_key];
		}

		if (!input) {
		  return input;
		}

		return input.toString().replace(/{(\d+)}/g, function (match, i) {
			return args[i].toString();
		});
	}

	function buildUrlParams(input){
		var params = new URLSearchParams();

		$.each(input, function(key, value){
			params.set(key, value);
		});

		return params.toString();
	}

	function uniqid(a = "", b = false) {
		const c = Date.now()/1000;
		let d = c.toString(16).split(".").join("");
		while(d.length < 14) d += "0";
		let e = "";
		if(b){
			e = ".";
			e += Math.round(Math.random() * 10000);
		}
		return a + d + e;
	}

	function fitIframe(container){
		if(container.data('ratio') && container.data('iframe')){
			const containerHeight = container.height()
			const containerWidth = container.width()
			const containerRatio = containerWidth / containerHeight
			const media = container.find('.cb-player-media-container')
			const settings = container.data('settings');

			if(container.data('iframe') == 'vimeo' && settings.vimeo.fitIframe){
				//fit video in height
				if(containerRatio > container.data('ratio')){
					container.addClass('cb-player--iframe-fit')
					let newWidth = containerHeight * container.data('ratio');

					media.css({
						'height': containerHeight,
						'width': newWidth
					});
				}else{
					container.removeClass('cb-player--iframe-fit')
					media.css({
						'height': '',
						'width': ''
					});
				}
			}else if(container.data('iframe') == 'youtube'){
				if(containerRatio > container.data('ratio')){
					container.addClass('cb-player--iframe-fit')
					let newWidth = containerHeight * container.data('ratio');

					media.css({
						'height': containerHeight,
						'width': newWidth,
					});
				}else{
					container.removeClass('cb-player--iframe-fit')
					media.css({
						'height': '',
						'width': ''
					});
				}
			}
		}
	}

	function controlsToggle(container, conrolsHide){
		let settings = container.data('settings');
		let lastStatus = container.data('controlsHidden');
		let controlsHidden;

		if(conrolsHide){
			container.addClass('cb-player-control-hide');
			controlsHidden = true;
		}else{
			container.removeClass('cb-player-control-hide');
			controlsHidden = false;
		}

		if(lastStatus != controlsHidden){
			if ($.isFunction(settings.mediaControlsChange)) {
				settings.mediaControlsChange.call(this, container, controlsHidden);
			}
		}

		container.data('controlsHidden', controlsHidden);
	}

	function addPoster(container, image){
		if(!container.find('.cb-player-poster').length){
			let poster = $('<div class="cb-player-poster"></div>')

			poster.css('background-image', 'url(' + image + ')')
			poster.appendTo(container);
		}
	}

	function CBplayer( element, options ) {
		this.options = $.extend( {}, defaults, options );
		this._defaults = defaults;
		this._name = pluginName;
		this.element = element;
		this.init(this.options);
		this.attachEvents(this.element, this.options);
	}

	CBplayer.prototype = {
		init: function(options) {
			var el = $(this.element),
				_this = this,
				wrap;

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

			var spinner = $('<div class="cb-player-spinner-wrap"><div class="cb-player-spinner"></div></div>'),
				overlayerButton = $('<div class="cb-player-overlayer-button"></div>');

			if(el.is("video") || el.is("audio")){
				el.addClass('cb-player-media-source')

				container = el.wrap('<div class="cb-player"></div>');
				container.wrap('<div class="cb-player-media"></div>');

				wrap = el.closest('.cb-player');

			}else{
				wrap = el;

				if(!wrap.hasClass('cb-player')){
					wrap.addClass('cb-player')
				}

				el = wrap.find("video, audio");

				if(el.length && !el.closest('.cb-player-media').length){
					el.wrap('<div class="cb-player-media"></div>');
				}

				if(el.length && !el.hasClass('cb-player-media-source')){
					el.addClass('cb-player-media-source')
				}

				if(wrap.find('.cb-player-media-source').length){
					el = wrap.find('.cb-player-media-source')
				}else if(!el.length){
					el = $('<div>').appendTo(wrap);
					el.addClass('cb-player-media');
				}
			}

			if(settings.overlaySpinner && !wrap.find('.cb-player-spinner-wrap').length){
				spinner.appendTo(wrap);
			}

			if(settings.overlayButton && !wrap.find('.cb-player-overlayer-button').length){
				overlayerButton.appendTo(wrap);
			}

			if(!el.find("source").data("src") && !el.find("source").attr('src') && !el.attr('src') && !el.data('src') && !wrap.data('src')){
				console.warn('Source is empty');
				return;
			}

			if(wrap.data('poster')){
				addPoster(wrap, wrap.data('poster'))
			}

			const control = $('<div class="cb-player-controls"></div>')
			const tpl_play = $('<div class="cb-player-play cb-player-toggle-play"><span class="cb-player-button-play"></span><span class="cb-player-button-pause"></span></div>')
			const tpl_time = $('<div class="cb-player-time"></div>')
			const tpl_time_current = $('<span class="cb-player-time-current">00:00</span>')
			const tpl_time_seperator = $('<span class="cb-player-time-seperator">/</span>')
			const tpl_time_duration = $('<span class="cb-player-time-duration">00:00</span>')
			const tpl_progress = $('<div class="cb-player-progress" aria-valuenow="0"><div class="cb-player-progress-hide"></div><div class="cb-player-progress-play"></div><div class="cb-player-progress-load"></div></div>')
			const tpl_tooltip = $('<div class="cb-player-progress-tooltip"></div>')
			const tpl_mute = $('<div class="cb-player-volume-wrap"><div class="cb-player-sound"><span class="cb-player-sound-on"></span><span class="cb-player-sound-off"></span></div></div>')
			const tpl_volume = $('<div class="cb-player-volume"><span class="cb-player-volume-container"><div class="cb-player-volume-hide" role="slider" aria-valuenow=""></div><div class="cb-player-volume-bar"></div></span></div>')
			const tpl_fullscreen = $('<div class="cb-player-fullscreen cb-player-toggle-fullscreen"><span class="cb-player-button-fullscreen-on"></span><span class="cb-player-button-fullscreen-off"></span></div>')
			const tpl_subtitle = $('<div class="cb-player-subtitle"><div class="cb-player-subtitle-button"></div></div>')

			if(settings.controlTooltip){
				tpl_tooltip.prependTo(tpl_progress);
			}

			if(settings.controlVolume){
				tpl_mute.addClass('cb-player-volume-wrap--' + settings.volumeOrientation)
				tpl_volume.appendTo(tpl_mute);
			}

			if(settings.controlLoadButton){
				tpl_play.append($('<span class="cb-player-button-load"></span>'));
			}

			var context = $('<ul class="cb-player-context"><li class="cb-player-context-item">CBplayer ' + playerVersion + '</li></ul>');

			let source = getSource(el)
			let provider = getProvider(source.mediaSrc);

			//check video/audio element exist
			if(( provider == 'stream' || provider == 'mp4' || provider == 'mp3' || provider == 'wav' ) && ( !wrap.find('video').length && !wrap.find('audio').length )){
				el.remove();

				let sourceType,
					targetType;

				if(provider == 'stream' || provider == 'mp4'){
					targetType = 'video';
					sourceType = 'video/mp4'
					if(provider == 'stream'){
						sourceType = 'application/x-mpegURL';
					}

				}else if(provider == 'mp3'){
					targetType = 'audio';
					sourceType = 'audio/mp3';
				}else if(provider == 'wav'){
					targetType = 'audio';
					sourceType = 'audio/wav';
				}

				let media = wrap.find('.cb-player-media')
				if(!media.length){
					wrap.prepend('<div class="cb-player-media"></div>')
					media = wrap.find('.cb-player-media')
				}

				el = $('<'+targetType+' playsinline class="cb-player-media-source"><source data-src="' + source.mediaSrc + '" type="' + sourceType + '"/></'+targetType+'>');
				el.prependTo(media);
			}

			if(el.is("video")){
				wrap.append(context);
			}

			if(el.is("audio")){
				wrap.addClass('cb-player--audio');
				options.controlHide = false;
			}

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

			if(settings.tpl && $.isArray(settings.tpl)){

				$.each(settings.tpl, function(i,e){
					const element = e
					const value = element.value

					if(element.name == 'play'){
						control.append(tpl_play);
					}else if(element.name == 'time'){

						if(value && value.length == 2){
							tpl_time.append(tpl_time_current)
							tpl_time.append(tpl_time_seperator)
							tpl_time.append(tpl_time_duration)
							control.append(tpl_time)
						}else if(value){

							if(value[0] == 'current'){
								const tpl_time_clone = tpl_time.clone()

								tpl_time_clone.append(tpl_time_current)
								control.append(tpl_time_clone)

							}else if(value[0] == 'duration'){
								const tpl_time_clone = tpl_time.clone()

								tpl_time_clone.append(tpl_time_duration)
								control.append(tpl_time_clone)
							}
						}
					}else if(element.name == 'progress'){
						control.append(tpl_progress);
					}else if(element.name == 'mute'){
						control.append(tpl_mute);
					}else if(element.name == 'subtitle'){
						control.append(tpl_subtitle);
					}else if(element.name == 'fullscreen'){
						control.append(tpl_fullscreen);
					}
				})

				wrap.append(context);

				if(settings.controlBar){
					wrap.append(control);
				}

			}else if(settings.tpl == 'default' && !settings.backgroundMode && !wrap.find('.cb-player-controls').length){

				control.append(tpl_play);
				wrap.append(context);

				if(settings.controlTime){
					tpl_time.append(tpl_time_current)
					tpl_time.append(tpl_time_seperator)
					tpl_time.append(tpl_time_duration)
					control.append(tpl_time);
				}

				if(settings.controlProgress){
					control.append(tpl_progress);
				}

				control.append(tpl_mute);

				if(!el.is("audio") && settings.controlFullscreen){
					control.append(tpl_fullscreen);
				}

				if(settings.controlBar){
					wrap.append(control);
				}
			}else if(settings.backgroundMode && wrap.find('.cb-player-controls').length){
				//remove existin controls on backgroundmode
				wrap.find('.cb-player-controls').remove()
			}

			if(wrap.find('.cb-player-progress').length){
				wrap.find('.cb-player-progress').attr('role', 'slider');
			}

			function createTrackItem(id, lang, label){
				var item = $('<li>');

				item.addClass('cb-player-subtitle-item')
					.attr('data-lang', lang)
					.text(label);

				return item;
			}

			let tracks = el.find('track');
			if(tracks.length){
				let subtitlesContainer = wrap.find('.cb-player-subtitle')
				let subtitleList = wrap.find('.cb-player-subtitle-items')

				if(!subtitlesContainer.length){
					tpl_subtitle.appendTo(wrap.find('.cb-player-controls'))
					subtitlesContainer = wrap.find('.cb-player-subtitle')
				}

				if(!subtitleList.length){
					subtitleList = $('<ul class="cb-player-subtitle-items"></ul>');
					subtitlesContainer.append(subtitleList);
				}

				var trackSelected;
				let tracksLoaded = new Promise(resolve => {
					tracks.each(function(i, s){
						var track = $(s);
						var item = createTrackItem('subtitles-' + track.attr('srclang'), track.attr('srclang'), track.attr('label'))

						subtitleList.append(item);

						fetch($(track[0]).attr('src'))
							.then( resp => resp.text() )
							.then( data => {
								// console.log(data)
								if(track[0].default){
								   item.addClass('cb-player-subtitle--selected')
								}

								if(tracks.length == i + 1){
									resolve()
								}
							});

					});
				});

				tracksLoaded.then(() => {
					subtitleList.prepend(createTrackItem('subtitles-off', '', 'OFF'));
					if(!subtitleList.find('.cb-player-subtitle--selected').length){
						subtitleList.find('.cb-player-subtitle-item').eq(0).addClass('cb-player-subtitle--selected');
					}

					if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
						wrap.addClass('cb-player--with-native-subtitles');
					}else{
						wrap.addClass('cb-player--with-subtitles');
					}
				});
			}

			if(!wrap.find('.cb-player-error').length){
				$('<div class="cb-player-error"><div class="cb-player-error-message"></div></div>').appendTo(wrap);
			}

			let volume = settings.volume;
			if(settings.muted || settings.backgroundMode || el.is('[muted]') ){
				el.prop('muted', true);
				volume = 0;
			}

			let autoplay = settings.autoplay;
			if(el.is('[autoplay]')){
				el.removeAttr('autoplay');
				autoplay = true;
			}

			let loop = settings.loop;
			if(settings.backgroundMode || el.is('[loop]')){
				el.removeAttr('loop');
				loop = true;
			}

			if(wrap.data('duration') && wrap.find('.cb-player-time-duration').length){
				wrap.find('.cb-player-time-duration').text(formatTime(wrap.data('duration'), wrap));
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

			var youtube = {
				setup: function(){
					if(window.YT && window.YT.Player){
						youtube.ready.call(_this);
					}else{
						var callback = window.onYouTubeIframeAPIReady;

						window.onYouTubeIframeAPIReady = function () {
							youtube.ready.call(_this);
						};

						$.getScript(urls.youtube.sdk, function(jd) {});

						youtubeInit = true;
					}
				},
				ready: function ready() {

					videoId = getYoutubeId(source.mediaSrc);

					var id = uniqid(),
						media = wrap.find('.cb-player-media'),
						ytTimer,
						ytBufferTimer;

					let mediaContainer = $('<div class="cb-player-media-container"></div>')
					mediaContainer.appendTo(media)

					var wrapper = document.createElement('div');
					wrapper.setAttribute('class', 'cb-player-media-embed');
					$(wrapper).appendTo(mediaContainer);

					el = $('<div>')
						.attr('id', id)
						.appendTo(wrapper);

					const thump = 'https://img.youtube.com/vi/'+videoId+'/maxresdefault.jpg'
					addPoster(wrap, thump)

					el.addClass('cb-player-media-iframe cb-player-media-source');

					el.embed = new window.YT.Player(id, {
						videoId: videoId,
						host: getYoutubeHost(settings),
						playerVars: {
							showinfo: settings.youtube.showinfo,
							controls: settings.youtube.controls,
							disablekb: settings.youtube.disablekb,
							playsinline: settings.youtube.playsinline,
							rel: settings.youtube.rel
						},
						events: {
							'onStateChange': function(e){
								var instance = e.target;

								clearTimeout(ytTimer)
								clearTimeout(ytBufferTimer)

								if(e.data == YT.PlayerState.PLAYING){
									stopPlayingAll(wrap)

									wrap.addClass('cb-player-is-playing').removeClass('cb-player-is-loaded');

									function ytTimeupdate(){
										watchTimer(wrap);
										if ($.isFunction(settings.mediaTimeupdate)) {
											settings.mediaTimeupdate.call(this, wrap, instance.getCurrentTime());
										}

										ytTimer = setTimeout(function(){
											ytTimeupdate()
										}, 250)
									}
									ytTimeupdate()

									hidePoster(wrap)

									if ($.isFunction(settings.mediaIsPlay)) {
										settings.mediaIsPlay.call(this, wrap);
									}
								}else if(e.data == YT.PlayerState.PAUSED){

									wrap.removeClass('cb-player-is-playing cb-player-is-loaded')

									clearTimeout(watchControlHide)
									controlsToggle(wrap, false)

									if ($.isFunction(settings.mediaIsPause)) {
										settings.mediaIsPause.call(this, wrap);
									}

								}else if(e.data == YT.PlayerState.BUFFERING){

									ytBufferTimer = setTimeout(() =>{
										wrap.addClass('cb-player-is-loaded');
									}, 400)

								}else if(e.data == YT.PlayerState.ENDED){

									if(settings.loop){
										videoStart(wrap, false)
									}

									if ($.isFunction(settings.mediaIsEnd)) {
										settings.mediaIsEnd.call(this, wrap);
									}

								}
							},
							'onReady': function(e){
								var instance = e.target;

								wrap.removeClass('cb-player-initialized')
								wrap.addClass('cb-media-is-ready')

								//set functions
								wrap.data('instance', instance);

								//set duration
								wrap.data('duration', instance.getDuration());

								//set video ratio
								let videoData = instance.j.i
								if(jQuery.type(videoData) == 'object'){
									wrap.data('ratio', videoData.width / videoData.height)
								}

								if(settings.backgroundMode){
									instance.mute();
								}

								if(settings.autoplay){
									videoStart(wrap, false)
								}

								if(volume && settings.muted === false){
									setVolume(wrap, volume)
								}else if(settings.muted){
									setVolume(wrap, 0)
								}

								setTimeout(function(){
									setDuration(wrap);
								});

								if ($.isFunction(settings.mediaIsReady)) {
									settings.mediaIsReady.call(this, wrap);
								}
							}
						}
					});
				}
			}

			var vimeo = {
				setup: function(){
					if(window.Vimeo && window.Vimeo.Player){
						vimeo.ready.call(_this);
					}else{
						$.getScript(urls.vimeo.sdk)
							.done(function(script, status){

								vimeo.ready.call(_this);

								vimeoInit = true;

							}).fail(function(jqxhr, settings, exception){
								console.warn('Vimeo SDK failed to load', jqxhr);
							});

					}
				},
				ready: function(){

					videoId = getVimeoId(source.mediaSrc);

					wrap.addClass('cb-media-is-ready');

					var media = wrap.find('.cb-player-media');

					let mediaContainer = $('<div class="cb-player-media-container"></div>')
					mediaContainer.appendTo(media)

					var wrapper = document.createElement('div');
					wrapper.setAttribute('class', 'cb-player-media-embed');
					$(wrapper).appendTo(mediaContainer);

					var params = buildUrlParams({
						loop: settings.loop,
						autoplay: settings.autoplay,
						muted: settings.muted,
						gesture: 'media',
						playsinline: true,
						byline: false,
						portrait: false,
						title: false,
						transparent: false,
						background: settings.backgroundMode
					});

					//Create a new DOM element
					//Use this to prevent play() failed error
					var iframe = document.createElement('iframe'),
						src = format(urls.vimeo.iframe, videoId, params);

					iframe.setAttribute('src', src);
					iframe.setAttribute('allowfullscreen', '');
					iframe.setAttribute('allow', 'fullscreen; autoplay; picture-in-picture; encrypted-media; accelerometer; gyroscope');

					if(settings.vimeo.referrerPolicy != null){
						iframe.setAttribute('referrerpolicy', settings.vimeo.referrerPolicy);
					}

					$(iframe).appendTo(wrapper);
					$(iframe).addClass('cb-player-media-iframe cb-player-media-source');

					// var poster = $('<div>')
					//  .addClass('cb-player-media-poster')
					//  .appendTo(media);

					el.embed = new window.Vimeo.Player(iframe, {
						autopause: 1,
						muted: settings.muted
					});

					wrap.data('embed', el.embed);

					//get video ratio
					Promise.all([el.embed.getVideoWidth(), el.embed.getVideoHeight()]).then((dimensions) => {
						const ratio = dimensions[0] / dimensions[1];
						wrap.data('ratio', ratio)

						fitIframe(wrap);
					});

					el.embed.ready().then(function(){
						if ($.isFunction(settings.mediaIsReady)) {
							settings.mediaIsReady.call(this, wrap);
						}
					})

					el.embed.on('bufferstart', function(){
						wrap.addClass('cb-player-is-loaded');
					});

					el.embed.on('bufferend', function(){
						wrap.removeClass('cb-player-is-loaded');
					});

					el.embed.on('play', function(){
						wrap.addClass('cb-player-is-playing').removeClass('cb-player-is-ended cb-player-is-loaded');

						stopPlayingAll(wrap)
						fitIframe(wrap)
						hidePoster(wrap)

						if ($.isFunction(settings.mediaIsPlay)) {
							settings.mediaIsPlay.call(this, wrap);
						}
					});

					el.embed.on('pause', function(){
						wrap.removeClass('cb-player-is-playing cb-player-is-loaded');

						clearTimeout(watchControlHide);
						controlsToggle(wrap, false);

						if ($.isFunction(settings.mediaIsPause)) {
							settings.mediaIsPause.call(this, wrap);
						}
					});

					el.embed.on('timeupdate', function(){
						watchTimer(wrap);

						if ($.isFunction(settings.mediaTimeupdate)) {
							el.embed.getCurrentTime().then(function(seconds){
								settings.mediaTimeupdate.call(this, wrap, seconds);
							})
						}
					});

					el.embed.on('seeked', function(){
						clearTimeout(watchControlHide);
						controlsToggle(wrap, false);
					});

					el.embed.on('ended', function(data) {
						wrap.addClass('cb-player-is-ended');

						if ($.isFunction(settings.mediaIsEnd)) {
							settings.mediaIsEnd.call(this, wrap);
						}
					});

					//set duration
					el.embed.getDuration().then(function(duration) {
						wrap.data('duration', duration);

						setTimeout(function(){
							setDuration(wrap);
						});
					}).catch(function(e){
						displayError(el.closest(".cb-player"), e);
					});

					if(settings.muted){
						setVolume(el.closest(".cb-player"), 0);
					}
				}
			}

			var media = {
				ready: function(el){

					var setLevel;
					el.on('play', function(e){
						var container = $(this).closest('.cb-player'),
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
						var container = $(this).closest('.cb-player');

						container
							.addClass('cb-player-is-playing')
							.removeClass('cb-payer-is-ended');

						startWatchControlHide(container);
						hidePoster(container)
					});

					el.on("timeupdate", function(){
						var container = $(this).closest(".cb-player"),
							media = container.find('video, audio');

						if ($.isFunction(settings.mediaTimeupdate)) {
							settings.mediaTimeupdate.call(this, wrap, media[0].currentTime);
						}

						watchTimer(container);
						watchSubtitles(container);
					});

					el.on('pause', function(e){

						var container = $(this).closest('.cb-player');

						clearTimeout(watchControlHide);

						//set new current position for livestreaming after media stoped
						container.data('pause', true);

						if ($.isFunction(settings.mediaIsPause)) {
							settings.mediaIsPause.call(this, wrap);
						}

						if(container.hasClass('cb-player-is-seeking')){
							return;
						}

						container.removeClass("cb-player-is-playing");

						controlsToggle(container, false);

						if(typeof hls !== 'undefined' && container.data('hlsStopLoad')){
							hls.stopLoad();
						}
					});

					el.on('seeking', function(e){
						var container = $(this).closest(".cb-player");

						clearTimeout(watchControlHide);
						controlsToggle(container, false);
					});

					el.on('seeked', function(e){
						var container = $(this).closest(".cb-player");
						startWatchControlHide(container);
					});

					el.on('waiting', function(){
						var container = $(this).closest(".cb-player");

						//check current time with duration - fix for firefox
						if($(this)[0].currentTime < container.data('duration')){
							container.addClass("cb-player-is-loaded");
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

					el.on('canplay', function(){
						var container = $(this).closest(".cb-player");
						container.removeClass("cb-player-is-loaded");

						if(typeof hls !== 'undefined' && container.data('hlsStopLoad') && container.data('initSource') == true){
							hls.stopLoad();
							container.data('initSource', false);
						}
					});

					el.on('ended', function(){
						var container = $(this).closest(".cb-player");

						container.removeClass("cb-player-is-playing").addClass("cb-payer-is-ended");
						controlsToggle(container, false);
						container.find('.cb-player-subtitle-layer').remove();

						if ($.isFunction(settings.mediaIsEnd)) {
							settings.mediaIsEnd.call(this, wrap);
						}

						if(wrap.data('loop')){
							toggleMediaPlayPause(wrap);
						}
					});
				}
			}


			if(provider == 'youtube' || provider == 'vimeo'){
				wrap.addClass('cb-player--' + provider);
				wrap.data('iframe', provider);

				if(provider == 'youtube'){
					var checkYoutubeApiReady = function(){
						if(youtubeInit == false || (typeof window.YT !== 'undefined' && window.YT.Player)){
							youtube.setup(_this);
						}else{
							setTimeout(checkYoutubeApiReady, 100);
						}
					}
					checkYoutubeApiReady();
				}else if(provider == 'vimeo'){

					var checkViemoApiReady = function(){
						if(vimeoInit == false || (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player)){
							vimeo.setup(_this);
						}else{
							setTimeout(checkViemoApiReady, 100);
						}
					}
					checkViemoApiReady();
				}
			}else{
				media.ready(el)
			}


			wrap.mouseenter(function(){
				var container = $(this);

				if(container.hasClass("cb-player-is-playing") && settings.controlHide){
					clearTimeout(watchControlHide);
					controlsToggle(container, false);
				}
			});

			wrap.mouseleave(function(){
				var container = $(this);

				if(container.hasClass("cb-player-is-playing") && settings.controlHide){
					controlsToggle(container, true);
				}
			});

			wrap.mousemove(function(e){
				var container = $(this);
				let target = $(e.target);

				if(target.closest('.cb-player-controls').length || target.hasClass('cb-player-controls')){
					return;
				}

				startWatchControlHide(container);
			});

			if ($.isFunction(settings.mediaIsInit)) {
				settings.mediaIsInit.call(this, wrap);
			}

			setTimeout(function(){
				if((!wrap.data('iframe') && wrap.data('autoplay') && $('.cb-player-is-playing').length == 0) || (wrap.data('autoplay') && wrap.data('backgroundMode'))){
					initPlayer(wrap);
				}
			});
		},
		attachEvents: function(el, options) {
			var touchtimer = false,
				container = $(el).closest('.cb-player');

			var targetsTouch = ['.cb-player-toggle-play', '.cb-player-overlayer-button'];
			if(options.disableClick == false){
				targetsTouch.push('.cb-player-media');
			}

			container.on('touchstart', targetsTouch.join(','), function(e){
				if(container.data('backgroundMode')){
					return;
				}

				if(container.hasClass('cb-player-control-hide')){
					//show controls on touchstart
					controlsToggle(container, false);

				}else{
					touchtimer = true

					setTimeout(function(){
						touchtimer = false;
					}, 300);
				}
			});

			var targetsClick = ['.cb-player-toggle-play', '.cb-player-overlayer-button'];
			if(options.disableClick == false){
				targetsClick.push('.cb-player-media');
			}

			container.on(isTouchDevice() ? 'touchend' : 'click', targetsClick.join(',') , function(e){
				if(container.hasClass('cb-player-is-loaded') || container.data('backgroundMode')){
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
					player = container.find('.cb-player-media-source');

				container.addClass("cb-player-is-seeking");

				seeking(e, container);

				$(document).bind('mousemove.cbplayer-seeking touchmove.cbplayer-seeking', function(e){
					var e = e;

					if(container.data('is-livestream')){

						//fire seeking after mouseup

					}else{

						if(container.data('iframe')){
							if(container.hasClass('cb-player-is-playing')){
								//container.data('instance').pauseVideo();
							}

						}else if(container.hasClass('cb-player-is-playing') && !player[0].paused && !container.hasClass('cb-player-is-loaded')){
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

			container.on(isTouchDevice() ? 'touchstart' : 'click', '.cb-player-sound', function(){
				var player = container.find('.cb-player-media-source'),
					volumevalue;

				if(container.data('iframe')){

					if(container.data('iframe') == 'youtube'){
						if(container.data('instance').isMuted()){
							volumevalue = 100;
						}else{
							volumevalue = 0;
						}
					}else if(container.data('iframe') == 'vimeo'){
						var embedPlayer = container.data('embed');

						embedPlayer.getVolume().then(function(volume){

							if(volume == 0){
								volumevalue = 100;
							}else{
								volumevalue = 0;
							}

							setVolume(container, volumevalue);
						});
					}

				}else{
					if(player.prop('muted')){
						volumevalue = 100;
					}else{
						volumevalue = 0;
					}
				}

				if(container.data('iframe') != 'vimeo'){
					setVolume(container, volumevalue);
				}
			});

			container.on('mouseenter', '.cb-player-controls', function(){
				if(container.hasClass('cb-player-is-playing')){
					clearTimeout(watchControlHide);
					controlsToggle(container, false);
				}
			});

			container.on(isTouchDevice() ? 'touchstart' : 'click', '.cb-player-toggle-fullscreen', function(){
				var player = container.find(".cb-player-media-source")[0];

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
					video = container.find('.cb-player-media-source')[0];

				item.closest('.cb-player-subtitle-items').find('.cb-player-subtitle-item').removeClass('cb-player-subtitle--selected');
				item.addClass('cb-player-subtitle--selected');

				if(!item.data('lang')){
					container.find('.cb-player-subtitle-layer').remove();
				}

				var tracks = container.find('track');

				for (var i = 0; i < video.textTracks.length; i++) {

					var track = video.textTracks[i];

					if(track.language == item.data('lang')){
						track.mode = 'showing';
					}else{
						track.mode = 'hidden';
					}
				}

				item.closest('.cb-player-subtitle').removeClass('cb-player-subtitle-active');
			});

			container.on(isTouchDevice() ? 'touchend' : 'mouseover', '.cb-player-subtitle', function(e){
				var item = $(this);

				if($(e.target).hasClass('cb-player-subtitle-button')){
					item.toggleClass('cb-player-subtitle-active');
				}else{
					item.addClass('cb-player-subtitle-active');
				}
			});

			container.on('mouseleave', '.cb-player-subtitle', function(){
				$(this).removeClass('cb-player-subtitle-active');
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
						player = container.find('.cb-player-media-source');

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

				$(window).on('resize', function(){
					$('.cb-player.cb-media-is-ready').each(function(){
						let player = $(this)

						setTimeout(function(){
							fitIframe(player);
						})

					});
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
					media = container.find('.cb-player-media-source');

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
					media = container.find('.cb-player-media-source');

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

		if (options == "mediaPauseAll") {
			stopPlayingAll();
			return;
		}

		return this.each(function() {
			var container = $(this);

			if(($(this).is("video") || $(this).is("audio")) &&  $(this).closest('.cb-player').length){
				container = container.closest('.cb-player');
			}

			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new CBplayer(this, options));
			}
			else if ($.isFunction(Plugin.prototype[options])) {
				$.data(this, 'plugin_' + pluginName)[options]();
			}

			if(options == 'initSource'){
				if(container.data('is-livestream')){
					return;
				}

				container.data('initSource', true);

				getPlayerSrc(container, false);
				return;
			}

			if(options == 'mediaPause'){
				if(container.data('loop')){
					container.data({
						'loop' : false,
						'loopDefault' : true
					});
				}

				var media = container.find('.cb-player-media-source')[0];

				videoStop(container, media);
				return;
			}

			if(options == 'mediaPlay'){
				if(container.data('loopDefault') && container.data('loopDefault') != container.data('loop')){
					container.data('loop', container.data('loopDefault'));
				}

				if(!container.hasClass('cb-media-is-ready')){
					initPlayer(container);
				}else{
					var media = container.find('.cb-player-media-source')[0];
					videoStart(container, media);
				}
				return;
			}

			if (options == "mediaRestart") {
				var media = container.find('.cb-player-media-source')[0];

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