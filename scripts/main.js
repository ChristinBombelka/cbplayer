//Video Player
//Christin Bombelka
//Ver. 1.0 - 28-8-2017

$(function() {
	$(".js-player-audio").cbplayer({
	 	backtracking: false,
	 	contextInfo: true,
	});

	$(".js-player-1").cbplayer({
	 	backtracking: false,
	 	contextInfo: true,
	});

 //    $(".js-player-vimeo").cbplayer({
 //      	contextInfo: true,
 //      	controlTimeBackwards: true,
 //    });

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
	});

	$(".js-player-iframe").cbplayer({
		volume: 50,
		backgroundMode: false,
		loop: false,
		autoplay: false,
	});

	// $(".js-player-4").cbplayer({
	// 	volume: 50,
	// 	backgroundMode: false,
	// 	loop: false,
	// });
});
