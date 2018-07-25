//Video Player
//Christin Bombelka
//Ver. 1.0 - 28-8-2017

$(function() {

	$(".js-player2").cbplayer({
		backtracking: false,
		contextInfo: true,
		autoplay: false,
	});

	$(".js-player").cbplayer({
		volume: 50,
		contextInfo: true,
	});

	$(".js-player-3").cbplayer({
		volume: 50,
		contextInfo: true,
	});

	$(".js-player-vb").cbplayer({
		hlsStopLoad: true,
	});

	$('.trigger-init').cbplayer('initSource');
});
