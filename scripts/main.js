//Video Player
//Christin Bombelka
//Ver. 1.0 - 28-8-2017

$(function() {
	$(".js-player-audio").cbplayer({
	 	contextInfo: true,
	 	volumeOrientation: 'horizontal'
	});

	$(".js-player-1").cbplayer({
	 	backtracking: false,
	 	contextInfo: true,
	});

	$(".js-player-self").cbplayer({
		tpl: [
			{name: 'play'},
			{name: 'time', value: ['current']},
			{name: 'progress'},
			{name: 'time', value: ['duration']},
			{name: 'mute'},
			{name: 'subtitle'},
			{name: 'fullscreen'}
		],
		controlVolume: true,
		controlLoadButton: true,
	 	volume: 50,
	 	contextInfo: false,
	 	volumeOrientation: 'vertical'
	});

	$(".js-player-iframe").cbplayer({
		volume: 100,
		backgroundMode: false,
		loop: false,
		autoplay: false,
	});

	$(".js-player-iframe-background").cbplayer({
		muted: true,
		backgroundMode: true,
		loop: true,
		autoplay: true
	});
});
