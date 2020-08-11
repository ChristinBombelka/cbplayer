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
		backgroundMode: false,
		loop: false,
		autoplay: false,
		mediaTimeupdate: function(el, time){
			console.log(el, time);
		}
	});

	$(".js-player-4").cbplayer({
		volume: 50,
		backgroundMode: false,
		loop: false,
	});
});
