// LCD game JavaScript library
// Bas de Reuver (c)2018

var SCORE_HTML = 
		'<div class="infobox" id="scorebox">' +
		'  <div id="scorecontent">' +
		'    high-scores'
		'  </div>' +
		'  <a class="mybutton btnpop" onclick="hideScorebox();">Ok</a>' +
		'</div>';

function displayScorebox() {
	hideInfobox();
	document.getElementById("scorebox").style.display = "inherit";
	//event.stopPropagation(); // stop propagation on button click event
}

function hideScorebox() {
	//var target = event.target || event.srcElement;
	// filter event handling when the event bubbles
	//if (event.currentTarget == target) {
		document.getElementById("scorebox").style.display = "none";
	//}
}

// -------------------------------------
// highscores object
// -------------------------------------
LCDGame.HighScores = function (lcdgame, gametitle, gametypes) {
	// save reference to game objects
	this.lcdgame = lcdgame;

	// display variables
	this.gametitle = gametitle;
	this.gametypes = gametypes;

	// highscore variables
	this._scorecache = [];
	this._scoretype = 0;
	this._namecache = "";
};

LCDGame.HighScores.prototype = {

    getGametype: function () {
		var res = "";
		if (this.gametypes) {
			this.lcdgame.gametype-1
			res = this.gametypes[this.lcdgame.gametype-1];
		};
		return res;
	},

	loadHighscores: function (typ) {

		// clear variables
		this._scorecache = [];
		this._scoretype = typ;
		this._namecache = "lcdgame_"+this.gametitle+"_hs"+typ;

		// load from localstorage
		var sc = window.localStorage.getItem(this._namecache);

		// error checking, localstorage might not exist yet at first time start up
		try {
			this._scorecache = JSON.parse(sc);
		} catch (e) {
			this._scorecache = []; //error in the above string(in this case,yes)!
		};
		// error checking just to be sure, if localstorage contains something else then a JSON array (hackers?)
		if (Object.prototype.toString.call(this._scorecache) !== "[object Array]") {
			this._scorecache = [];
		};
		
		// initialise hi-score array
		for (var i=0; i < 10; i++) {
			var rec = this._scorecache[i];
			
			if (typeof rec === "undefined") {
				this._scorecache[i] = {"name":".....", "score":0, "level":1};
			};
		};
	},

    save: function () {
		window.localStorage.setItem(this._namecache, JSON.stringify(this._scorecache));
    },
	
    scoreIndex: function (sc, typ) {
		// refresh cache if needed
		if (typ != this._scoretype) {
			this.loadHighscores(typ);
		};

		var idx = -1;
		// check if new highscore
		for (var i = this._scorecache.length-1; i >= 0; i--) {
			if (sc > this._scorecache[i].score) {
				idx = i;
			} else {
				break;
			};
		};
		return idx;
	},

    submitScore: function (plr, sc, lvl, typ) {
		var idx = this.scoreIndex(sc, typ);
		if (idx >= 0) {
			// insert new record
			var rec = {"name":plr, "score":this.lcdgame.score, "level":this.lcdgame.level};
			this._scorecache.splice(idx, 0, rec);
			
			// remove last records, keep max 10
			var s = 10 - this._scorecache.length;
			if (s < 0) {
				this._scorecache.splice(s);
			};

			this.save();
		};
    },

    checkScore: function () {
		// save current score values, because will reset on background when new game starts
		var sc = this.lcdgame.score;
		var lvl = this.lcdgame.lvl;
		var typ = this.lcdgame.gametype;

		// check if out of rank
		var idx = this.scoreIndex(sc, typ);

		// new highscore
		if (idx >= 0) {
			// input name
			var plr = prompt("New highscore, enter your name and press enter to submit or prses cancel.", "");

			if (plr != null) {
				this.submitScore(plr, sc, lvl, typ);
			};
			// show on screen
			this.refreshHTML();
			displayScorebox();
		};
    },

	refreshHTML: function () {
		// build highscore rows
		var rows = "";
		for (var i = 0; i < 10; i++) {
			var rec = this._scorecache[i];
			rows = rows + "      <tr><td>" + (i+1) + ".</td><td>" + rec.name + "</td><td>" + rec.score + "</td></tr>";
		};

		// game name and column headers
		var mod = this.getGametype();
		mod = (mod == "" ? mod : " (" + mod + ")");
		var str =
			"<h1>" + this.gametitle + mod + "</h1>" +
			"<table>" +
			"      <tr><td>Rk.</td><td>Name</td><td>Score</td></tr>" +
			rows +
			"    </table>";
			
		// refresh html content
		this.lcdgame.scorecontent.innerHTML = str;
    },
};

//LCDGame.HighScores.prototype.constructor = LCDGame.HighScores;
