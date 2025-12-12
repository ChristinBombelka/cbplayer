/*!
 * jQuery CBplayer 1.10.5
 * 2025-12-12
 * Copyright Christin Bombelka
 * https://github.com/ChristinBombelka/cbplayer
 */

; (function ($, window, document, undefined) {
	var pluginName = 'cbplayer',
		playerVersion = '1.10.5',
		hls,
		watchProgress,
		watchFullscreen,
		watchControlHide,
		urls = {
			vimeo: {
				event: 'https://vimeo.com/event/{0}/embed/{1}',
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
		tpl: 'default',
		/*
			use custom player template
			settings: default, false, array[]
			example:
			[
				{name: 'play'},
				{name: 'time', value: ['current']},
				{name: 'progress'},
				{name: 'time', value: ['duration']},
				{name: 'volume'},
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
		controlMute: true,
		/* enable/disable mute button */
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
		consentMessage: "To view the video, please accept the consent",
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
		labels: {
			play: 'Play',
			pause: 'Pause',
			slider: 'Slider',
			sliderOf: 'of',
			hours: 'Hours',
			minutes: 'Minutes',
			seconds: 'Seconds',
			mute: 'Mute',
			unmute: 'Unmute',
			volume: 'Volume',
			subtitles: 'Subtitles',
			fullscreenOn: 'Fullscreen on',
			fullscreenOff: 'Fullscreen off'
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
		getConsent: $,
		consentChanged: $,
		mediaPauseAll: $,
		mediaPause: $,
		mediaPlay: $,
		mediaRestart: $,
		mediaSetVolume: $,
		mediaSetTime: $
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

		if (buffer) {
			var pos = player.currentTime, bufferLen;
			for (var i = 0, bufferLen = 0; i < buffer.length; i++) {
				var start = buffer.start(i) / player.duration;
				var end = buffer.end(i) / player.duration;
				if (pos >= buffer.start(i) && pos < buffer.end(i)) {
					bufferLen = buffer.end(i) - pos;
				}
			}

			container.data({
				'buffer': bufferLen,
			});
		}

		if (!container.data('duration')) {
			var timeRanges = timeRangesToString(player.played),
				duration = 0;

			if (timeRanges.length) {
				var t = timeRanges[0];
				duration = t.split(',')[0];

				if (duration == 0) {
					duration = player.duration;
				}
			}

			container.data({
				'duration': Math.round(duration),
			});
		}

		var timeRanges = timeRangesToString(player.seekable),
			currentDuration = 0;

		if (timeRanges.length) {
			var t = timeRanges[0];
			currentDuration = t.split(',')[1];
		}

		container.data({
			'currentDuration': currentDuration,
		});
	}

	function displayError(container, message, type = 'error') {
		if (!container.find('.cb-player-error').length) {
			$('<div class="cb-player-error"><div class="cb-player-error-message"></div></div>').appendTo(container);
		}

		container.find('.cb-player-error-message').html(message);
		container.addClass('cb-player--' + type);
		container.removeClass('cb-player--media-loaded');
	}

	function fileExist(src, done) {

		if(isVimeoProgressive(src)){
			return new Promise(function (resolve, reject) {
				resolve(true);
			})
		}

		return new Promise(function (resolve, reject) {
			try {
      		const url = new URL(src, window.location.href);

				if (url.hostname === window.location.hostname) {
					// Same domain 
					let xhr = new XMLHttpRequest();
					xhr.open('HEAD', src, true);
					xhr.onload = function () {
						if (xhr.status >= 200 && xhr.status < 300) {
							resolve(xhr.response)
						} else {
							reject({
								status: xhr.status
							})
						}
					}
					xhr.onerror = function () {
						reject({
							status: xhr.status
						})
					}
					xhr.send()
				}else{
					let media;

					if (/\.(mp3|wav|m4a)$/i.test(src)) {
						media = document.createElement('audio');
					} else if (/\.(mp4|m3u8)(\?.*)?$/i.test(src)) {
						media = document.createElement('video');
					} else {
						reject(false);
						return;
					}

					media.src = src + (src.includes('?') ? '&' : '?') + 'cb=' + Date.now();
					media.onloadeddata = () => resolve(true);
					media.onerror = () => reject(false);
					media.load();
				}
				
			} catch (err) {
				reject(err);
			}
		})
	}

	function getSource(media) {
		if (media.attr('src')) {
			mediaSrcEl = media;
			mediaSrc = mediaSrcEl.attr('src');
		} else if (media.data('src')) {
			mediaSrcEl = media;
			mediaSrc = mediaSrcEl.data('src');
		} else if (media.find("source").attr('src')) {
			mediaSrcEl = media.find("source");
			mediaSrc = mediaSrcEl.attr('src');
		} else if (media.find("source").data('src')) {
			mediaSrcEl = media.find("source");
			mediaSrc = media.find("source").data('src');
		} else if (media.parent().data('src')) {
			mediaSrcEl = media.parent();
			mediaSrc = media.parent().data('src');
		} else {
			return false;
		}

		return {
			mediaSrcEl,
			mediaSrc
		}
	}

	function getPlayerSrc(container, autostart) {
		if (container.hasClass('cb-player--media-loaded') || container.hasClass('cb-player--media-ready')) {
			return;
		}

		if (typeof autostart === 'undefined' || autostart === null) {
			var autostart = true;
		}

		if (!container.data('backtracking')) {
			container.addClass("cb-player-progressbar-off");
		}

		let settings = container.data('settings')
		let media = container.find('.cb-player-media-source')

		let source = getSource(media);
		if (!source) {
			return;
		}

		if (source.mediaSrc.toLowerCase().match(/(.m3u8)/) && typeof Hls === 'undefined') {
			displayError(container, 'hls.js ist not found');
			return;
		}

		let provider = getProvider(source.mediaSrc);

		if (source.mediaSrc.toLowerCase().match(/(.m3u8)/) && Hls.isSupported()) {
			var config = {
				startPosition: -1,
				capLevelToPlayerSize: false,
				debug: false,
				defaultAudioCodec: undefined,
				initialLiveManifestSize: 1,
				maxBufferLength: 30,
				maxMaxBufferLength: 600,
				maxBufferSize: 60 * 1000 * 1000,
				maxBufferHole: 0.5,
				lowBufferWatchdogPeriod: 0.5,
				highBufferWatchdogPeriod: 3,
				nudgeOffset: 0.1,
				nudgeMaxRetry: 3,
				maxFragLookUpTolerance: 0.2,
				liveSyncDurationCount: 3,
				enableWorker: true,
				enableSoftwareAES: true,
				manifestLoadingTimeOut: 10000,
				manifestLoadingMaxRetry: 1,
				manifestLoadingRetryDelay: 500,
				manifestLoadingMaxRetryTimeout: 64000,
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
				maxAudioFramesDrift: 1,
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

			hls = new Hls(config)
			hls.attachMedia(media[0])
			hls.loadSource(source.mediaSrc)

			container.addClass('cb-player--media-ready')

			hls.on(Hls.Events.ERROR, function (event, data) {
				if (container.hasClass('cb-player--media-playing')) {
					return;
				}

				switch (data.details) {
					case Hls.ErrorDetails.MANIFEST_LOAD_ERROR:
						try {
							displayError(container, 'cannot Load Manifest' + data.context.url);
							if (data.response.code === 0) {
								displayError(container, "this might be a CORS issue, consider installing <a href=\"https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi\">Allow-Control-Allow-Origin</a> Chrome Extension");
							}
						} catch (err) {
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

				if (data.fatal) {
					displayError(container, 'The Livestream is not available.');

					container.removeClass("cb-player--media-loaded");
					hls.destroy();
					return;
				}
			});

			hls.on(Hls.Events.MEDIA_ATTACHED, function (event, data) {
				container.addClass("cb-player--media-loaded");
			});

			hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
				container.removeClass('cb-player--initialized');

				setVolume(container, container.data('volume'));

				if (autostart) {
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

			var firstLoad = true;
			hls.on(Hls.Events.LEVEL_LOADED, function (event, data) {

				if (data.details.live) {
					container.addClass('cb-player--livestream')
					container.data({
						'is-livestream': data.details.live,
						'fragmentDuration': data.details.averagetargetduration,
					})
				} else {
					container.find('.cb-player-progress-slider').attr('tabindex', 0)
				}

				if (firstLoad) {

					if (container.data('is-livestream')) {
						container.find('.cb-player-progress-slider').attr('aria-valuenow', 100)
					}

					container.find('.cb-player-time-duration').text(formatTime(data.details.totalduration, container))
					container.data('duration', data.details.totalduration)

					if (!source.mediaSrcEl.attr('video')) {
						source.mediaSrcEl.remove()
					}

					firstLoad = false
				}
			});

			hls.on(Hls.Events.FRAG_BUFFERED, function (event, data) {

				if (!container.data('bufferTimer')) {
					container.data('bufferTimer', true);

					hls.bufferTimer = window.setInterval(function () {
						videoBuffer(container);
					}, 200);
				}

				container.data({
					'level': hls.currentLevel + 1,
				});

				container.removeClass("cb-player--media-loaded");
			});

		} else if (source.mediaSrc.toLowerCase().match(/(.mp4)/) || isVimeoProgressive(source.mediaSrc) || (source.mediaSrc.toLowerCase().match(/(.m3u8)/) && Hls)) {
			// (Hls && (!isSupported() && mediaSrc.match(/(.m3u8)/)) || mediaSrc.match(/(.mp4)/)

			fileExist(source.mediaSrc).then(function (e) {
				source.mediaSrcEl.attr("src", source.mediaSrc);

				//fix firefox content by ajax
				setTimeout(function () {
					media[0].load();
					container.addClass("cb-player--media-loaded");
				});

				media.on('loadedmetadata', function () {
					var mediaDuration = formatTime(media[0].duration, media.closest(".cb-player"))
					media.closest(".cb-player").find(".cb-player-time-duration").text(mediaDuration)

					container.addClass('cb-player--media-ready')
					container.removeClass('cb-player--initialized')
					container.find('.cb-player-progress-slider').attr('tabindex', 0)

					container.data({
						'videowidth': media[0].videoWidth,
						'videoheight': media[0].videoHeight,
						'ratio': media[0].videoWidth / media[0].videoHeight,
						'duration': Math.floor(media[0].duration)
					})

					setVolume(container, container.data('volume'))

					if (autostart) {
						toggleMediaPlayPause(container)
					}

					if ($.isFunction(settings.mediaMetaIsLoaded)) {
						settings.mediaMetaIsLoaded.call(this, container);
					}
				})
			}).catch(function (err) {
				displayError(container, 'File not exist');
				return;
			})

		} else if (source.mediaSrc.toLowerCase().match(/(.mp3)/) || source.mediaSrc.toLowerCase().match(/(.wav)/) || source.mediaSrc.toLowerCase().match(/(.m4a)/)) {

			fileExist(source.mediaSrc).then(function (e) {
				source.mediaSrcEl.attr("src", source.mediaSrc);

				setTimeout(function () {
					media[0].load();
					container.addClass("cb-player--media-loaded");
				});

				media.on('loadedmetadata', function () {
					var mediaDuration = formatTime(media[0].duration, media.closest(".cb-player"))
					media.closest(".cb-player").find(".cb-player-time-duration").text(mediaDuration)

					container.addClass('cb-player--media-ready')
					container.removeClass('cb-player--initialized')
					container.find('.cb-player-progress-slider').attr('tabindex', 0)

					container.data({
						'duration': media[0].duration
					})

					if (autostart) {
						toggleMediaPlayPause(container)
					}

					if ($.isFunction(settings.mediaMetaIsLoaded)) {
						settings.mediaMetaIsLoaded.call(this, container)
					}
				});
			}).catch(function (err) {
				displayError(container, 'File not exist');
				return;
			})

		} else if (provider == 'vimeo' || provider == 'youtube') {
			//check is Viemo or Youtube iFrame
		} else {
			displayError(container, 'File Type not Supported');
			return;
		}

		if ($.isFunction(settings.mediaIsReady)) {
			settings.mediaIsReady.call(this, container);
		}
	}

	function stopPlayingAll(el) {
		$('.cb-player--media-playing').not(el).each(function () {
			var container = $(this),
				player = container.find('.cb-player-media-source')[0];

			if (!container.data('backgroundMode')) {
				if (container.hasClass('cb-player--media-ready') && !player.paused) {
					//Fix Clear DOM before call pause
					$('body').height();

					videoStop(container, player);
				}
			}
		});
	}

	function videoStart(container, player) {
		if (typeof hls !== 'undefined' && container.data('hlsStopLoad')) {
			hls.startLoad()
		}

		let settings = container.data('settings')

		if (container.data('iframe') && container.data('iframe') == 'youtube') {
			container.data('instance').playVideo()

			container.find('.cb-player-play')
				.attr('aria-label', settings.labels.pause)
				.attr('aria-pressed', true)

		} else {

			let saveVolume = false
			// iPad fix play video on first tab
			if (container.data('iframe') == 'vimeo' && container.data('isIPadOs')) {
				saveVolume = container.data('volume')

				// Mutet video 
				setVolume(container, 0)
			}

			if (container.data('iframe') == 'vimeo') {
				player = container.data('embed');
			}

			var promise = player.play();

			if (promise !== undefined) {
				promise.then(function () {
					clearInterval(watchProgress);

					if (!container.data('backgroundMode')) {
						stopPlayingAll(container);
					}

					container.find('.cb-player-play')
						.attr('aria-label', settings.labels.pause)
						.attr('aria-pressed', true)

					// Restore volume
					if (saveVolume !== false) {
						setVolume(container, saveVolume)
					}

					watchProgress = setInterval(function () {
						watchProgressLoading(player);
					}, 500);
				}).catch(function () {
					console.log(promise);
				});
			}
		}
	}

	function videoStop(container, player, forced = false) {
		let settings = container.data('settings')

		// Disable pause on background videos by call mediaPause
		if (container.data('backgroundMode') && !forced) {
			return
		}

		if (container.data('iframe')) {
			if (container.data('iframe') == 'youtube') {

				// Check youtube instance exist  
				if (container.data('instance')) {
					container.data('instance').pauseVideo();
				}
			} else if (container.data('iframe') == 'vimeo') {
				player = container.data('embed');

				player.pause();
				clearInterval(watchProgress);
			}

			container.find('.cb-player-play')
				.attr('aria-label', settings.labels.play)
				.attr('aria-pressed', false)

		} else {
			player.pause();
			clearInterval(watchProgress);

			container.find('.cb-player-play')
				.attr('aria-label', settings.labels.play)
				.attr('aria-pressed', false)
		}
	}

	function showPoster(container) {
		container.find('.cb-player-poster').show()
	}

	function hidePoster(container) {
		container.find('.cb-player-poster').hide()
	}

	function toggleMediaPlayPause(container) {
		var player = container.find('.cb-player-media-source')[0];

		if (!container.data('backgroundMode')) {
			stopPlayingAll(container);
		};

		if (container.data('iframe')) {

			if (container.data('iframe') == 'youtube') {
				//check youtube is playing
				//0 - End
				//1 - Playing
				//2 - Pause
				//3 - buffered
				//5/-1 unstarted

				if (container.data('instance').getPlayerState() != 1) {
					videoStart(container, false)
				} else if (container.data('instance').getPlayerState() == 1) {
					videoStop(container, false)
				}
			} else if (container.data('iframe') == 'vimeo') {
				var embedPlayer = container.data('embed');

				embedPlayer.getPaused().then(function (paused) {
					if (paused) {
						videoStart(container, embedPlayer);
					} else {
						videoStop(container, embedPlayer);
					}
				});
			}
		} else {
			if (player.paused) {
				videoStart(container, player);
			} else {
				videoStop(container, player);
			}
		}

		container.removeClass('cb-player--initialized');
	}

	function initPlayer(container) {

		if (container.hasClass('cb-player--initialized')) {
			return;
		}

		container.addClass('cb-player--initialized');

		if (container.hasClass("cb-player--media-ready")) {
			toggleMediaPlayPause(container);
		} else {
			getPlayerSrc(container);
		}
	}

	function watchProgressLoading(player) {
		var container = $(player).closest(".cb-player");

		if (container.data('backtracking') == true) {
			for (var i = 0; i < player.buffered.length; i++) {
				var buffer = player.buffered,
					time = player.currentTime;

				if (buffer.start(i) <= time && time <= buffer.end(i)) {
					var loadPercentage = Math.floor(buffer.end(i)) / Math.floor(player.duration) * 100;
				}
			}

			container.find('.cb-player-progress-load').css('width', loadPercentage + '%');
		}
	}

	function setVolume(container, volume) {
		let player = container.find('.cb-player-media-source')
		let slider = container.find('.cb-player-volume-slider')
		let progress = container.find('.cb-player-volume-bar')
		let settings = container.data('settings')

		if (volume.target) {
			// Is event
			let e = volume

			if (volume.type == 'touchmove' || volume.type == 'touchstart') {
				e = volume.originalEvent.touches[0]
			}

			let sliderContainerV = container.find(".cb-player-volume-wrap--vertical")
			let sliderContainerH = container.find(".cb-player-volume-wrap--horizontal")

			if (sliderContainerH.length) {
				volume = (e.pageX - slider.offset().left) / slider.width() * 100;
			} else if (sliderContainerV.length) {
				volume = ((e.pageY - slider.offset().top - slider.width()) / slider.width()) * -1;
				volume = volume * 100;
			}

			volume = Math.round(volume);

			if (volume < 0) {
				volume = 0;
			}

			if (volume > 100) {
				volume = 100;
			}
		}

		if (typeof volume === 'undefined') {
			return;
		}

		if (container.data('iframe')) {
			if (container.data('iframe') == 'youtube') {
				container.data('instance').setVolume(volume);
			} else if (container.data('iframe') == 'vimeo') {
				var embedPlayer = container.data('embed');

				embedPlayer.setVolume(volume / 100);
			}
		} else {
			player[0].volume = volume / 100;
		}

		if (slider.length && progress.length) {
			slider.attr('aria-valuenow', volume)
			slider.attr('aria-valuetext', settings.labels.volume + ' ' + volume + '%')

			progress.css('width', volume + '%')
		}

		let soundButton = container.find('.cb-player-sound')
		if (volume == 0) {
			container.addClass("cb-player--media-muted")

			if (soundButton.length) {
				soundButton
					.attr('aria-label', settings.labels.unmute)
					.attr('aria-pressed', true)
			}

			if (container.data('iframe')) {
				if (container.data('iframe') == 'youtube') {
					container.data('instance').mute()
				}
			} else {
				player.prop('muted', true)
			}

		} else {
			container.removeClass("cb-player--media-muted");

			if (soundButton.length) {
				soundButton
					.attr('aria-label', settings.labels.mute)
					.attr('aria-pressed', false)
			}

			if (container.data('iframe')) {
				if (container.data('iframe') == 'youtube') {
					container.data('instance').unMute();
				}
			} else {
				player.prop('muted', false);
			}
		}

		// Save current volumne
		container.data('volume', volume)

		settings = container.data('settings');
		if ($.isFunction(settings.mediaChangeVolume)) {
			settings.mediaChangeVolume.call(this, container, volume);
		}
	}

	function changeVolume(container, value) {
		let volumeSlider = container.find('.cb-player-volume-slider')

		if (volumeSlider.length) {
			let newVolume = parseInt(volumeSlider.attr('aria-valuenow')) + value

			// Set limits
			if (newVolume < 0) {
				newVolume = 0
			} else if (newVolume > 100) {
				newVolume = 100
			}

			setVolume(container, newVolume)
		}
	}

	function setTimeformat(el, format) {
		if (!el.data('timeformat')) {
			el.data('timeformat', format);

			var time;

			//set current playtime
			if (format == 'hh:mm:ss') {
				time = '00:00:00';
			}

			el.find('.cb-player-time-current').text(time);
		}
	}

	function formatTime(time, container, complete = false) {
		var time = time,
			timeNegative = false,
			timeArray = [];

		if (!$.isNumeric(Math.ceil(time))) {
			return false;
		}

		if (typeof container === 'undefined') {
			container = false;
		}

		h = Math.floor(Math.abs(time) / 3600);
		if (h != 0 || container.data('timeformat') == 'hh:mm:ss' || complete) {
			h = (h >= 10) ? h : "0" + h;

			timeArray.push(h.toString());
			setTimeformat(container, 'hh:mm:ss');
		}

		m = Math.floor(Math.abs(time) / 60) % 60;
		m = (m >= 10) ? m : "0" + m;

		timeArray.push(m.toString());
		setTimeformat(container, 'mm:ss');


		s = Math.ceil(Math.abs(time) % 60);
		s = (s >= 10) ? s : "0" + s;
		timeArray.push(s.toString());

		var t = timeArray.join(':');

		if (time < 0) {
			//negative time
			time = Math.abs(time);
			timeNegative = true;

			t = '-' + t;
		}

		return t;
	}

	function formatTimeAccessibility(time, container) {

		let settings = container.data('settings')
		let out = [];
		if (container.data('timeformat') == 'hh:mm:ss') {
			h = Math.floor(Math.abs(time) / 3600);
			out.push(h + ' ' + settings.labels.hours)
		}

		m = Math.floor(Math.abs(time) / 60) % 60;
		out.push(m + ' ' + settings.labels.minutes)

		s = Math.ceil(Math.abs(time) % 60);
		out.push(s + ' ' + settings.labels.seconds)

		return out.join(' ')
	}

	function setCurrentTime(container, time) {
		var player = container.find('.cb-player-media-source');

		if (container.data('iframe')) {
			if (container.data('iframe') == 'youtube') {
				container.data('instance').seekTo(time);
			} else if (container.data('iframe') == 'vimeo') {
				var embedPlayer = container.data('embed');

				embedPlayer.setCurrentTime(time);
			}

		} else {
			player[0].currentTime = time;
		}
	}

	function playPosition(player, value) {
		var container = player.closest('.cb-player');

		if (container.data('is-livestream')) {

			var totalDuration = container.data('duration'),
				duration = Math.ceil(totalDuration * (value / 100));

			playbacktime = totalDuration - duration
			currentDuration = container.data('currentDuration');

			setCurrentTime(container, currentDuration - playbacktime);

		} else {

			var duration;

			if (container.data('iframe')) {
				duration = container.data('duration');
			} else {
				duration = player[0].duration;
			}

			setCurrentTime(container, duration * (value / 100));
		}
	}

	function updatePlaytime(player, playtime) {
		if ($.isNumeric(playtime)) {
			playtime = formatTime(playtime, player.closest('.cb-player'));
		}

		player.closest('.cb-player').find('.cb-player-time-current').text(playtime);
	}

	function updateRemainingPlayTime(player, time) {
		if (!player.length && !time) {
			return;
		}

		time = formatTime(time, player.closest(".cb-player"));
		player.closest('.cb-player').find('.cb-player-time-duration').text(time);
	}

	function updateProgress(container, progresstime) {
		var progressVisibile = container.find('.cb-player-progress-play');

		if (container.length) {
			progressVisibile.css('width', progresstime + '%');
		}

		container.find('.cb-player-progress-slider').attr('aria-valuenow', progresstime);
	}

	function watchTimer(container) {
		let player = container.find('.cb-player-media-source')
		let progressSlider = container.find('.cb-player-progress-slider')
		let progressVisibile = container.find('.cb-player-progress-play')
		let settings = container.data('settings')
		let progresstime, playtime

		if (!player[0].duration && !container.data('iframe') && !container.hasClass('cb-player--media-ready')) {
			return;
		}

		if (container.data('is-livestream')) {
			var duration = container.data('duration');

			progresstime = (container.data('currentDuration') / duration) * 100;
			playtime = player[0].currentTime;

			if (container.data('backtracking')) {
				playtime = playtime - duration;
			}
		} else if (container.data('iframe')) {

			if (container.data('iframe') == 'youtube') {
				//youtube current playtime
				playtime = container.data('instance').getCurrentTime();
				progresstime = playtime * (100 / container.data('duration'));

				progressSlider.attr('aria-valuetext', formatTimeAccessibility(playtime, container) + ' ' + settings.labels.sliderOf + ' ' + formatTimeAccessibility(container.data('duration'), container))

			} else if (container.data('iframe') == 'vimeo') {

				var embedPlayer = container.data('embed');

				embedPlayer.getCurrentTime().then(function (seconds) {
					updatePlaytime(player, seconds);

					progresstime = seconds * (100 / container.data('duration'));
					updateProgress(container, progresstime)

					progressSlider.attr('aria-valuetext', formatTimeAccessibility(seconds, container) + ' ' + settings.labels.sliderOf + ' ' + formatTimeAccessibility(container.data('duration'), container))
				});
			}
		} else {
			playtime = player[0].currentTime;
			progresstime = player[0].currentTime * (100 / player[0].duration);

			progressSlider.attr('aria-valuetext', formatTimeAccessibility(playtime, container) + ' ' + settings.labels.sliderOf + ' ' + formatTimeAccessibility(container.data('duration'), container))
		}

		if (container.data('contextInfo')) {
			let videoWidth, videoHeight;

			if (container.data('iframe') == 'vimeo') {
				var embedPlayer = container.data('embed');

				Promise.all([embedPlayer.getVideoWidth(), embedPlayer.getVideoHeight()]).then((dimensions) => {
					container.find('.cb-debug-resolution').text(dimensions[0] + 'x' + dimensions[1]);
				});

				embedPlayer.getCurrentTime().then((seconds) => {
					container.find('.cb-debug-current').text(Math.floor(seconds) + 's');
				});
			} else {
				container.find('.cb-debug-resolution').text(player[0].videoWidth + 'x' + player[0].videoHeight);
				container.find('.cb-debug-current').text(Math.floor(player[0].currentTime) + 's');

				if (container.data('level')) {
					container.find('.cb-debug-levels').text(container.data('level') + ' of ' + container.data('levels').length);
				}

				if (container.data('buffer')) {
					container.find('.cb-debug-buffer').text(Math.round(container.data('buffer')) + 's');
				}
			}

			container.find('.cb-debug-duration').text(container.data('duration') + 's');
		}

		if (container.data('is-livestream')) {
			ariaValue = progressSlider.attr('aria-valuenow');

			var value = ariaValue;
			progressTime = Math.ceil(duration / 100 * value);
			progressPercentage = progressTime / duration * 100;

			if (container.data('backtracking')) {
				//check livestream position
				if (container.length) {
					progressVisibile.css('width', progressPercentage + '%');
				}

				if (Math.round(ariaValue) >= 99) {

				} else {
					playtime = -Math.abs((progressPercentage - 100) / 100 * duration);
				}
			} else {
				playtime = 'Live';
			}

		} else if (container.data('iframe') != 'vimeo') {
			updateProgress(container, progresstime);
		}

		if (container.data('iframe') != 'vimeo') {
			updatePlaytime(player, playtime);
		}

		if (container.data('settings')['controlTimeBackwards']) {
			var remainingPlayTime = false;

			if (container.data('iframe')) {
				if (container.data('iframe') == 'youtube') {
					remainingPlayTime = container.data('duration') - container.data('instance').getCurrentTime();
				} else if (container.data('iframe') == 'vimeo') {
					let embedPlayer = container.data('embed');
					embedPlayer.getCurrentTime().then(function (seconds) {
						let remainingPlayTime = container.data('duration') - seconds

						updateRemainingPlayTime(player, remainingPlayTime)
					});
				}

			} else {
				remainingPlayTime = player[0].duration - player[0].currentTime;
			}

			if (remainingPlayTime) {
				updateRemainingPlayTime(player, remainingPlayTime)
			}
		}
	}

	function watchFullscreenActive() {
		const nativeFullscreen = $('.cb-player.cb-player--fullscreen-native')

		if (nativeFullscreen.length) {
			if (nativeFullscreen.data('iframe') == 'vimeo') {
				player = nativeFullscreen.data('embed');
				player.getFullscreen().then(function (fullscreen) {
					if (fullscreen === false) {
						let settings = nativeFullscreen.data('settings')

						nativeFullscreen.removeClass('cb-player--fullscreen-native')
						nativeFullscreen.find('.cb-player-fullscreen')
							.attr('aria-label', settings.labels.fullscreenOff)
							.attr('aria-pressed', false)
						clearInterval(watchFullscreen)
					}
				});
			}
		} else if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement && !document.webkitDisplayingFullscreen) {
			const container = $('.cb-player.cb-player--fullscreen')
			const settings = container.data('settings')

			controlsToggle(container, false);

			container.removeClass('cb-player--fullscreen');
			container.find('.cb-player-fullscreen')
				.attr('aria-label', settings.labels.fullscreenOff)
				.attr('aria-pressed', false)

			clearInterval(watchFullscreen);
		}
	}

	function toggleFullscreen(container, player) {
		// https://webkit.org/blog/7929/designing-websites-for-iphone-x/

		let viewport = $('meta[name="viewport"]')[0];
		const property = 'viewport-fit=cover';

		// Inject the viewport meta if required
		if (!viewport) {
			viewport = document.createElement('meta');
			viewport.setAttribute('name', 'viewport');
		}

		const hasProperty = viewport.content.includes(property);

		if (!$('.cb-player--fullscreen').length) {
			let settings = container.data('settings')
			let fullscreenActive = true

			if (player.requestFullScreen) {
				player.requestFullScreen();
			} else if (container[0].mozRequestFullScreen) {
				container[0].mozRequestFullScreen();
			} else if (container[0].webkitRequestFullscreen) {
				//fullscreen support webkit
				container[0].webkitRequestFullscreen();
			} else if (container[0].msRequestFullscreen) {
				//fullscreen IE 11
				container[0].msRequestFullscreen();
			} else if (player.webkitSupportsFullscreen) {
				//fullscreen support for ios
				player.webkitEnterFullScreen();
			} else {
				// Use nativ fullscreen
				fullscreenActive = false

				if (container.data('iframe') == 'vimeo') {
					player = container.data('embed')

					player.requestFullscreen().then(function () {
						watchFullscreen = setInterval(watchFullscreenActive, 250)

						container.addClass('cb-player--fullscreen-native');
						container.find('.cb-player-fullscreen')
							.attr('aria-label', settings.labels.fullscreenOn)
							.attr('aria-pressed', true)
					})
				} else if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
					// Fallback fullscreen 

					// Change viewport on ios
					if (hasProperty == false) {
						viewport.content += `, ${property}`;
					}

					$('html').addClass('html-cb-player-fullscreen-fallback-active')
					$('body').css('overflow', 'hidden')

					container.addClass('cb-player--fullscreen cb-player--fullscreen-fallback')
					return
				}
			}

			if (fullscreenActive) {
				watchFullscreen = setInterval(watchFullscreenActive, 250)

				container.addClass('cb-player--fullscreen')
				container.find('.cb-player-fullscreen')
					.attr('aria-label', settings.labels.fullscreenOn)
					.attr('aria-pressed', true)
			}

		} else {

			if (container.hasClass('cb-player--fullscreen-fallback')) {

				// Change viewport on ios
				if (hasProperty) {
					viewport.content = viewport.content
						.split(',')
						.filter((part) => part.trim() !== property)
						.join(',');
				}

				$('html').removeClass('html-cb-player-fullscreen-fallback-active')
				$('body').css('overflow', '')

				container.removeClass('cb-player--fullscreen cb-player--fullscreen-fallback')
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
		}
	};

	function displayTime(container, position) {
		var displaytime;

		if (container.data('is-livestream')) {
			var duration = container.data('duration');

			displaytime = (position / 100 * duration) - duration;
		} else if (container.data('iframe')) {

			displaytime = container.data('duration') * position / 100;

		} else {
			player = container.find('.cb-player-media-source');
			displaytime = player[0].duration * position / 100;
		}

		if (displaytime < 0 && !container.data('is-livestream')) {
			displaytime = 0;
		}

		return displaytime;
	}

	function tooltip(container, position) {
		var tip = container.find('.cb-player-progress-tooltip');

		var tooltipTime = formatTime(displayTime(container, position), container);

		if (tooltipTime !== false) {
			tip.css('left', position + '%').text(tooltipTime);
		}
	}

	var lastTouchCoordinate = null;
	function seeking(e, container) {
		let x

		if (e.type == 'touchmove' || e.type == 'touchstart') {
			x = e.originalEvent.touches[0].pageX;

			lastTouchCoordinate = x;
		} else if (e.type == 'touchend') {
			x = lastTouchCoordinate;

			lastTouchCoordinate = null;
		} else {
			x = e.pageX;
		}

		let progress = container.find('.cb-player-progress')
		let progressSLider = progress.find('.cb-player-progress-slider')
		let position = (x - progress.offset().left) / progress.width() * 100

		position = position.toFixed(4);

		// container.find('.cb-player-poster').remove();

		if (position < 0) {
			position = 0;
		}

		if (position > 100) {
			position = 100
		}

		if (container.hasClass('cb-player--media-ready') && container.data('backtracking')) {
			progressSLider.attr('aria-valuenow', position);
			container.find('.cb-player-time-current').text(formatTime(displayTime(container, position), container));

			tooltip(container, position);

			if (e.type != 'touchmove') {
				playPosition(container.find(".cb-player-media-source"), position);
			}

			if (e.type == 'touchmove') {
				container.find('.cb-player-progress-play').css('width', position + '%');
			}
		}
	}

	function seekToSecond(container, second) {
		let player = container.find('.cb-player-media-source')
		let currentTime, newTime

		// Get current time
		if (container.data('iframe')) {
			if (container.data('iframe') == 'youtube') {
				currentTime = container.data('instance').getCurrentTime()
			} else if (container.data('iframe') == 'vimeo') {
				let embedPlayer = container.data('embed')

				embedPlayer.getCurrentTime().then(function (seconds) {
					let currentTime = seconds

					// Set new time
					let newTime = currentTime + second

					// Check limits
					if (newTime <= 0) {
						newTime = 0
					} else if (newTime > container.data('duration')) {
						newTime = container.data('duration')
					}

					setCurrentTime(container, newTime)
				});

				return;
			}
		} else {
			currentTime = player[0].currentTime
		}

		// Set new time
		newTime = currentTime + second

		// Check limits
		if (newTime <= 0) {
			newTime = 0
		} else if (newTime > container.data('duration')) {
			newTime = container.data('duration')
		}

		setCurrentTime(container, newTime)
	}

	function getbacktrackingPosition(container) {
		var media = container.find('video, audio');

		if (container.data('duration')) {
			var durationTime = Math.round((media[0].duration) - container.data('duration')),
				playTime = Math.round(media[0].currentTime - container.data('duration'));

			return durationTime - playTime;
		}

		return false;
	}

	function startWatchControlHide(container) {
		let settings = container.data('settings')

		if (container.hasClass('cb-player--media-playing') && settings.controlHide) {

			clearTimeout(watchControlHide)
			controlsToggle(container, false)

			watchControlHide = setTimeout(function () {
				controlsToggle(container, true)
			}, settings.controlHideTimeout);
		}
	}

	function watchSubtitles(container) {
		var el = container.find('.cb-player-media-source'),
			tracks = el[0].textTracks,
			lastCueId = container.data('lastCueId'),
			settings = container.data('settings');

		if (tracks && container.hasClass('cb-player--with-subtitles')) {
			for (var i = 0; i < tracks.length; i++) {
				var textTrack = el[0].textTracks[i],
					currentCue = false;

				if (textTrack.mode == 'showing') {

					for (var i = 0; i < textTrack.cues.length; i++) {
						var cue = textTrack.cues[i];

						if (cue.startTime < el[0].currentTime && cue.endTime > el[0].currentTime) {
							currentCue = cue;
						}
					}

					var currentSubtitle = container.find('.cb-player-subtitle-layer');

					if (currentCue) {

						if (lastCueId != currentCue.startTime) {
							currentSubtitle.remove();

							$('<div class="cb-player-subtitle-layer"><span class="cb-player-subtitle-text">' + currentCue.text + '</span></div>').appendTo(container);

							container.data('lastCueId', currentCue.startTime);

							if ($.isFunction(settings.mediaTrackChange)) {
								settings.mediaTrackChange.call(this, container, currentCue.text);
							}
						}
					} else {
						if (currentSubtitle.length) {
							lastCueId = false;
							currentSubtitle.remove();
						}
					}
				}
			}
		}
	}

	function getProvider(url) {
		// YouTube
		if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(url)) {
			return 'youtube'
		}

		// Vimeo
		if (/^https?:\/\/(player.vimeo.com\/video\/|vimeo.com)\d{0,9}(?=\b|\/)/.test(url)) {
			return "vimeo"
		}

		if (url.toLowerCase().match(/(.mp4)/)) {
			return 'video/mp4'
		}

		if (url.toLowerCase().match(/(.m3u8)/)) {
			return "stream"
		}

		// Audio
		if (url.toLowerCase().match(/(.mp3)/)) {
			return 'audio/mp3'
		}

		if (url.toLowerCase().match(/(.wav)/)) {
			return 'audio/wav'
		}

		if (url.toLowerCase().match(/(.m4a)/)) {
			return 'audio/mp4'
		}

		return null;
	}

	function getYoutubeId(url) {
		const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/|u\/\w\/|.+\?v=)?([^#&?]{11})/;
		const match = url.match(regex);
		return match ? match[1] : null;
	}

	function isYouTubeShortsUrl(url){
		const regex = /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]{11}/;
  		return regex.test(url);
	}

	function setDuration(container) {
		if (container.data('duration')) {
			var media = container.find('.cb-player-media-source');

			container.find('.cb-player-time-duration').text(formatTime(container.data('duration'), container));
		}
	}

	function getYoutubeHost(config) {
		if (config.youtube.noCookie) {
			return 'https://www.youtube-nocookie.com';
		}

		if (window.location.protocol === 'http:') {
			return 'http://www.youtube.com';
		}

		return undefined;
	}

	function isVimeoProgressive(url) {
		var regex = /^.*(player.vimeo.com\/progressive_redirect\/playback\/(\d+)\/rendition\/(\d+[p])).*/;
		return url.match(regex) ? true : false;
	}

	function getVimeoId(url) {
		const regex = /^.*(vimeo\.com\/(video\/|))([0-9]+)/;
		const result = url.match(regex)
		if (result) {
			return {
				'id': RegExp.$3,
				'type': 'vimeovideo'
			}
		}

		const regexEvent = /^.*(vimeo\.com\/event\/)([0-9]+)\/(embed|embed\/|)([0-9]+)?/;
		const resultEvent = url.match(regexEvent)
		if (resultEvent) {
			return {
				'id': RegExp.$2,
				'id2': RegExp.$4,
				'type': 'vimeoevent'
			}
		}

		return url;
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

	function buildUrlParams(input) {
		var params = new URLSearchParams();

		$.each(input, function (key, value) {
			params.set(key, value);
		});

		return params.toString();
	}

	function uniqid(a = "", b = false) {
		const c = Date.now() / 1000;
		let d = c.toString(16).split(".").join("");
		while (d.length < 14) d += "0";
		let e = "";
		if (b) {
			e = ".";
			e += Math.round(Math.random() * 10000);
		}
		return a + d + e;
	}

	function fitIframe(container) {
		if (container.data('ratio') && container.data('iframe')) {
			const containerHeight = container.height()
			const containerWidth = container.width()
			const containerRatio = (containerWidth / containerHeight).toFixed(4)
			const media = container.find('.cb-player-media-container')
			const settings = container.data('settings');

			if ((container.data('iframe') == 'vimeo' && settings.vimeo.fitIframe) || container.data('iframe') == 'youtube') {
				// Ratio is not 16/9
				if (container.data('ratio') && container.data('ratio').toFixed(4) != containerRatio) {
					const newPadding = 1 / container.data('ratio') * 100
					container.find('.cb-player-media').css('padding-bottom', newPadding + '%')
				}
			}

			if (container.data('iframe') == 'vimeo' && settings.vimeo.fitIframe) {
				//fit video in height
				if (containerRatio > container.data('ratio')) {
					container.addClass('cb-player--iframe-fit')
					let newWidth = containerHeight * container.data('ratio');

					media.css({
						'height': containerHeight,
						'width': newWidth
					});
				} else {
					container.removeClass('cb-player--iframe-fit')
					media.css({
						'height': '',
						'width': ''
					});
				}
			} else if (container.data('iframe') == 'youtube') {
				if (containerRatio > container.data('ratio')) {
					container.addClass('cb-player--iframe-fit')
					let newWidth = containerHeight * container.data('ratio');

					media.css({
						'height': containerHeight,
						'width': newWidth,
					});
				} else {
					container.removeClass('cb-player--iframe-fit')
					media.css({
						'height': '',
						'width': ''
					});
				}
			}
		}
	}

	function initIframes(wrap, _this) {
		const source = wrap.data('source')
		const settings = wrap.data('settings')
		const provider = getProvider(source.mediaSrc)

		let youtube = {
			setup: function () {
				if (window.YT && window.YT.Player) {
					youtube.ready.call(_this);
				} else {
					var callback = window.onYouTubeIframeAPIReady;

					window.onYouTubeIframeAPIReady = function () {
						youtube.ready.call(_this);
					};

					$.getScript(urls.youtube.sdk, function (jd) { });

					youtubeInit = true;
				}
			},
			ready: function ready() {

				const videoId = getYoutubeId(source.mediaSrc);
				const isShort = isYouTubeShortsUrl(source.mediaSrc);

				if(isShort){
					wrap.addClass('cb-player--youtube-short')
				}

				let id = uniqid()
				let media = wrap.find('.cb-player-media')
				let ytTimer
				let ytBufferTimer

				let mediaContainer = $('<div class="cb-player-media-container"></div>')
				mediaContainer.appendTo(media)

				var wrapper = document.createElement('div');
				wrapper.setAttribute('class', 'cb-player-media-embed');
				$(wrapper).appendTo(mediaContainer);

				el = $('<div>')
					.attr('id', id)
					.appendTo(wrapper);

				const thump = 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg'
				addPoster(wrap, thump)

				el.addClass('cb-player-media-iframe cb-player-media-source')
				el.attr('tabindex', '-1') // Disable focus iframe

				let ytLastEvent

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
						'onStateChange': function (e) {
							let instance = e.target

							clearTimeout(ytTimer)
							clearTimeout(ytBufferTimer)

							if (e.data == YT.PlayerState.PLAYING) {
								wrap.addClass('cb-player--media-playing').removeClass('cb-player--media-loaded');

								function ytTimeupdate() {
									watchTimer(wrap);
									if ($.isFunction(settings.mediaTimeupdate)) {
										settings.mediaTimeupdate.call(this, wrap, instance.getCurrentTime());
									}

									ytTimer = setTimeout(function () {
										ytTimeupdate()
									}, 250)
								}
								ytTimeupdate()

								if (!wrap.data('backgroundMode')) {
									stopPlayingAll(wrap)
								}

								hidePoster(wrap)

								if (ytLastEvent != 'play') {
									startWatchControlHide(wrap)
								}

								if ($.isFunction(settings.mediaIsPlay)) {
									settings.mediaIsPlay.call(this, wrap);
								}

								ytLastEvent = 'play'

							} else if (e.data == YT.PlayerState.PAUSED) {

								wrap.removeClass('cb-player--media-playing cb-player--media-loaded')

								clearTimeout(watchControlHide)
								controlsToggle(wrap, false)

								if ($.isFunction(settings.mediaIsPause)) {
									settings.mediaIsPause.call(this, wrap);
								}

								ytLastEvent = 'pause'

							} else if (e.data == YT.PlayerState.BUFFERING) {

								ytBufferTimer = setTimeout(() => {
									wrap.addClass('cb-player--media-loaded');
								}, 400)

							} else if (e.data == YT.PlayerState.ENDED) {

								wrap.addClass('cb-player--media-ended');
								wrap.removeClass('cb-player--media-playing')

								clearTimeout(watchControlHide)
								controlsToggle(wrap, false)
								showPoster(wrap)

								if (settings.loop) {
									videoStart(wrap, false)
								}

								if ($.isFunction(settings.mediaIsEnd)) {
									settings.mediaIsEnd.call(this, wrap);
								}

								ytLastEvent = 'ended'
							}
						},
						'onReady': function (e) {
							var instance = e.target;

							wrap.removeClass('cb-player--initialized')
							wrap.addClass('cb-player--media-ready')
							wrap.find('.cb-player-progress-slider').attr('tabindex', 0)

							//set functions
							wrap.data('instance', instance);

							//set duration
							wrap.data('duration', instance.getDuration());

							//set video ratio
							if (instance.options) {
								// Fix shorts has wrong sizes
								if(isShort){
									wrap.data('ratio', 0.5625)
								}else{
									wrap.data('ratio', instance.options.width / instance.options.height)
								}
							}

							if (settings.backgroundMode) {
								instance.mute();
							}

							if (settings.autoplay) {
								videoStart(wrap, false)
							}

							if (settings.volume && settings.muted === false) {
								setVolume(wrap, settings.volume)
							} else if (settings.muted) {
								setVolume(wrap, 0)
							}

							setTimeout(function () {
								setDuration(wrap);
							});

							if ($.isFunction(settings.mediaIsReady)) {
								settings.mediaIsReady.call(this, wrap);
							}

							fitIframe(wrap)
						}
					}
				});
			}
		}

		let vimeo = {
			setup: function () {
				if (window.Vimeo && window.Vimeo.Player) {
					vimeo.ready.call(_this);
				} else {
					$.getScript(urls.vimeo.sdk)
						.done(function (script, status) {

							vimeo.ready.call(_this);

							vimeoInit = true;

						}).fail(function (jqxhr, settings, exception) {
							console.warn('Vimeo SDK failed to load', jqxhr);
						});

				}
			},
			ready: function () {

				const getVimeo = getVimeoId(source.mediaSrc);

				wrap
					.addClass('cb-player--media-ready')
					.removeClass('cb-player--initialized')

				wrap.find('.cb-player-progress-slider').attr('tabindex', 0)

				var media = wrap.find('.cb-player-media')

				let mediaContainer = $('<div class="cb-player-media-container"></div>')
				mediaContainer.appendTo(media)

				var wrapper = document.createElement('div')
				wrapper.setAttribute('class', 'cb-player-media-embed')
				$(wrapper).appendTo(mediaContainer)

				var params = buildUrlParams({
					background: settings.backgroundMode,
					autopause: 0,
					loop: settings.loop,
					autoplay: settings.autoplay,
					muted: settings.muted,
					gesture: 'media',
					playsinline: true,
					byline: false,
					portrait: false,
					title: false,
					transparent: false
				})

				//Create a new DOM element
				//Use this to prevent play() failed error
				let iframe = document.createElement('iframe')
				let src

				if (getVimeo.type == 'vimeovideo') {
					src = format(urls.vimeo.iframe, getVimeo.id, params)
				} else {
					src = format(urls.vimeo.event, getVimeo.id, getVimeo.id2)
				}

				iframe.setAttribute('src', src);
				iframe.setAttribute('allowfullscreen', 'allowfullscreen');
				iframe.setAttribute('allow', 'fullscreen; autoplay; picture-in-picture; encrypted-media; accelerometer; gyroscope');

				if (settings.vimeo.referrerPolicy != null) {
					iframe.setAttribute('referrerpolicy', settings.vimeo.referrerPolicy)
				}

				$(iframe).appendTo(wrapper)
				$(iframe).addClass('cb-player-media-iframe cb-player-media-source')
				$(iframe).attr('tabindex', '-1') // Disable focus iframe

				// var poster = $('<div>')
				//  .addClass('cb-player-media-poster')
				//  .appendTo(media);

				let el = wrap.find('.cb-player-media')

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

				el.embed.ready().then(function () {
					if ($.isFunction(settings.mediaIsReady)) {
						settings.mediaIsReady.call(this, wrap);
					}
				})

				el.embed.on('bufferstart', function () {
					wrap.addClass('cb-player--media-loaded');
				});

				el.embed.on('bufferend', function () {
					wrap.removeClass('cb-player--media-loaded');
				});

				el.embed.on('play', function () {
					wrap.addClass('cb-player--media-playing').removeClass('cb-player--media-ended cb-player--media-loaded');

					if (!wrap.data('backgroundMode')) {
						stopPlayingAll(wrap)
					}

					fitIframe(wrap)
					hidePoster(wrap)
					startWatchControlHide(wrap)

					if ($.isFunction(settings.mediaIsPlay)) {
						settings.mediaIsPlay.call(this, wrap);
					}
				});

				el.embed.on('pause', function () {
					wrap.removeClass('cb-player--media-playing cb-player--media-loaded');

					clearTimeout(watchControlHide);
					controlsToggle(wrap, false);

					if ($.isFunction(settings.mediaIsPause)) {
						settings.mediaIsPause.call(this, wrap);
					}
				});

				el.embed.on('timeupdate', function () {
					watchTimer(wrap);

					if ($.isFunction(settings.mediaTimeupdate)) {
						el.embed.getCurrentTime().then(function (seconds) {
							settings.mediaTimeupdate.call(this, wrap, seconds);
						})
					}
				});

				el.embed.on('seeked', function (e) {
					// clearTimeout(watchControlHide)
					// controlsToggle(wrap, false)
				});

				el.embed.on('ended', function (data) {
					wrap.addClass('cb-player--media-ended');

					showPoster(wrap)

					if ($.isFunction(settings.mediaIsEnd)) {
						settings.mediaIsEnd.call(this, wrap);
					}
				});

				//set duration
				el.embed.getDuration().then(function (duration) {
					wrap.data('duration', duration);

					setTimeout(function () {
						setDuration(wrap);
					});
				}).catch(function (e) {
					displayError(el.closest(".cb-player"), e);
				});

				if (settings.muted) {
					setVolume(el.closest(".cb-player"), 0);
				}

				fitIframe(wrap)
			}
		}

		if (wrap.data('isConsent') === false) {
			// Disable init iframes
			return
		}

		if (provider == 'youtube' || provider == 'vimeo') {
			if (provider == 'youtube') {
				var checkYoutubeApiReady = function () {
					if (youtubeInit == false || (typeof window.YT !== 'undefined' && window.YT.Player)) {
						youtube.setup(_this);
					} else {
						setTimeout(checkYoutubeApiReady, 100);
					}
				}
				checkYoutubeApiReady();
			} else if (provider == 'vimeo') {

				var checkViemoApiReady = function () {
					if (vimeoInit == false || (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player)) {
						vimeo.setup(_this);
					} else {
						setTimeout(checkViemoApiReady, 100);
					}
				}
				checkViemoApiReady();
			}
		}
	}

	function destroyIframe(container) {
		const settings = container.data('settings')

		container.removeClass('cb-player--media-ready')
		container.find('.cb-player-media').empty()

		if (container.data('isConsent') === false) {
			let message = container.data('no-consent-message')
			if (!message) {
				message = settings.consentMessage
			}

			displayError(container, message, 'error-consent')
		}
	}

	function controlsToggle(container, conrolsHide) {
		let lastStatus = container.data('controlsHidden')
		let settings = container.data('settings')
		let controlsHidden

		// Fix remove video/overlay with playing video
		if (typeof settings === "undefined") {
			return
		}

		if (conrolsHide) {
			container.addClass('cb-player--control-hide')
			controlsHidden = true
		} else {
			container.removeClass('cb-player--control-hide')
			controlsHidden = false
		}

		container.data('controlsHidden', controlsHidden)

		if (lastStatus != controlsHidden) {
			if ($.isFunction(settings.mediaControlsChange)) {
				settings.mediaControlsChange.call(this, container, controlsHidden);
			}
		}
	}

	function addPoster(container, image) {
		if (!container.find('.cb-player-poster').length) {
			let poster = $('<div class="cb-player-poster"></div>')

			poster.css('background-image', 'url(' + image + ')')
			poster.prependTo(container);
		}
	}

	function createTrackItem(id, lang, label) {
		let item = $('<div>')

		item.addClass('cb-player-subtitle-track')
			.attr('data-lang', lang)
			.attr('tabindex', 0)
			.text(label)

		return item
	}

	function changeConsent(container) {
		const settings = container.data('settings')

		if ($.isFunction(settings.getConsent)) {
			const consent = settings.getConsent.apply(this, arguments)

			container.data('isConsent', consent ? true : false);

			container.removeClass('cb-player--error-consent');
			container.find('.cb-player-error').remove()
		}
	}

	function CBplayer(element, options) {
		this.options = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.element = element;
		this.init(this.options);
		this.attachEvents(this.element, this.options);
	}

	CBplayer.prototype = {
		init: function (options) {
			var el = $(this.element),
				_this = this,
				wrap;

			if (el.is('video') || el.is('audio')) {
				if (el.closest('.cb-player').data('initialized')) {
					return;
				}

				if (el.closest('.cb-player').length) {
					el = el.closest('.cb-player');
				}

			} else {
				if (el.data('initialized')) {
					return;
				}
			}

			var settings = options; // $.extend(settings, options);

			let spinner = $('<div class="cb-player-spinner-wrap"><div class="cb-player-spinner"></div></div>')
			let overlayerButton = $('<button class="cb-player-overlayer-button"></button>')

			if (el.is("video") || el.is("audio")) {
				el.addClass('cb-player-media-source')

				container = el.wrap('<div class="cb-player"></div>');
				container.wrap('<div class="cb-player-media"></div>');

				wrap = el.closest('.cb-player');

			} else {
				wrap = el;

				if (!wrap.hasClass('cb-player')) {
					wrap.addClass('cb-player')
				}

				el = wrap.find("video, audio");

				if (el.length && !el.closest('.cb-player-media').length) {
					el.wrap('<div class="cb-player-media"></div>');
				}

				if (el.length && !el.hasClass('cb-player-media-source')) {
					el.addClass('cb-player-media-source')
				}

				if (wrap.find('.cb-player-media-source').length) {
					el = wrap.find('.cb-player-media-source')
				} else if (!el.length) {
					el = $('<div>').appendTo(wrap);
					el.addClass('cb-player-media');
				}
			}

			if (!el.find("source").data("src") && !el.find("source").attr('src') && !el.attr('src') && !el.data('src') && !wrap.data('src')) {
				console.warn('Source is empty');
				return;
			}

			if (wrap.data('poster')) {
				addPoster(wrap, wrap.data('poster'))
			}

			const control = $('<div class="cb-player-controls"></div>')
			const tpl_play = $('<button class="cb-player-play cb-player-toggle-play"><span class="cb-player-button-play"></span><span class="cb-player-button-pause"></span></button>')
			const tpl_time = $('<div class="cb-player-time"></div>')
			const tpl_time_current = $('<span class="cb-player-time-current">00:00</span>')
			const tpl_time_seperator = $('<span class="cb-player-time-seperator">/</span>')
			const tpl_time_duration = $('<span class="cb-player-time-duration">00:00</span>')
			const tpl_progress = $('<div class="cb-player-progress"><div class="cb-player-progress-slider"></div><div class="cb-player-progress-play"></div><div class="cb-player-progress-load"></div></div>')
			const tpl_tooltip = $('<div class="cb-player-progress-tooltip"></div>')
			const tpl_volume_wrapper = $('<div class="cb-player-volume-wrap"></div>')
			const tpl_volume_button = $('<button class="cb-player-sound"><span class="cb-player-sound-on"></span><span class="cb-player-sound-off"></span></button>')
			const tpl_volume_slider = $('<div class="cb-player-volume"><span class="cb-player-volume-container"><div class="cb-player-volume-slider"></div><div class="cb-player-volume-bar"></div></span></div>')
			const tpl_fullscreen = $('<button class="cb-player-fullscreen cb-player-toggle-fullscreen"><span class="cb-player-button-fullscreen-on"></span><span class="cb-player-button-fullscreen-off"></span></button>')
			const tpl_subtitle = $('<div class="cb-player-subtitle"><button class="cb-player-subtitle-button"></button></div>')

			if (settings.controlTooltip) {
				tpl_tooltip.prependTo(tpl_progress);
			}

			if (settings.controlMute) {
				tpl_volume_button.appendTo(tpl_volume_wrapper)
			}

			if (settings.controlVolume) {
				tpl_volume_wrapper.addClass('cb-player-volume-wrap--' + settings.volumeOrientation)
				tpl_volume_slider.appendTo(tpl_volume_wrapper);
			}

			if (settings.controlLoadButton) {
				tpl_play.append($('<span class="cb-player-button-load"></span>'));
			}

			var context = $('<ul class="cb-player-context"><li class="cb-player-context-item">CBplayer ' + playerVersion + '</li></ul>');

			let source = getSource(el)
			let provider = getProvider(source.mediaSrc)

			//check video/audio element exist
			if ((provider == 'stream' || provider == 'video/mp4' || provider == 'audio/mp3' || provider == 'audio/wav' || provider == 'audio/mp4') && (!wrap.find('video').length && !wrap.find('audio').length)) {
				el.remove();

				let sourceType,
					targetType;

				if (provider == 'stream') {
					targetType = 'video';
					sourceType = 'application/x-mpegURL';
				} else if (provider == 'video/mp4') {
					targetType = 'video';
					sourceType = 'video/mp4'
				} else if (provider == 'audio/mp3') {
					targetType = 'audio';
					sourceType = 'audio/mp3';
				} else if (provider == 'audio/wav') {
					targetType = 'audio';
					sourceType = 'audio/wav';
				} else if (provider == 'audio/mp4') {
					targetType = 'audio';
					sourceType = 'audio/mp4';
				}

				let media = wrap.find('.cb-player-media')
				if (!media.length) {
					wrap.append('<div class="cb-player-media"></div>')
					media = wrap.find('.cb-player-media')
				}

				el = $('<' + targetType + ' playsinline class="cb-player-media-source"><source data-src="' + source.mediaSrc + '" type="' + sourceType + '"/></' + targetType + '>');
				el.appendTo(media);
			}

			if (el.is("video")) {
				wrap.addClass('cb-player--video');
				wrap.append(context);
			}

			if (el.is("audio")) {
				wrap.addClass('cb-player--audio');
				options.controlHide = false;
			}

			if (settings.contextInfo) {

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

			if (settings.tpl && $.isArray(settings.tpl)) {

				$.each(settings.tpl, function (i, e) {
					const element = e
					const value = element.value

					if (element.name == 'play') {
						control.append(tpl_play);
					} else if (element.name == 'time') {

						if (value && value.length == 2) {
							tpl_time.append(tpl_time_current)
							tpl_time.append(tpl_time_seperator)
							tpl_time.append(tpl_time_duration)
							control.append(tpl_time)
						} else if (value) {

							if (value[0] == 'current') {
								const tpl_time_clone = tpl_time.clone()

								tpl_time_clone.append(tpl_time_current)
								control.append(tpl_time_clone)

							} else if (value[0] == 'duration') {
								const tpl_time_clone = tpl_time.clone()

								tpl_time_clone.append(tpl_time_duration)
								control.append(tpl_time_clone)
							}
						}
					} else if (element.name == 'progress') {
						control.append(tpl_progress);
					} else if (element.name == 'volume') {
						control.append(tpl_volume_wrapper);
					} else if (element.name == 'subtitle' && wrap.find('track').length) {
						control.append(tpl_subtitle);
					} else if (element.name == 'fullscreen') {
						control.append(tpl_fullscreen);
					}
				})

				wrap.append(context);

				if (settings.controlBar) {
					wrap.prepend(control);
				}

			} else if (settings.tpl == 'default' && !settings.backgroundMode && !wrap.find('.cb-player-controls').length) {

				control.append(tpl_play);
				wrap.append(context);

				if (settings.controlTime) {
					tpl_time.append(tpl_time_current)
					tpl_time.append(tpl_time_seperator)
					tpl_time.append(tpl_time_duration)
					control.append(tpl_time);
				}

				if (settings.controlProgress) {
					control.append(tpl_progress);
				}

				if (settings.controlMute || settings.controlVolume) {
					control.append(tpl_volume_wrapper);
				}

				if (!el.is("audio") && settings.controlFullscreen) {
					control.append(tpl_fullscreen);
				}

				if (settings.controlBar) {
					wrap.prepend(control);
				}
			} else if (settings.backgroundMode && wrap.find('.cb-player-controls').length) {
				//remove existin controls on backgroundmode
				wrap.find('.cb-player-controls').remove()
			}

			if (settings.overlayButton && !wrap.find('.cb-player-overlayer-button').length) {
				overlayerButton.prependTo(wrap);
			}

			if (settings.overlaySpinner && !wrap.find('.cb-player-spinner-wrap').length) {
				spinner.prependTo(wrap);
			}

			// Check if traks exist and are located in the video tag
			let tracksOutside = wrap.find('track')
			if(tracksOutside.length){
				tracksOutside.each((i, e) => {
					if(!el[0].contains(e)){
						el.append(e)
					}
				})
			}

			let tracks = el.find('track')
			if (tracks.length) {
				let subtitlesContainer = wrap.find('.cb-player-subtitle')
				let subtitleList = wrap.find('.cb-player-subtitle-tracks')

				if (!subtitlesContainer.length) {
					tpl_subtitle.appendTo(wrap.find('.cb-player-controls'))
					subtitlesContainer = wrap.find('.cb-player-subtitle')
				}

				if (!subtitleList.length) {
					subtitleList = $('<div class="cb-player-subtitle-tracks"></div>');
					subtitlesContainer.append(subtitleList);
				}

				var trackSelected;
				let tracksLoaded = new Promise(resolve => {
					tracks.each(function (i, s) {
						var track = $(s);
						var item = createTrackItem('subtitles-' + track.attr('srclang'), track.attr('srclang'), track.attr('label'))

						subtitleList.append(item);

						fetch($(track[0]).attr('src'))
							.then(resp => resp.text())
							.then(data => {
								// console.log(data)
								if (track[0].default) {
									item.addClass('cb-player-subtitle--selected')
								}

								if (tracks.length == i + 1) {
									resolve()
								}
							});

					});
				});

				tracksLoaded.then(() => {
					subtitleList.prepend(createTrackItem('subtitles-off', '', 'OFF'));
					if (!subtitleList.find('.cb-player-subtitle--selected').length) {
						subtitleList.find('.cb-player-subtitle-track').eq(0).addClass('cb-player-subtitle--selected');
					}

					if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
						wrap.addClass('cb-player--with-native-subtitles');
					} else {
						wrap.addClass('cb-player--with-subtitles');
					}
				});
			}

			let volume = settings.volume;
			if (settings.muted || settings.backgroundMode || el.is('[muted]')) {
				el.prop('muted', true);
				volume = 0;
			}

			let autoplay = settings.autoplay;
			if (el.is('[autoplay]')) {
				el.removeAttr('autoplay');
				autoplay = true;
			}

			let loop = settings.loop;
			if (settings.backgroundMode || el.is('[loop]')) {
				el.removeAttr('loop');
				loop = true;
			}

			if (wrap.data('duration') && wrap.find('.cb-player-time-duration').length) {
				wrap.find('.cb-player-time-duration').text(formatTime(wrap.data('duration'), wrap));
			}

			if (wrap.find('.cb-player-button-load').length) {
				wrap.find('.cb-player-play').addClass('cb-player-with-load');
			}

			let videoTitle = el.data('title')

			// Set play attributes
			let overlayerButtonAttr = wrap.find('.cb-player-overlayer-button')
			if (overlayerButtonAttr.length) {
				overlayerButtonAttr
					.attr('aria-label', settings.labels.play)
					.attr('aria-pressed', false)

				if (videoTitle) {
					overlayerButtonAttr.attr('aria-valuetext', videoTitle)
				}
			}

			// Set play attributes
			let playButton = wrap.find('.cb-player-play')
			if (playButton.length) {
				playButton
					.attr('aria-label', settings.labels.play)
					.attr('aria-pressed', false)

				if (videoTitle) {
					playButton.attr('aria-valuetext', videoTitle)
				}
			}

			// Set porgress slider attributes
			let progressSlider = wrap.find('.cb-player-progress-slider')
			if (progressSlider.length) {
				progressSlider.attr('tabindex', -1)
				progressSlider.attr('role', 'slider')
				progressSlider.attr('aria-valuenow', 0)
				progressSlider.attr('aria-label', settings.labels.slider)
				progressSlider.attr('aria-valuetext', '')
			}

			// Set sound attributes
			let muteButton = wrap.find('.cb-player-sound')
			if (muteButton.length) {
				if (volume == 0) {
					muteButton
						.attr('aria-label', settings.labels.unmute)
						.attr('aria-pressed', false)
				} else {
					muteButton
						.attr('aria-label', settings.labels.mute)
						.attr('aria-pressed', true)
				}
			}

			// Set volume attributes
			let volumeSlider = wrap.find('.cb-player-volume-slider')
			if (volumeSlider.length) {
				volumeSlider.attr('tabindex', 0)
				volumeSlider.attr('role', 'slider')
				volumeSlider.attr('aria-valuenow', volume)
				volumeSlider.attr('aria-valuetext', settings.labels.volume + ' ' + volume + '%')
			}

			// Set subtitle attributes
			let subtitleButton = wrap.find('.cb-player-subtitle-button')
			if (subtitleButton.length) {
				subtitleButton.attr('aria-label', settings.labels.subtitles)
				subtitleButton.attr('aria-expanded', false)
			}

			// Set fullscreen attributes
			let fullscreenButton = wrap.find('.cb-player-fullscreen')
			if (fullscreenButton.length) {
				fullscreenButton
					.attr('aria-label', settings.labels.fullscreenOn)
					.attr('aria-pressed', true)
			}

			if (settings.backgroundMode) {
				wrap.addClass('cb-player--backgroundmode')
			}

			const isIPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
			const isIos = /iPad|iPhone|iPod/gi.test(navigator.userAgent) && navigator.maxTouchPoints > 1;

			wrap.data({
				'initialized': true,
				'backtracking': settings.backtracking,
				'contextInfo': settings.contextInfo,
				'backgroundMode': settings.backgroundMode,
				'autoplay': autoplay,
				'volume': volume,
				'loop': loop,
				'hlsStopLoad': settings.hlsStopLoad,
				'settings': settings,
				'source': source,
				'isConsent': null,
				'isIPadOs': isIPadOs,
				'isIos': isIos,
			});

			var media = {
				ready: function (el) {

					var setLevel;
					el.on('play', function (e) {
						let container = $(this).closest('.cb-player')
						let progress = container.find('.cb-player-progress')

						container
							.addClass('cb-player--media-playing')
							.removeClass('cb-player--media-ended')

						startWatchControlHide(container)

						//is current position behind media duration, set new position
						if (getbacktrackingPosition(container) >= container.data('duration') && container.data('backtracking') && container.data('is-livestream')) {
							position = 0.01

							progress.attr('aria-valuenow', position)
							playPosition(el, position)
						}

						if ($.isFunction(settings.mediaIsPlay)) {
							settings.mediaIsPlay.call(this, wrap)
						}
					});

					el.on('playing', function (e) {
						var container = $(this).closest('.cb-player')

						container
							.addClass('cb-player--media-playing')
							.removeClass('cb-player--media-ended')

						hidePoster(container)
					});

					el.on('timeupdate', function () {
						let container = $(this).closest('.cb-player')
						let media = container.find('video, audio')

						if ($.isFunction(settings.mediaTimeupdate)) {
							settings.mediaTimeupdate.call(this, wrap, media[0].currentTime)
						}

						watchTimer(container)
						watchSubtitles(container)
					});

					el.on('pause', function (e) {

						let container = $(this).closest('.cb-player')

						clearTimeout(watchControlHide)

						//set new current position for livestreaming after media stoped
						container.data('pause', true)

						if ($.isFunction(settings.mediaIsPause)) {
							settings.mediaIsPause.call(this, wrap)
						}

						if (container.hasClass('cb-player--media-seeking')) {
							return
						}

						container.removeClass('cb-player--media-playing')

						controlsToggle(container, false)

						if (typeof hls !== 'undefined' && container.data('hlsStopLoad')) {
							hls.stopLoad()
						}
					});

					el.on('seeking', function (e) {
						// var container = $(this).closest(".cb-player")
						// clearTimeout(watchControlHide)
						// controlsToggle(container, false)
					});

					el.on('seeked', function (e) {
						// var container = $(this).closest('.cb-player')
						// startWatchControlHide(container)
					});

					el.on('waiting', function () {
						var container = $(this).closest(".cb-player");

						//check current time with duration - fix for firefox
						if ($(this)[0].currentTime < container.data('duration')) {
							container.addClass("cb-player--media-loaded");
						}
					});

					el.on('durationchange', function (e) {
						var container = $(this).closest(".cb-player"),
							progress = container.find(".cb-player-progress"),
							slider = progress.find(".cb-player-progress-slider");

						if (container.data('pause') && container.data('is-livestream') && container.data('backtracking')) {

							if (slider.length) {
								//media backtracking duration - current duration - current playtime / backtracking duration * 100
								var position = (container.data('duration') - getbacktrackingPosition(container)) / container.data('duration') * 100,
									position = position.toFixed(4);

								progress.attr('aria-valuenow', position);

								container.data('pause', false);
							}
						}
					});

					el.on('canplay', function () {
						var container = $(this).closest(".cb-player");
						container.removeClass("cb-player--media-loaded");

						if (typeof hls !== 'undefined' && container.data('hlsStopLoad') && container.data('initSource') == true) {
							hls.stopLoad();
							container.data('initSource', false);
						}
					});

					el.on('ended', function () {
						var container = $(this).closest(".cb-player");

						container.removeClass("cb-player--media-playing").addClass("cb-player--media-ended");
						controlsToggle(container, false);
						container.find('.cb-player-subtitle-layer').remove();

						if ($.isFunction(settings.mediaIsEnd)) {
							settings.mediaIsEnd.call(this, wrap);
						}

						if (wrap.data('loop')) {
							toggleMediaPlayPause(wrap);
						}
					});
				}
			}

			// Set dafault consent
			if ($.isFunction(settings.getConsent)) {
				const consent = settings.getConsent.apply(this, arguments)
				wrap.data('isConsent', consent ? true : false)

				if (consent === false) {

					let message = wrap.data('no-consent-message')
					if (!message) {
						message = settings.consentMessage
					}

					displayError(wrap, message, 'error-consent')
				}
			}

			if (provider == 'youtube' || provider == 'vimeo') {
				wrap.data('iframe', provider);
				wrap.addClass('cb-player--video cb-player--' + provider);

				initIframes(wrap, _this)
			} else {
				media.ready(el)
			}

			wrap.mouseenter(function () {
				let container = $(this)

				if (container.hasClass("cb-player--media-playing") && settings.controlHide) {
					clearTimeout(watchControlHide)
					controlsToggle(container, false)
				}
			});

			wrap.mouseleave(function () {
				let container = $(this)

				if (container.hasClass("cb-player--media-playing") && settings.controlHide) {
					controlsToggle(container, true);
				}
			});

			wrap.mousemove(function (e) {
				var container = $(this);
				let target = $(e.target)

				clearTimeout(watchControlHide)
				controlsToggle(container, false)

				if (target.closest('.cb-player-controls').length || target.hasClass('cb-player-controls')) {
					return
				}

				startWatchControlHide(container)
			});

			if ($.isFunction(settings.mediaIsInit)) {
				settings.mediaIsInit.call(this, wrap);
			}

			setTimeout(function () {
				if ((!wrap.data('iframe') && wrap.data('autoplay') && $('.cb-player--media-playing').length == 0) || (wrap.data('autoplay') && wrap.data('backgroundMode'))) {
					initPlayer(wrap);
				}
			});
		},
		attachEvents: function (el, options) {
			let touchtimer = false
			let container = $(el).closest('.cb-player')

			var targetsTouch = ['.cb-player-toggle-play', '.cb-player-overlayer-button'];
			if (options.disableClick == false) {
				targetsTouch.push('.cb-player-media');
			}

			container.on('touchstart', targetsTouch.join(','), function (e) {
				if (container.data('backgroundMode')) {
					return;
				}

				if (container.hasClass('cb-player--control-hide')) {
					//show controls on touchstart
					controlsToggle(container, false);

				} else {
					touchtimer = true

					setTimeout(function () {
						touchtimer = false;
					}, 300);
				}
			});

			container.on('touchmove', targetsTouch.join(','), function (e) {
				touchtimer = false
			})

			var targetsClick = ['.cb-player-toggle-play', '.cb-player-overlayer-button'];
			if (options.disableClick == false) {
				targetsClick.push('.cb-player-media');
			}

			container.on('click keydown touchend', targetsClick.join(','), function (e) {
				if (e.type == 'keydown') {
					if (e.keyCode != 13) {
						return
					}
				}

				if (container.hasClass('cb-player--media-loaded') || container.data('backgroundMode')) {
					return;
				}

				if (e.type == 'keydown' && !container.data('iframe')) {
					setTimeout(function () {
						container.find('.cb-player-play').focus()
					}, 50)
				}

				if (e.type == 'touchend') {
					if (touchtimer) {
						initPlayer(container);

						touchtimer = false;
					} else if (container.hasClass('cb-player--media-playing')) {
						startWatchControlHide(container)
					}
				} else {
					initPlayer(container);
				}

				// Returning false from an event handler will automatically call event.stopPropagation() and event.preventDefault(). 
				return false
			});

			container.on('touchstart mouseenter', '.cb-player-progress-slider', function (e) {
				if (!container.hasClass('cb-player--media-ready')) {
					return;
				}

				if (container.data('backtracking') && e.type == "mouseenter") {
					container.find('.cb-player-progress-tooltip').stop().fadeIn(250);
				}

				// Returning false from an event handler will automatically call event.stopPropagation() and event.preventDefault(). 
				return false
			});

			container.on('mouseleave', '.cb-player-progress-slider', function (e) {
				if (container.hasClass('cb-player--media-seeking')) {
					return;
				}

				container.find('.cb-player-progress-tooltip').stop().fadeOut(250);
			});

			container.on('mousemove', '.cb-player-progress-slider', function (e) {
				let progress = $(this).closest('.cb-player-progress')
				let position = (e.pageX - progress.offset().left) / progress.width() * 100

				position = position.toFixed(4)

				if (!container.hasClass('cb-player--media-ready')) {
					return;
				}

				if (container.data('backtracking')) {
					tooltip(container, position);
				}
			});

			container.on('click', '.cb-player-progress-slider', function (e) {
				var position = e;

				if (!container.hasClass('cb-player--media-ready')) {
					getPlayerSrc(container, false);

					function checkIsReady(container) {
						if (container.hasClass('cb-player--media-ready')) {
							seeking(position, container);
						} else {
							setTimeout(function () {
								checkIsReady(container);
							}, 100);
						}
					}

					checkIsReady(container);
				}
			});

			container.on('keydown', '.cb-player-progress-slider', function (e) {
				let keycode = e.keyCode

				if (keycode != 37 && keycode != 39) {
					return
				}

				if (container.hasClass('cb-player--media-ready')) {
					if (keycode == 37) {
						// Arrow left
						seekToSecond(container, -5)
					} else if (keycode == 39) {
						// Arrow right
						seekToSecond(container, +5)
					}
				}

				if (container.hasClass('cb-player--media-playing')) {
					startWatchControlHide(container)
				}
			})

			container.on('touchstart mousedown', '.cb-player-progress-slider', function (e) {
				if (e.type == "mousedown") {
					if (e.which != 1) {
						return false;
					}
				}

				const container = $(this).closest('.cb-player')
				const player = container.find('.cb-player-media-source')

				container.addClass("cb-player--media-seeking");

				seeking(e, container);

				$(document).bind('mousemove.cbplayer-seeking touchmove.cbplayer-seeking', function (e) {
					var e = e;

					if (container.data('is-livestream')) {

						//fire seeking after mouseup

					} else {

						if (container.data('iframe')) {
							if (container.hasClass('cb-player--media-playing')) {
								//container.data('instance').pauseVideo();
							}

						} else if (container.hasClass('cb-player--media-playing') && !player[0].paused && !container.hasClass('cb-player--media-loaded')) {
							container.data('stopTemporary', true);
							player[0].pause();
						}

						seeking(e, container);
					}
				});

				e.stopPropagation();
				//e.preventDefault();

				return false
			});

			container.on('touchstart click', '.cb-player-sound', function () {
				var player = container.find('.cb-player-media-source'),
					volumevalue;

				if (container.data('iframe')) {

					if (container.data('iframe') == 'youtube') {
						if (container.data('instance').isMuted()) {
							volumevalue = 100;
						} else {
							volumevalue = 0;
						}
					} else if (container.data('iframe') == 'vimeo') {
						var embedPlayer = container.data('embed');

						embedPlayer.getVolume().then(function (volume) {

							if (volume == 0) {
								volumevalue = 100;
							} else {
								volumevalue = 0;
							}

							setVolume(container, volumevalue);
						});
					}

				} else {
					if (player.prop('muted')) {
						volumevalue = 100;
					} else {
						volumevalue = 0;
					}
				}

				if (container.data('iframe') != 'vimeo') {
					setVolume(container, volumevalue);
				}

				return false
			})

			container.on('touchstart mousedown', '.cb-player-volume-slider', function (e) {
				if (e.type == "mousedown") {
					if (e.which != 1) {
						return false;
					}
				}

				let container = $(this).closest('.cb-player')

				setVolume(container, e)

				container.addClass('cb-player--change-volume')

				$(document).bind('mousemove.cb-player--move-volume-slider touchmove.cb-player--move-volume-slider', function (e) {
					setVolume(container, e)
				});

				e.preventDefault()
				e.stopPropagation()
				return false
			})

			container.on('keydown', '.cb-player-volume-slider', function (e) {
				let keycode = e.keyCode

				if (keycode != 40 && keycode != 39 && keycode != 38 && keycode != 37) {
					return
				}

				e.preventDefault()

				if (keycode == 38 || keycode == 39) {
					// Arrow up or right
					changeVolume(container, +5)
				} else if (keycode == 40 || keycode == 37) {
					// Arrow down or left
					changeVolume(container, -5)
				}
			})

			container.on('mouseenter', '.cb-player-controls', function () {
				if (container.hasClass('cb-player--media-playing')) {
					clearTimeout(watchControlHide);
					controlsToggle(container, false);
				}
			});

			container.on('contextmenu', function (e) {
				var container = $(e.target).closest('.cb-player');

				if (container.length) {
					var context = container.find('.cb-player-context');

					if (context.hasClass('cb-player-context-active')) {
						context.removeClass('cb-player-context-active');
						return false;
					}

					context.addClass('cb-player-context-active');

					var cursorX = e.pageX - container.offset().left,
						cursorY = e.pageY - container.offset().top,
						contextXEnd = cursorX + context.width(),
						contextYEnd = cursorY + context.height();

					if (container.width() > contextXEnd) {
						context.css('left', cursorX);
					} else {
						context.css('left', cursorX - context.width());
					}

					if (container.height() > contextYEnd) {
						context.css('top', cursorY);
					} else {
						context.css('top', cursorY - context.height());
					}
					return false;
				}
			});

			container.on('click', '.cb-player-context-item.link', function () {
				const item = $(this);

				container.find('.cb-player-' + item.data('link')).css('display', 'block');
			});

			container.on('click', '.cb-player-overlayer-close', function () {
				$(this).closest('.cb-player-overlayer').css('display', 'none');
			});

			container.on('click keydown', '.cb-player-subtitle-track', function (e) {
				if (e.type == 'keydown') {
					if (e.keyCode != 13) {
						return
					}
				}

				let item = $(this)
				let video = container.find('.cb-player-media-source')[0]

				item.closest('.cb-player-subtitle-tracks').find('.cb-player-subtitle-track').removeClass('cb-player-subtitle--selected');
				item.addClass('cb-player-subtitle--selected');

				if (!item.data('lang')) {
					container.find('.cb-player-subtitle-layer').remove();
				}

				for (var i = 0; i < video.textTracks.length; i++) {

					var track = video.textTracks[i];

					if (track.language == item.data('lang')) {
						track.mode = 'showing';
					} else {
						track.mode = 'hidden';
					}
				}

				container.removeClass('cb-player--show-subtitles');
			});

			container.on('touchstart click', '.cb-player-subtitle-button', function (e) {
				if (container.hasClass('cb-player--show-subtitles')) {
					container.removeClass('cb-player--show-subtitles')
					container.find('.cb-player-subtitle-button').attr('aria-expanded', false)
				} else {
					container.addClass('cb-player--show-subtitles')
					container.find('.cb-player-subtitle-button').attr('aria-expanded', true)
				}

				return false
			});

			container.on('mouseleave', function () {
				container.removeClass('cb-player--show-subtitles')
				container.find('.cb-player-subtitle-button').attr('aria-expanded', false)
			})

			let targetsFocus = [
				'.cb-player-play',
				'.cb-player-progress-slider',
				'.cb-player-sound',
				'.cb-player-volume-slider',
				'.cb-player-subtitle-button',
				'.cb-player-subtitle-track',
				'.cb-player-fullscreen'
			]

			container.on('keydown', targetsFocus.join(','), function (e) {
				// Only for hide controls after tab

				let target = $(e.target)
				let keycode = e.keyCode

				// Tab or Enter
				if (keycode != 9) {
					return
				}

				if (container.hasClass('cb-player--media-playing')) {
					startWatchControlHide(container)
				}
			})

			container.on('focus', targetsFocus.join(','), function (e) {
				let target = $(e.target)

				if (target.hasClass('cb-player-sound')) {
					container.addClass('cb-player--focus-mute')
				} else if (target.hasClass('cb-player-volume-slider')) {
					container.addClass('cb-player--focus-volume')
				}

				if (!target.closest('.cb-player-subtitle').length) {
					container.removeClass('cb-player--show-subtitles')
					container.find('.cb-player-subtitle-button').attr('aria-expanded', false)
				}
			})

			container.on('blur', targetsFocus.join(','), function (e) {
				let target = $(e.target)

				if (target.hasClass('cb-player-sound')) {
					container.removeClass('cb-player--focus-mute')
				} else if (target.hasClass('cb-player-volume-slider')) {
					container.removeClass('cb-player--focus-volume')
				}
			})

			if (!$(document).data('cbplayer-initialized')) {

				// Fix iPad fullscreen button
				// Use document not specific element
				$(document).on('touchend click', '.cb-player-fullscreen', function (e) {
					const container = $(this).closest('.cb-player')
					const player = container.find('.cb-player-media-source')

					toggleFullscreen(container, player);

					return false
				})

				$(document).on('keyup', function (e) {
					const fullscreenElement = $('.cb-player--fullscreen-fallback')

					// Close fallback fullscreen with ESC
					if (e.keyCode == 27 && fullscreenElement.length) {
						toggleFullscreen(fullscreenElement, false)
					}
				})

				$(document).on('touchend mouseup', function (e) {
					var container = $('.cb-player--change-volume');

					if ((e.type == 'touchend' || e.type == "mouseup") && container.hasClass('cb-player--change-volume')) {
						if (e.which != 1 && e.type == "mouseup") {
							return false;
						}

						$(this).unbind('mousemove.cb-player--move-volume-slider')
						$(this).unbind('touchmove.cb-player--move-volume-slider')

						container.removeClass('cb-player--change-volume')

						// e.stopPropagation();
						// e.preventDefault();

						return false
					}
				});

				$(document).on('touchend mouseup', function (e) {
					const container = $('.cb-player--media-seeking')
					const player = container.find('.cb-player-media-source')

					if ((e.type == 'touchend' || e.type == "mouseup") && container.hasClass("cb-player--media-seeking")) {
						if (e.which != 1 && e.type == "mouseup") {
							return false;
						}

						$(this).unbind("mousemove.cbplayer-seeking");
						$(this).unbind("touchmove.cbplayer-seeking");

						container.removeClass("cb-player--media-seeking");

						if (!$(e.target).hasClass('cb-player-progress-slider')) {
							container.find('.cb-player-progress-tooltip').fadeOut(250);
						}

						if (container.data('stopTemporary') && player[0].paused && !container.hasClass('cb-player--media-loaded')) {
							container.data('stopTemporary', false);
							player[0].play();
						}

						if (e.type == 'touchend') {
							seeking(e, container);
						}

						// e.stopPropagation();

						return false
					}
				});

				$(document).on('click', function () {
					if ($('.cb-player-context-active').length) {
						$('.cb-player-context-active').removeClass('cb-player-context-active');
					}
				});

				$(window).on('resize', function () {
					$('.cb-player.cb-player--media-ready').each(function () {
						let player = $(this)

						setTimeout(function () {
							fitIframe(player);
						})

					});
				});

				$(document).data('cbplayer-initialized', true);
			}
		}
	}

	$.fn.cbplayer = function (options) {
		if (options == "mediaSetVolume") {
			let volume = Array.prototype.slice.call(arguments, 1);

			$(this).each(function () {
				const container = $(this).closest('.cb-player');

				if (volume.length) {
					volume = volume.toString();

					if (volume >= 0 && volume <= 100) {
						setVolume(container, volume);
					} else {
						console.warn('Wrong value in mediaSetVolume');
					}
				}
			});
			return;
		}

		if (options == "mediaSetTime") {
			let time = Array.prototype.slice.call(arguments, 1);

			$(this).each(function () {
				const container = $(this).closest('.cb-player');

				if (time.length && container.hasClass('cb-player--media-ready')) {
					time = time.toString();

					if (time.match(/(:)/)) {

						time = time.split(':');

						if (time.length == 3) {

							let h = time[0] * 60 * 60
							let m = time[1] * 60
							let s = time[2]

							time = parseFloat(h) + parseFloat(m) + parseFloat(s);

						} else if (time.length == 2) {

							let m = time[0] * 60
							let s = time[1]

							time = parseFloat(m) + parseFloat(s);

						} else {
							time = time[0];
						}
					}

					if (time <= container.data('duration')) {
						setCurrentTime(container, time);
					} else {
						console.warn('Wrong value in mediaSetTime: Video duration ' + container.data('duration') + ', your set time ' + time);
					}
				}
			});
			return;
		}

		if (options == "mediaPauseAll") {
			stopPlayingAll();
			return;
		}

		return this.each(function () {
			var container = $(this);

			if (($(this).is("video") || $(this).is("audio")) && $(this).closest('.cb-player').length) {
				container = container.closest('.cb-player');
			}

			if (options == 'consentChanged') {

				if (container.data('initialized') && container.data('iframe')) {
					changeConsent(container)

					if (!container.hasClass('cb-player--media-ready')) {
						initIframes(container, container.data('plugin_cbplayer'))
					} else if (container.hasClass('cb-player--media-ready')) {
						destroyIframe(container)
					}

				}
				return
			}

			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new CBplayer(this, options));
			}
			else if ($.isFunction(Plugin.prototype[options])) {
				$.data(this, 'plugin_' + pluginName)[options]();
			}

			if (options == 'initSource') {
				if (container.data('is-livestream')) {
					return;
				}

				container.data('initSource', true);

				getPlayerSrc(container, false);

				return;
			}

			if (options == 'mediaPause') {
				if (container.data('loop')) {
					container.data({
						'loop': false,
						'loopDefault': true
					});
				}

				const media = container.find('.cb-player-media-source')[0];

				videoStop(container, media, true);
				return;
			}

			if (options == 'mediaPlay') {
				if (container.data('loopDefault') && container.data('loopDefault') != container.data('loop')) {
					container.data('loop', container.data('loopDefault'));
				}

				if (!container.hasClass('cb-player--media-ready')) {
					initPlayer(container);
				} else {
					const media = container.find('.cb-player-media-source')[0];
					videoStart(container, media);
				}
				return;
			}

			if (options == "mediaRestart") {
				const media = container.find('.cb-player-media-source')[0];

				media.currentTime = 0;
				if (!container.hasClass('cb-player--media-ready')) {
					initPlayer(container);
				} else {
					videoStart(container, media);
				}
			}
		});
	}
})(jQuery, window, document);