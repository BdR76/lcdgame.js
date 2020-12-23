// LCD game JavaScript library
// Bas de Reuver (c)2018

import { hideInfobox } from './Menu';
import { LCDGAME_VERSION } from './System';

export const SCORE_HTML =
		'<div class="infobox" id="scorebox">' +
		'  <div id="scoreheader">' +
		'  </div>' +
		'  <div id="scorecontent" class="scorecontent">' +
		'    One moment...' +
		'  </div>' +
		'  <a class="mybutton btnnext" id="btnprev" data-direction="-1">&lt;&lt;</a>' +
		'  <a class="mybutton btnnext" id="btnnext" data-direction="+1">&gt;&gt;</a>' +
		'  <a class="mybutton btnpop" onclick="LCDGame.hideScorebox();">Ok</a>' +
		'</div>';

var HS_URL = "http://bdrgames.nl/lcdgames/testphp/";

export function displayScorebox() {
	hideInfobox();
	document.getElementById("scorebox").style.display = "inherit";
	//event.stopPropagation(); // stop propagation on button click event
}

export function hideScorebox() {
	//var target = event.target || event.srcElement;
	// filter event handling when the event bubbles
	//if (event.currentTarget == target) {
	document.getElementById("scorebox").style.display = "none";
	//}
}

// -------------------------------------
// highscores object
// -------------------------------------
var RANKS_PER_PAGE = 10;

const HighScores = function (lcdgame, gametitle, gametypes) {
	// save reference to game objects
	this.lcdgame = lcdgame;

	// display variables
	this.gametitle = gametitle;
	this.gametypes = gametypes;
	this.offset = 0;

	// highscore variables
	this._scores_local = [];
	this._scores_global = [];
	this._scoretype = 0;
};

HighScores.prototype = {

	init: function (tp) {
		// hook event to prev next buttons
		var btnprev = document.getElementById("btnprev");
		var btnnext = document.getElementById("btnnext");
		btnprev.addEventListener("click", this.onPrevNextButton.bind(this));
		btnnext.addEventListener("click", this.onPrevNextButton.bind(this));

		// init first highscores
		this.buildHeaderHTML();
		this.loadLocal(tp); // tp = game A or game B
		this.loadGlobal();
	},

	getGametype: function () {
		var res = "";
		if (this.gametypes) {
			res = this.gametypes[this._scoretype-1];
		}
		return res;
	},

	loadLocal: function (typ) {

		// clear variables
		this._scores_local = [];
		this._scoretype = typ; // typ = game type, for example 1 or 2)
		var namecache = "lcdgame_local_"+this.gametitle+"_hs"+typ;

		// load from localstorage
		var sc = window.localStorage.getItem(namecache);

		// error checking, localstorage might not exist yet at first time start up
		try {
			this._scores_local = JSON.parse(sc);
		} catch (e) {
			this._scores_local = []; //error in the above string(in this case,yes)!
		}
		// error checking just to be sure, if localstorage contains something else then a JSON array (hackers?)
		if (Object.prototype.toString.call(this._scores_local) !== "[object Array]") {
			this._scores_local = [];
		}
	},

	indexLocal: function (sc, typ) {
		// refresh local highscores if needed
		if (typ != this._scoretype) {
			this.loadLocal(typ);
		}

		// assume at end
		var idx = -1;

		// check from bottom to top of list
		for (var i = this._scores_local.length-1; i >= 0; i--) {
			// where to insert new highscore
			if (sc > this._scores_local[i].score) {
				idx = i;
			} else {
				break;
			}
		}

		return idx;
	},

	saveLocal: function (plr, sc, lvl, typ) {
		// always store local highscore
		var rec = {"player":plr, "score":sc, "level":lvl};

		// which place in local highscores
		var idx = this.indexLocal(sc, typ);
		if (idx < 0) {
			// at end
			this._scores_local.push(rec);
		} else {
			// some where in the middle
			this._scores_local.splice(idx, 0, rec);
		}

		// save highscores locally
		var namecache = "lcdgame_local_"+this.gametitle+"_hs"+typ;
		window.localStorage.setItem(namecache, JSON.stringify(this._scores_local));

		// also save default entry name
		window.localStorage.setItem("lcdgame_highscore_name", plr);
	},

	saveGlobal: function (plr, sc, lvl, typ, sec, but) {
		const { platform } = window;
		let info;
		// additional client info
		if (platform) {
			// use platform.js for more accurate info
			info =
					(platform.product ? "&device="  + platform.product : "") +
					(platform.os      ? "&os="      + platform.os      : "") +
					(platform.name    ? "&browser=" + platform.name    : "");
		} else {
			var guess = this.guessOsBrowser();
			info =
					"&device=" + guess.device +
					"&os=" + guess.os +
					"&browser=" + guess.browser;
		}
		var language = navigator.language;
		var clientguid  = this.getClientGUID();

		// set gametype for higscores
		this._scoretype = typ;

		// reserved characters in url
		//var gametitle = gametitle.replace(/\&/g, "%26"); // & -> %26
		plr = plr.replace(/&/g, "%26"); // & -> %26

		// build url
		var url = HS_URL + "newhs.php";
		var paramsdata =
				"gamename=" + this.gametitle +  // highscore data
				"&gametype=" + typ +
				"&player=" + plr +
				"&score=" + sc +
				"&level=" + lvl +
				"&playtime=" + sec +
				"&buttonpress=" + but +
				info + // client info
				"&language=" + language +
				"&lcdversion=" + LCDGAME_VERSION +
				"&clientguid=" + clientguid;

		var request = new XMLHttpRequest();
		request.open('POST', url, true);
		request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		//request.setRequestHeader("Content-length", paramsdata.length);
		//request.setRequestHeader("Connection", "close");

		// handle success or error
		request.onreadystatechange = function(receiveddata) {
			if (request.status >= 200 && request.status < 400) {
				if (request.readyState == 4 && request.status == 200) {
					// Success!
					// here you could go to the leaderboard or restart your game
					console.log('SUCCESS!!\nrequest.status='+ request.status + '\nrequest.response=' + request.response);
					var getjson = JSON.parse(request.response);
					if (getjson.result == 'OK') {
						console.log('Highscore sent succesfully');
						// result contains rank, set offset to corresponding page
						// for example getjson.rank=23 -> offset=20
						var rank = (getjson.rank ? (!isNaN(getjson.rank) ? getjson.rank : 1) : 1);
						this.offset = RANKS_PER_PAGE * Math.floor((rank-1) / RANKS_PER_PAGE);
						// load highscores
						this.loadGlobal();
						displayScorebox();
					} else {
						console.log('Highscore sent failed');
					}
				}
			} else {
				// We reached our target server, but it returned an error
				console.log('Highscore sent failed with error ' + request.status + ': ' + request.statusText);
			}
		}.bind(this); // <- only change

		//paramsdata = getUserAgentParams();
		request.send(paramsdata);
	},

	getHighscore: function (typ) {
		var sc = 0;
		if (this.lcdgame.highscores._scores_global[0]) {
			sc = this.lcdgame.highscores._scores_global[0].score;
		}
		return sc;
	},

	checkScore: function () {
		// end of game  time
		var timeend = new Date();
		// save current score values, because will reset on background when new game starts
		var sc = this.lcdgame.score;
		var lvl = this.lcdgame.level;
		var typ = this.lcdgame.gametype;
		var sec = Math.floor((timeend - this.lcdgame.playtimestart) / 1000); // round to seconds
		var but = this.lcdgame.buttonpress;

		if (sc > 0) {
			// input name
			var lastname = (window.localStorage.getItem("lcdgame_highscore_name") || "");
			var plr = prompt("New highscore, enter your name and press enter to submit or press cancel.", lastname);

			// not null (cancel) or empty string
			if (plr != null) {
				plr = plr.trim();
				if (plr != "") {
					this.saveLocal(plr, sc, lvl, typ);
					this.saveGlobal(plr, sc, lvl, typ, sec, but);
				}
			}
		}
	},

	loadGlobal: function () {
		var url = HS_URL + "geths.php" +
			"?gamename=" + this.gametitle +  // highscore data
			"&gametype=" + this._scoretype +
			"&offset=" + this.offset; // 0=first page, 10=second page etc

		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open("GET", url, true); // true for asynchronous
		xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
				this.afterLoadGlobal(xmlHttp.responseText);
		}.bind(this); // <- only change
		xmlHttp.send(null);
	},

	afterLoadGlobal: function (data) {
		// error checking, localstorage might not exist yet at first time start up
		try {
			this._scores_global = JSON.parse(data);
		} catch (e) {
			this._scores_global = []; //error in the above string(in this case,yes)!
		}
		// error checking just to be sure, if data contains something else then a JSON array (hackers?)
		if (Object.prototype.toString.call(this._scores_global) !== "[object Array]") {
			this._scores_global = [];
		}

		// flag if also local scores
		for (var g=0; g < this._scores_global.length; g++) {
			// add property "local"
			this._scores_global[g].local = false;
			// check if corresponding score in local scores
			for (var l=0; l < this._scores_local.length; l++) {
				// same name and same score, probably the same -> display as red font
				if (   (this._scores_global[g].player == this._scores_local[l].player)
					&& (this._scores_global[g].score == this._scores_local[l].score) ) {
					this._scores_global[g].local = true;
				}
			}
		}

		this.refreshHTML();
	},

	onFilterButton: function (dv) {

		if (dv.currentTarget.dataset) {
			var typ = parseInt(dv.currentTarget.dataset.gametype);

			if (this.gametype != typ) {
				this.offset = 0;
				this.loadLocal(typ);
				this.loadGlobal();
			}
		}
	},

	onPrevNextButton: function (dv) {
		if (dv.currentTarget.dataset) {
			// calculate new offset value
			var dir = parseInt(dv.currentTarget.dataset.direction);
			var ofs = this.offset + (dir > 0 ? RANKS_PER_PAGE : -1 * RANKS_PER_PAGE);

			// prev on first page
			if (ofs < 0) ofs = 0;

			// next button, but already on last page
			if ( (dir > 0) && (this._scores_global.length < RANKS_PER_PAGE) ) ofs = this.offset;

			// only refresh when offset changed
			if (this.offset != ofs) {
				this.offset = ofs;
				this.loadGlobal();
			}
		}
	},

	buildHeaderHTML: function () {

		// game name and column headers
		var str = '<h1 id="scoretitle">' + this.gametitle + '</h1>';

		for (let i = 0; i < this.gametypes.length; i++) {
			str = str + '<a class="mybutton mybutton-small" data-gametype="' + (i + 1) + '" id="filtertype' + i + '">' + this.gametypes[i] + '</a>';
		}

		// refresh score filter buttons
		document.getElementById("scoreheader").innerHTML = str;

		// attach click events to all buttons
		for (let i = 0; i < this.gametypes.length; i++) {
			var btn = document.getElementById("filtertype"+i);
			btn.addEventListener("click", this.onFilterButton.bind(this));
		}
	},

	refreshHTML: function () {
		// build highscore rows
		var rows = "";
		for (var i = 0; i < RANKS_PER_PAGE; i++) {
			var rec = this._scores_global[i];

			// get record
			if (typeof rec === "undefined") {
				var rk = this.offset + (i+1);
				rec = {"rank":rk, "player":".....", "score":0, "level":1, "local":false};
			}

			// mark local scores in red
			var highlight = (rec.local ? " style=\"color:#f00\"" : "");

			// build html
			rows = rows + "      <tr"+highlight+"><td>" + rec.rank + ".</td><td>" + rec.player + "</td><td>" + rec.score + "</td></tr>";
		}

		// game name and column headers
		var str =
			"<table>" +
			"      <tr><td>Rk.</td><td>Name</td><td>Score</td></tr>" +
			rows +
			"    </table>";

		// refresh html content
		this.lcdgame.scorecontent.innerHTML = str;

		// refresh header html
		str = this.gametitle + ' (' + this.getGametype() + ')';
		document.getElementById("scoretitle").innerHTML = str;
	},


	//uuidv4: function () {
	//	var patchcrypto = window.crypto || window.msCrypto; // IE11 -> msCrypto
	//	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c) {
	//		return (c ^ patchcrypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	//		}
	//	)
	//},

	uuidv4: function () {
		// simpler uuid generator, better browser compatibility (found at https://gist.github.com/jcxplorer/)
		var uuid = "";
		var random;
		for (var i = 0; i < 32; i++) {
			random = Math.random() * 16 | 0;

			if (i == 8 || i == 12 || i == 16 || i == 20) {
				uuid += "-";
			}
			uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
		}
		return uuid;
	},

	getClientGUID: function () {
		var guid = window.localStorage.getItem("lcdgame_client_guid");
		if (!guid) {
			// create one
			guid = this.uuidv4();
			window.localStorage.setItem("lcdgame_client_guid", guid);
		}
		return guid;
	},

	guessOsBrowser: function () {
		// Also send OS and browser with highscores, for library optimizing
		// Educated guess; far from accurate
		// Determining the device/os/browser goes way beyond the scope of this LCDgame library
		// For more accurately determining os/browser use library platform.js or similar library

		// initialise
		var device = "";
		var os = "";
		var browser = "";

		// note: navigator.userAgent is a mess
		var ua = navigator.userAgent || navigator.vendor || window.opera;

		// -------------------------------------
		//       device guesses
		// -------------------------------------
		// BlackBerry
		if (/BlackBerry|BB10|PlayBook|Passport/i.test(ua)) {
			device = "BlackBerry";
		} else
		// samsung mobiles
		if (/GT-I9\d{3}|SM-G9\d{2}/.test(ua)) {device = "Galaxy S-series";}
		else if (/SM-A\d{3}/.test(ua)) {device = "Galaxy A-series";}
		else if (/SM-J\d{3}/.test(ua)) {device = "Galaxy J-series";}
		else if (/SM-T\d{3}/.test(ua)) {device = "Galaxy Tab";}
		else if (/SM-N\d{3}/.test(ua)) {device = "Galaxy Note";}
		else if (/SAMSUNG/.test(ua)) {device = "Samsung";}
		// huawei
		else if (/huawei/i.test(ua)) {device = "Huawei";}
		// kindle
		else if (/kindle/.test(ua)) {device = "Kindle";}
		// Xbox One
		else if (/xbox one/i.test(ua)) {device = "Xbox One";}
		// Xbox 360
		else if (/xbox/i.test(ua)) {device = "Xbox 360";}
		// Playstation Vita, Playstation 3, Playstation 4
		else if (/playstation /i.test(ua)) {
			device = (/playstation [^;) ]*/i.exec(ua) || "Playstation");
		}
		// Wii U
		else if (/nintendo wii/i.test(ua)) {device = "Wii U";}
		// windows phone
		else if (/IEMobile|Windows Phone/i.test(ua)) {
			device = "Windows Phone";
		} else
		// iOS detection from: http://stackoverflow.com/a/9039885/177710
		if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
			if (/iPad/.test(ua))      { device = "iPad";}
			else if (/iPod/.test(ua)) { device = "iPod";}
			else                      ( device = "iPhone" );
		} else
		// Mac OS desktop
		if (/mac os|macintosh/i.test(ua)) {
			device = "Macintosh";
		}

		// -------------------------------------
		//       OS guesses
		// -------------------------------------
		// Windows Phone must come first because its UA also contains "Android"
		if (/tizen /i.test(ua)) {
			os = (/tizen [^;)]*/i.exec(ua)[0] || "Tizen");
		} else
		// Windows Phone must come first because its UA also contains "Android"
		if (/windows phone/i.test(ua)) {
			os = "Windows Phone";
		} else
		if (/android /i.test(ua)) {
			os = (/android [^;)]*/i.exec(ua)[0] || "Android");
		} else
		// iOS detection from: http://stackoverflow.com/a/9039885/177710
		if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
			const osvar = /(iphone os |cpu os )[^;) ]*/i.exec(ua);
			os = (osvar[0] || "");
			os = os.replace(/cpu|iphone|os/ig, "").trim();
			os = "iOS " + os.replace(/_/g, ".");
		} else
		if (/mac os/i.test(ua)) {
			os = "Mac OS";
		} else
		if ( (/windows /i.test(ua)) ) {
			const osvar = /windows [^;)]*/i.exec(ua)[0];
			os = (osvar || "Windows");

			if (/10/.test(osvar))      os = "Windows 10";
			if (/6.3/.test(osvar))     os = "Windows 8.1";
			if (/6.2/.test(osvar))     os = "Windows 8";
			if (/6.1/.test(osvar))     os = "Windows 7";
			if (/6.0/.test(osvar))     os = "Windows Vista";
			if (/5.1|5.2/.test(osvar)) os = "Windows XP";
			if (/5.0/.test(osvar))     os = "Windows 2000";
		} else
		// any other
		{os = navigator.platform;}

		// -------------------------------------
		//       Browser guesses
		// -------------------------------------
		// Opera 8.0+
		if ((!!window.opr && !!window.opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
			browser = "Opera 8.0+";
		} else
		// Firefox 1.0+
		if (typeof InstallTrigger !== 'undefined') {
			browser = "Firefox 1.0+";
		} else
		// Edge 20+
		if (/edge/i.test(ua)) {
			browser = "Edge";
		} else
		// Chrome 1+
		if ( (/chrome/i.test(ua)) && (/google/i.test(navigator.vendor)) ) {
			browser = "Chrome";
		} else
		// Safari 3.0+ "[object HTMLElementConstructor]"
		if ( (/safari/i.test(ua)) && (/apple computer/i.test(navigator.vendor)) ) {
			browser = "Safari";
		} else
		// Internet Explorer mobile
		if (/iemobile/i.test(ua)) {
			browser = (/iemobile[^;) ]*/i.exec(ua)[0] || "IEMobile");
		} else
		// Internet Explorer
		if (/MSIE /.test(ua)) {
			browser = (/MSIE [^;) ]*/.exec(ua)[0] || "MSIE");
		} else
		// Internet Explorer 11
		if (/rv:11\./.test(ua)) {
			browser = "MSIE 11";
		} else
		// Internet Explorer 6-11
		if ( /*@cc_on!@*/false || !!document.documentMode) {
			browser = "MSIE 6-11";
		}

		// replace problematic characters
		device  =  device.replace(/&|\?|\//g, " ").trim();
		os      =      os.replace(/&|\?|\//g, " ").trim();
		browser = browser.replace(/&|\?|\//g, " ").trim();

		// return result
		return {"device": device, "os": os, "browser": browser};
	}
};

//LCDGame.HighScores.prototype.constructor = LCDGame.HighScores;
export default HighScores;