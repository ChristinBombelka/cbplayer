//Video Player
//Christin Bombelka
//Ver. 1.0 - 28-8-2017

$(function() {
	$(".js-player").cbplayer({
		volume: 50,
		contextInfo: true,
	});

	$(".js-player-2").cbplayer({
		backtracking: false,
		contextInfo: true,
		autoplay: false,
	});

	$(".js-player-3").cbplayer({
		volume: 50,
		backgroundMode: true,
		loop: true,
		autoplay: true,
	});

	$(".js-player-4").cbplayer({
		volume: 50,
		backgroundMode: true,
		loop: true,
	});
});
