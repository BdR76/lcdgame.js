/* LCD game JavaScript library -- by BdR 2018 */

// LCD game JavaScript library
// Bas de Reuver (c)2018

var LCDGAME_VERSION = "0.3.2";

// namespace
var LCDGame = LCDGame || {
	loadsounds: null,
	countimages: 0,	
	// scale factor
	scaleFactor: 1.0,
	/**
	* Keep score on global variable for highscore
	*
    * @property {score} integer - The game current score
    * @default
    */
	score: 0,
    /**
	* Which game type or difficulty, for high score purposes to be added later.
	* Has to implemented as seen fit for each individual game.
	* For the game Mariobros it can be 1='Game A', 2='Game B'
	* For the game Searanger it can be 1='Pro 1', 2='Pro 2'. etc.
	*
    * @property {gametype} integer - The game type or difficulty setting of the game
    * @default
    */
	gametype: 0,
    /**
	* Which current 'level' in the game, for high score purposes to be added later.
	* Has to implemented as seen fit for each individual game.
	* For the game Highway it can be the amount of GAS bonus games played.
	* For the game Mariobros it can be how many trucks completed. etc.
	*
    * @property {level} integer - The current level in game
    * @default
    */
	level: 0,
	// events
	onImageLoaded: null,
	onImageError: null,
	canvas: null,
	context2d: null,
	debugtxt: null
};

// LCD game JavaScript library
// Bas de Reuver (c)2018

LCDGame.State = function () {

    this.lcdgame = null;
    this.key = ""; // state name

    this.statemanager = null;
};

LCDGame.State.prototype = {
	// additional methods, can implemented by each state
    init: function () {
    },

    preload: function () {
    },

    loadUpdate: function () {
    },

    loadRender: function () {
    },

    create: function () {
    },

    update: function () {
    }
};

LCDGame.State.prototype.constructor = LCDGame.State;
// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// the state manager
// -------------------------------------
LCDGame.StateManager = function (lcdgame) {
    this.lcdgame = lcdgame;
    this._currentState;
	this.states = {}; // hold all states
};

LCDGame.StateManager.prototype = {

   add: function (key, state) {
		//state.game = this.game;
        this.states[key] = new state(this.lcdgame);

		this._currentState = key;
	
        return state;
    },
	
    start: function (key) {

		this.lcdgame.cleartimers();

		if (this._currentState && (this._currentState != key) ) {
			this.states[this._currentState].destroy;
		};
		this._currentState = key;
		this.states[this._currentState].init();
    },

    currentState: function () {

		if (this._currentState) {
			return this.states[this._currentState];
		};
    }

};
// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// request animation frame
// -------------------------------------
LCDGame.AnimationFrame = function (lcdgame) {
	// save reference to game object 
	this.lcdgame = lcdgame;
	this.raftime = null;
};

LCDGame.AnimationFrame.prototype = {

    start: function () {
		var vendors = [
			'ms',
			'moz',
			'webkit',
			'o'
		];

		for (var x = 0; x < vendors.length && !window.requestAnimationFrame; x++)
		{
			window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'];
		}

		animationlast = 0.0;

		var _this = this;

		// cannot use requestAnimationFrame for whatever reason, fall back on `setTimeout`
		if (!window.requestAnimationFrame)
		{
			useSetTimeout = true;

			animationLoop = function () {
				return _this.updateSetTimeout();
			};

			_timeOutID = window.setTimeout(this.animationLoop, 0);
		}
		else
		{
			// use requestAnimationFrame
			useSetTimeout = false;

			animationLoop = function (time) {
				return _this.updateAnimFrame(time);
			};

			_timeOutID = window.requestAnimationFrame(animationLoop);
		}
	},
	
    updateAnimFrame: function (rafTime) {
		// floor the rafTime to make it equivalent to the Date.now() provided by updateSetTimeout (just below)
		this.raftime = Math.floor(rafTime);
		this.lcdgame.updateloop(this.raftime);

		_timeOutID = window.requestAnimationFrame(animationLoop);
	},
	
    updateSetTimeout: function () {
		this.raftime = Date.now();
		this.lcdgame.updateloop(this.raftime);

		var ms = Math.floor(1000.0 / 60.0);
		_timeOutID = window.setTimeout(animationLoop, ms);
	}
}
// LCD game JavaScript library
// Bas de Reuver (c)2018

var MENU_HTML = 
		'<div class="container">' +
		'  <canvas id="mycanvas" class="gamecvs"></canvas>' +
		'  <a class="mybutton btnmenu" onclick="displayInfobox();">help</a>' +
		'  <a class="mybutton btnmenu" onclick="displayScorebox();">highscores</a>' +
		'  <div class="infobox" id="infobox">' +
		'    <div id="infocontent">' +
		'      instructions' +
		'    </div>' +
		'    <a class="mybutton btnpop" onclick="hideInfobox();">Ok</a>' +
		'  </div>' +
		'</div>';


function displayInfobox() {
	hideScorebox();
	document.getElementById("infobox").style.display = "inherit";
	//event.stopPropagation(); // stop propagation on button click event
}

function hideInfobox() {
	//var target = event.target || event.srcElement;
	// filter event handling when the event bubbles
	//if (event.currentTarget == target) {
		document.getElementById("infobox").style.display = "none";
	//}
}

// -------------------------------------
// menu overlay object
// -------------------------------------
LCDGame.Menu = function (lcdgame, name) {
	// save reference to game object 
	this.lcdgame = lcdgame;
};

// LCD game JavaScript library
// Bas de Reuver (c)2018

var SCORE_HTML = 
		'<div class="infobox" id="scorebox">' +
		'  <div id="scoreheader">' +
		'  </div>' +
		'  <div id="scorecontent">' +
		'    One moment...' +
		'  </div>' +
		'  <a class="mybutton btnpop" onclick="hideScorebox();">Ok</a>' +
		'</div>';
		
var HS_URL = "http://bdrgames.nl/lcdgames/testphp/";

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
	this.gametype = 1;

	// highscore variables
	this._scorecache = [];
	this._scoretype = 0;
	this._namecache = "";
};

LCDGame.HighScores.prototype = {

    getGametype: function () {
		var res = "";
		if (this.gametypes) {
			res = this.gametypes[this.gametype-1];
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

    saveLocal: function (plr, sc, lvl, typ) {
		var idx = this.scoreIndex(sc, typ);
		if (idx >= 0) {
			// insert new record
			var rec = {"player":plr, "score":sc, "level":lvl};
			this._scorecache.splice(idx, 0, rec);
			
			// remove last records, keep max 10
			var s = 10 - this._scorecache.length;
			if (s < 0) {
				this._scorecache.splice(s);
			};

			this.save();
		};
    },

    saveOnline: function (plr, sc, lvl, typ) {
		
			// additional client info
			if (platform) {
				// use platform.js for more accurate info
				var info =
					(platform.product ? "&device="  + platform.product : "") +
					(platform.os      ? "&os="      + platform.os      : "") +
					(platform.name    ? "&browser=" + platform.name    : "");
			} else {
				var guess = this.guessOsBrowser();
				var info =
					"&device=" + guess.device +
					"&os=" + guess.os +
					"&browser=" + guess.browser;
			};
			var language = navigator.language;
			var clientguid  = this.getClientGUID();

			// set gametype for higscores
			this.gametype = typ;
			
			// reserved characters in url
			//var gametitle = gametitle.replace(/\&/g, "%26"); // & -> %26
			var plr = plr.replace(/\&/g, "%26"); // & -> %26

			// build url
			var url = HS_URL + "newhs.php";
			var paramsdata = 
				"gamename=" + this.gametitle +  // highscore data
				"&gametype=" + typ +
				"&player=" + plr + 
				"&score=" + sc +
				"&level=" + lvl +
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
						var test = JSON.parse(request.response);
						if (test.result == 'OK') {
							console.log('Highscore sent succesfully');
							this.refreshGlobalHS();
							displayScorebox();
						} else {
							console.log('Highscore sent failed');
						};
					};
				} else {
					// We reached our target server, but it returned an error
					console.log('Highscore sent failed with error: ' + request.response);
					resulttxt.text += '\nerror!';
				}
			}.bind(this); // <- only change

			//debugger;
			//paramsdata = getUserAgentParams();
			request.send(paramsdata);
    },

    getHighscore: function (typ) {
		var sc = 0;
		if (this.lcdgame.highscores._scorecache[0]) {
			sc = this.lcdgame.highscores._scorecache[0].score;
		};
		return sc;
	},

    checkScore: function () {
		// save current score values, because will reset on background when new game starts
		var sc = this.lcdgame.score;
		var lvl = this.lcdgame.level;
		var typ = this.lcdgame.gametype;
		
		if (sc > 0) {
			// input name
			var plr = prompt("New highscore, enter your name and press enter to submit or press cancel.", "");

			// not null (cancel) or empty string
			if (plr != null) {
				plr = plr.trim();
				if (plr != "") {
					this.saveLocal(plr, sc, lvl, typ);
					this.saveOnline(plr, sc, lvl, typ);
				};
			};
		};
    },
	
	refreshGlobalHS: function () {
		var url = HS_URL + "geths.php" +
			"?gamename=" + this.gametitle +  // highscore data
			"&gametype=" + this.gametype;

		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open("GET", url, true); // true for asynchronous 
		xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		xmlHttp.onreadystatechange = function() { 
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
				this.afterRefreshGlobalHS(xmlHttp.responseText);
		}.bind(this); // <- only change
		xmlHttp.send(null);
	},
	
	afterRefreshGlobalHS: function (data) {
		// error checking, localstorage might not exist yet at first time start up
		try {
			this._scorecache = JSON.parse(data);
		} catch (e) {
			this._scorecache = []; //error in the above string(in this case,yes)!
		};
		// error checking just to be sure, if data contains something else then a JSON array (hackers?)
		if (Object.prototype.toString.call(this._scorecache) !== "[object Array]") {
			this._scorecache = [];
		};

		this.refreshHTML();
	},

	onFilterButton: function (dv) {
		var label = dv.currentTarget.innerHTML;

		if (dv.currentTarget.dataset) {
			var typ = parseInt(dv.currentTarget.dataset.gametype);

			if (this.gametype != typ) {
				this.gametype = typ;
				this.refreshGlobalHS();
			};
		};
	},
		
	buildHeaderHTML: function () {

		// game name and column headers
		var str = '<h1 id="scoretitle">' + this.gametitle + '</h1>';
		
		for (var i = this.gametypes.length-1; i >= 0; i--) {
			str = str + '<a class="filter" data-gametype="' + (i + 1) + '" id="filtertype' + i + '">' + this.gametypes[i] + '</a>';
		};

		// refresh score filter buttons
		document.getElementById("scoreheader").innerHTML = str;
		
		// attach click events to all buttons
		for (var i = 0; i < this.gametypes.length; i++) {
			var btn = document.getElementById("filtertype"+i);
			btn.addEventListener("click", this.onFilterButton.bind(this));
		};
	},

	refreshHTML: function () {
		// build highscore rows
		var rows = "";
		for (var i = 0; i < 10; i++) {
			var rec = this._scorecache[i];
			
			if (typeof rec === "undefined") {
				rec = {"player":".....", "score":0, "level":1};
			};
			
			rows = rows + "      <tr><td>" + (i+1) + ".</td><td>" + rec.player + "</td><td>" + rec.score + "</td></tr>";
		};

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
				uuid += "-"
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
			device = "BlackBerry"
		} else
		// samsung mobiles
			if (/GT-I9\d{3}|SM-G9\d{2}/.test(ua)) {device = "Galaxy S-series"}
		else if (/SM-A\d{3}/.test(ua)) {device = "Galaxy A-series"}
		else if (/SM-J\d{3}/.test(ua)) {device = "Galaxy J-series"}
		else if (/SM-T\d{3}/.test(ua)) {device = "Galaxy Tab"}
		else if (/SM-N\d{3}/.test(ua)) {device = "Galaxy Note"}
		else if (/SAMSUNG/.test(ua)) {device = "Samsung"}
		// huawei
		else if (/huawei/i.test(ua)) {device = "Huawei"}
		// kindle
		else if (/kindle/.test(ua)) {device = "Kindle"}
		// Xbox One
		else if (/xbox one/i.test(ua)) {device = "Xbox One"}
		// Xbox 360
		else if (/xbox/i.test(ua)) {device = "Xbox 360"}
		// Playstation Vita, Playstation 3, Playstation 4
		else if (/playstation /i.test(ua)) {
			device = (/playstation [^;) ]*/i.exec(ua) || "Playstation")
		}
		// Wii U
		else if (/nintendo wii/i.test(ua)) {device = "Wii U"}
		// windows phone
		else if (/IEMobile|Windows Phone/i.test(ua)) {
			device = "Windows Phone"
		} else
		// iOS detection from: http://stackoverflow.com/a/9039885/177710
		if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
			if (/iPad/.test(ua))      { device = "iPad"}
			else if (/iPod/.test(ua)) { device = "iPod"}
			else                      ( device = "iPhone" );
		} else
		// Mac OS desktop
		if (/mac os|macintosh/i.test(ua)) {
			device = "Macintosh"
		};

		// -------------------------------------
		//       OS guesses
		// -------------------------------------
		// Windows Phone must come first because its UA also contains "Android"
		if (/tizen /i.test(ua)) {
			os = (/tizen [^;)]*/i.exec(ua)[0] || "Tizen")
		} else
		// Windows Phone must come first because its UA also contains "Android"
		if (/windows phone/i.test(ua)) {
			os = "Windows Phone"
		} else
		if (/android /i.test(ua)) {
			os = (/android [^;)]*/i.exec(ua)[0] || "Android")
		} else
		// iOS detection from: http://stackoverflow.com/a/9039885/177710
		if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
			var osvar = /(iphone os |cpu os )[^;) ]*/i.exec(ua);
			os = (osvar[0] || "");
			os = os.replace(/cpu|iphone|os/ig, "").trim();
			os = "iOS " + os.replace(/_/g, ".");
		} else
		if (/mac os/i.test(ua)) {
			os = "Mac OS"
		} else
		if ( (/windows /i.test(ua)) ) {
			var osvar = /windows [^;)]*/i.exec(ua)[0];
			os = (osvar || "Windows");

			if (/10/.test(osvar))      os = "Windows 10"
			if (/6.3/.test(osvar))     os = "Windows 8.1"
			if (/6.2/.test(osvar))     os = "Windows 8"
			if (/6.1/.test(osvar))     os = "Windows 7"
			if (/6.0/.test(osvar))     os = "Windows Vista"
			if (/5.1|5.2/.test(osvar)) os = "Windows XP"
			if (/5.0/.test(osvar))     os = "Windows 2000"
		} else
		// any other
			{os = navigator.platform};

		// -------------------------------------
		//       Browser guesses
		// -------------------------------------
		// Opera 8.0+
		if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
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
			browser = (/iemobile[^;) ]*/i.exec(ua)[0] || "IEMobile")
		} else
		// Internet Explorer
		if (/MSIE /.test(ua)) {
			browser = (/MSIE [^;) ]*/.exec(ua)[0] || "MSIE")
		} else
		// Internet Explorer 11
		if (/rv\:11\./.test(ua)) {
			browser = "MSIE 11";				
		} else
		// Internet Explorer 6-11
		if ( /*@cc_on!@*/false || !!document.documentMode) {
			browser = "MSIE 6-11";
		};
		
		// replace problematic characters
		device  =  device.replace(/&|\?|\//g, " ").trim();
		os      =      os.replace(/&|\?|\//g, " ").trim();
		browser = browser.replace(/&|\?|\//g, " ").trim();
		
		// return result
		return {"device": device, "os": os, "browser": browser};
	}
};

//LCDGame.HighScores.prototype.constructor = LCDGame.HighScores;
// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// game object
// -------------------------------------
LCDGame.Game = function (configfile, metadatafile) {

	this.gamedata = [];
	this.imageBackground = null;
	this.imageShapes = null;
	this.score = 0;
	this.gametype = 0;
	this.level = 0;
	this.soundmute = false;

	// initialise object
	this.countimages = 0;
	this.scaleFactor = 1.0;

	this.imageBackground = new Image();
	this.imageShapes = new Image();

	// events after loading image
	if (this.imageBackground.addEventListener) {
		// chrome, firefox
		this.imageBackground.addEventListener("load", this.onImageLoaded.bind(this));
		this.imageBackground.addEventListener("error", this.onImageError.bind(this));
		this.imageShapes.addEventListener("load", this.onImageLoaded.bind(this));
		this.imageShapes.addEventListener("error", this.onImageError.bind(this));
	}
	else {
		// IE8
		this.imageBackground.attachEvent("load", this.onImageLoaded.bind(this));
		this.imageBackground.attachEvent("error", this.onImageError.bind(this));
		this.imageShapes.attachEvent("load", this.onImageLoaded.bind(this));
		this.imageShapes.attachEvent("error", this.onImageError.bind(this));
	};

// create canvas element and add to document
	var str =
		MENU_HTML + 
		SCORE_HTML;

	document.write(str);

	this.canvas = document.getElementById("mycanvas");
	this.infobox = document.getElementById("infobox");
	this.scorebox = document.getElementById("scorebox");
	this.infocontent = document.getElementById("infocontent");
	this.scorecontent = document.getElementById("scorecontent");
	
	// get context of canvas element
	this.context2d = this.canvas.getContext("2d");
		
	// state manager
	this.state = new LCDGame.StateManager(this);
	
	// request animation frame
	this.raf = new LCDGame.AnimationFrame(this);

	this.timers = [];

	// add gamedata and populate by loading json
	this.loadConfig(configfile);
	metadatafile = (metadatafile || "metadata/gameinfo.json");
	this.loadMetadata(metadatafile);
	
	// mouse or touch input
	this._touchdevice = false;
	//this._mousedevice = false

	return this;
}

LCDGame.Game.prototype = {
	// -------------------------------------
	// background ans shapes images loaded
	// -------------------------------------
	onImageLoaded: function() {
		// max two images
		this.countimages++;
		// check if both background and shapes images were loaded
		if (this.countimages >= 2) {
			this.initGame();
		};
	},

	onImageError: function() {
		// handle error
		console.log("** ERROR ** lcdgame.js - onImageError.");
	},

	// -------------------------------------
	// load a game configuration file
	// -------------------------------------
	loadConfig: function(path) {
		
		var xhrCallback = function()
		{
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if ((xhr.status === 200) || (xhr.status === 0)) {
					this.onConfigLoad(JSON.parse(xhr.responseText));
				} else {
					this.onConfigError(xhr);
				}
			}
		};
	
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = xhrCallback.bind(this);

		xhr.open("GET", path, true);
		xhr.send();
	},

	// -------------------------------------
	// start game
	// -------------------------------------
	onConfigLoad: function(data) {
		// load all from JSON data
		this.gamedata = data;

		// set images locations will trigger event onImageLoaded
		this.imageBackground.src = data.imgback;
		this.imageShapes.src = data.imgshapes;
	
		// add custom lcdgame.js properties for use throughout the library
		for (var i = 0; i < this.gamedata.frames.length; i++) {

			// add current/previous values to all shape objects
			this.gamedata.frames[i].value = false;
			this.gamedata.frames[i].valprev = false;
			
			// add type
			this.gamedata.frames[i].type = "shape";
		};

		// prepare sequences
		for (var s = 0; s < this.gamedata.sequences.length; s++) {
			// shape indexes
			this.gamedata.sequences[s].ids = [];

			// find all frames indexes
			for (var f = 0; f < this.gamedata.sequences[s].frames.length; f++) {
				var filename = this.gamedata.sequences[s].frames[f];
				var idx = this.shapeIndexByName(filename);
				this.gamedata.sequences[s].ids.push(idx);
			};
		};

		// prepare digits
		for (var d = 0; d < this.gamedata.digits.length; d++) {
			// shape indexes
			this.gamedata.digits[d].ids = [];
			this.gamedata.digits[d].locids = [];

			// find all digit frames indexes
			for (var f = 0; f < this.gamedata.digits[d].frames.length; f++) {
				var filename = this.gamedata.digits[d].frames[f];
				var idx = this.shapeIndexByName(filename);
				this.gamedata.digits[d].ids.push(idx);
				// set shape types
				if (idx != -1) {
					this.gamedata.frames[idx].type = "digit";
				};
			};

			// find all digit locations
			for (var l = 0; l < this.gamedata.digits[d].locations.length; l++) {
				var filename = this.gamedata.digits[d].locations[l];
				var idx = this.shapeIndexByName(filename);
				this.gamedata.digits[d].locids.push(idx);
			};
			// set max
			var str = this.gamedata.digits[d].max || "";
			if (str == "") {
				for (var c = 0; c < this.gamedata.digits[d].locids.length; c++) { str += "8"}; // for example "8888"
				this.gamedata.digits[d].max = str;
			}
		};
		
		// prepare buttons keycodes
		for (var b=0; b < this.gamedata.buttons.length; b++) {
		
			// shape indexes
			this.gamedata.buttons[b].ids = [];
			
			// button area
			var xmin = 1e4;
			var ymin = 1e4;
			var xmax = 0;
			var ymax = 0;

			// find all button frames indexes
			for (var f = 0; f < this.gamedata.buttons[b].frames.length; f++) {
				var filename = this.gamedata.buttons[b].frames[f];
				var idx = this.shapeIndexByName(filename);
				this.gamedata.buttons[b].ids.push(idx);
				// keep track of position and width/height
				var spr = this.gamedata.frames[idx].spriteSourceSize;
				if (spr.x < xmin)         xmin = spr.x;
				if (spr.y < ymin)         ymin = spr.y;
				if (spr.x + spr.w > xmax) xmax = spr.x + spr.w;
				if (spr.y + spr.h > ymax) ymax = spr.y + spr.h;
			};

			// typically buttons are small, so make size of touch area 3x as big
			var wh = (xmax - xmin);
			var hh = (ymax - ymin);
			var xmin = xmin - wh;
			var ymin = ymin - hh;
			var xmax = xmax + wh;
			var ymax = ymax + hh;

			var xcenter = (xmin + xmax) / 2.0;
			var ycenter = (ymin + ymax) / 2.0;

			// button touch area
			this.gamedata.buttons[b].area = {"x1":xmin, "y1":ymin, "x2":xmax, "y2":ymax, "xc":xcenter, "yc":ycenter};

			// default keycodes
			var defkey = this.gamedata.buttons[b].name;
			if (typeof this.gamedata.buttons[b].defaultkeys !== "undefined") {
				defkey = this.gamedata.buttons[b].defaultkeys;
			};
			this.gamedata.buttons[b].keycodes = this.determineKeyCodes(defkey);
		};
		
		// fix overlaps in button touch areas
		for (var b1=0; b1 < this.gamedata.buttons.length-1; b1++) {
			for (var b2=b1+1; b2 < this.gamedata.buttons.length; b2++) {
				// check if overlap
				if (
					   (this.gamedata.buttons[b1].area.x1 < this.gamedata.buttons[b2].area.x2) // horizontal overlap
					&& (this.gamedata.buttons[b1].area.x2 > this.gamedata.buttons[b2].area.x1)
					&& (this.gamedata.buttons[b1].area.y1 < this.gamedata.buttons[b2].area.y2) // vertical overlap
					&& (this.gamedata.buttons[b1].area.y2 > this.gamedata.buttons[b2].area.y1)
				) {
					// get center points of each area
					var xc1 = this.gamedata.buttons[b1].area.xc;
					var yc1 = this.gamedata.buttons[b1].area.yc;
					var xc2 = this.gamedata.buttons[b2].area.xc;
					var yc2 = this.gamedata.buttons[b2].area.yc;
					
					// rectract to left, right, up, down
					if ( Math.abs(xc1 - xc2) > Math.abs(yc1 - yc2) ) {
						if (xc1 > xc2) { // b1 is to the right of b2
							var dif = (this.gamedata.buttons[b1].area.x1 - this.gamedata.buttons[b2].area.x2) / 2;
							this.gamedata.buttons[b1].area.x1 -= dif;
							this.gamedata.buttons[b2].area.x2 += dif;
						} else { // b1 is to the left of b2
							var dif = (this.gamedata.buttons[b1].area.x2 - this.gamedata.buttons[b2].area.x1) / 2;
							this.gamedata.buttons[b1].area.x2 -= dif;
							this.gamedata.buttons[b2].area.x1 += dif;
						}
					} else {
						if (yc1 > yc2) { // b1 is below b2
							var dif = (this.gamedata.buttons[b1].area.y1 - this.gamedata.buttons[b2].area.y2) / 2;
							this.gamedata.buttons[b1].area.y1 -= dif;
							this.gamedata.buttons[b2].area.y2 += dif;
						} else { // b1 is above b2
							var dif = (this.gamedata.buttons[b1].area.y2 - this.gamedata.buttons[b2].area.y1) / 2;
							this.gamedata.buttons[b1].area.y2 -= dif;
							this.gamedata.buttons[b2].area.y1 += dif;
						}
					}
				}
			};
		};
	},

	onConfigError: function(xhr) {
		console.log("** ERROR ** lcdgame.js - onConfigError: error loading json file");
		console.error(xhr);
	},

	// -------------------------------------
	// load a metadata file
	// -------------------------------------
	loadMetadata: function(path) {
		var xhrCallback = function()
		{
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if ((xhr.status === 200) || (xhr.status === 0)) {
					this.onMetadataLoad(JSON.parse(xhr.responseText));
				} else {
					this.onMetadataError(xhr);
				}
			}
		};
	
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = xhrCallback.bind(this);

		xhr.open("GET", path, true);
		xhr.send();
	},

	tinyMarkDown: function(str) {
		// \n => <br/>
		str = str.replace(/\n/gi, "<br/>");

		// *bold* => <b>bold</b>
		str = str.replace(/\*.*?\*/g, function(foo){
			return "<b>"+foo.slice(1, -1)+"</b>";
		});
		
		// _italic_ => <i>italic</i>
		str = str.replace(/\_.*?\_/g, function(foo){
			return "<i>"+foo.slice(1, -1)+"</i>";
		});
		
		// [button] => <btn>button</btn>
		str = str.replace(/\[(?:(?!\[).)*?\](?!\()/g, function(foo){
			return "<btn>"+foo.slice(1, -1)+"</btn>";
		});
		
		// hyperlinks [url text](www.test.com) => <a href="http://www.test.com">url text</a>
		str = str.replace(/(\[(?:(?!\[).)*?\])(\((?:(?!\().)*?\))/g, function(all, fst, sec, pos){
			var url = sec.slice(1, -1);
			if (url.indexOf("http") != 0) url = "http://" + url;
			var txt = fst.slice(1, -1);
			return '<a href="' + url + '">' + txt + '</a>';
		});
		
		return str;
	},

	// -------------------------------------
	// metadata load JSON file
	// -------------------------------------
	onMetadataLoad: function(data) {
		// load all from JSON data
		this.metadata = data;
		
		// infobox content
		var instr = this.tinyMarkDown(data.gameinfo.instructions.en);
		this.infocontent.innerHTML = "<h1>How to play</h1><br/>" + instr;

		// get info from metadata
		var title = data.gameinfo.device.title
		var gametypes = data.gameinfo.gametypes;
		this.gametype = (typeof gametypes === "undefined" ? 0 : 1);

		// highscores
		this.highscores = new LCDGame.HighScores(this, title, gametypes);
		this.highscores.buildHeaderHTML();
		this.highscores.loadHighscores(this.gametype);
		this.highscores.refreshGlobalHS();
	},

	onMetadataError: function(xhr) {
		console.log("** ERROR ** lcdgame.js - onMetadataError: error loading json file");
		console.error(xhr);
	},

	resizeCanvas: function() {

		// determine which is limiting factor for current window/frame size; width or height
		var scrratio = window.innerWidth / window.innerHeight;
		var imgratio = this.canvas.width / this.canvas.height;
		
		// determine screen/frame size
		var w = this.canvas.width;
		var h = this.canvas.height;

		if (imgratio > scrratio) {
			// width of image should take entire width of screen
			w = window.innerWidth;
			this.scaleFactor = w / this.canvas.width;
			h = this.canvas.height * this.scaleFactor;

			// set margins for full height
			var ymargin = (window.innerHeight - h) / 2;
			this.canvas.style["margin-top"] = ymargin+"px";
			this.canvas.style["margin-bottom"] = -ymargin+"px";
			this.canvas.style["margin-left"] = "0px";
		} else {
			// height of image should take entire height of screen
			h = window.innerHeight;
			this.scaleFactor = h / this.canvas.height;
			w = this.canvas.width * this.scaleFactor;

			// set margins for full height
			var xmargin = (window.innerWidth - w) / 2;
			this.canvas.style["margin-left"] = xmargin+"px";
			this.canvas.style["margin-right"] = -xmargin+"px";
			this.canvas.style["margin-top"] = "0px";
		}
		
		// set canvas size
		this.canvas.style.width = w+"px";
		this.canvas.style.height = h+"px";

		// set canvas properties
		this.canvas.style.display = "block";
		this.canvas.style["touch-action"] = "none"; // no text select on touch
		this.canvas.style["user-select"] = "none"; // no text select on touch
		this.canvas.style["-webkit-tap-highlight-color"] = "rgba(0, 0, 0, 0)"; // not sure what this does 
		
		// center infobox
		this.resizeInfobox(this.infobox);
		this.resizeInfobox(this.scorebox);
	},
	
	resizeInfobox: function(box) {

		// set visible, else width height doesn't work
		box.style.display = "inherit";

		// determine screen/frame size
		var w = box.offsetWidth;
		var h = box.offsetHeight;
		var rect = box.getBoundingClientRect();
		if (rect) {
			w = rect.width;
			h = rect.height;
		};

		var xmargin = (window.innerWidth - w) / 2;
		var ymargin = (window.innerHeight - h) / 2;

		// set margins for full height
		box.style["margin-left"] = xmargin+"px";
		box.style["margin-right"] = -xmargin+"px";
		box.style["margin-top"] = ymargin+"px";
		box.style["margin-bottom"] = -ymargin+"px";
		
		// reset visibility
		box.style.display = "none";
	},

	// -------------------------------------
	// start the specific game
	// -------------------------------------
	initGame: function() {
		// no scrollbars
		document.body.scrollTop = 0;
		document.body.style.overflow = 'hidden';
	
		// initialise canvas
		this.canvas.width = this.imageBackground.width;
		this.canvas.height = this.imageBackground.height;

		this.context2d.drawImage(this.imageBackground, 0, 0);
		
		// prepare sounds
		for (var i=0; i < this.gamedata.sounds.length; i++) {
			var strfile = this.gamedata.sounds[i].filename;
			this.gamedata.sounds[i].audio = new Audio(strfile);
			this.gamedata.sounds[i].audio.load();
		};
		
		// mouse or touch input
        //if (window.navigator.msPointerEnabled || window.navigator.pointerEnabled)
        //{
        //    this._mousedevice = true;
        //};
	
        if ('ontouchstart' in document.documentElement || (window.navigator.maxTouchPoints && window.navigator.maxTouchPoints >= 1))
        {
            this._touchdevice = true;
        };

		// bind input
		if (document.addEventListener) { // chrome, firefox
			// mouse/touch
			this.canvas.addEventListener("mousedown", this.onmousedown.bind(this), false);
			this.canvas.addEventListener("mouseup",   this.onmouseup.bind(this), false);
			// keyboard
			document.addEventListener("keydown", this.onkeydown.bind(this), false);
			document.addEventListener("keyup",   this.onkeyup.bind(this), false);
			
			if (this._touchdevice) {
				this.canvas.addEventListener("touchstart", this.ontouchstart.bind(this), false);
				this.canvas.addEventListener("touchend",   this.ontouchend.bind(this), false);
			};

		} else { // IE8
			// mouse/touch
			this.canvas.attachEvent("mousedown", this.onmousedown.bind(this));
			this.canvas.attachEvent("mouseup",   this.onmouseup.bind(this));
			// keyboard
			document.attachEvent("keydown", this.onkeydown.bind(this));
			document.attachEvent("keyup",   this.onkeyup.bind(this));
		};

		// real time resize
		window.addEventListener("resize", this.resizeCanvas.bind(this), false);

		// center position
		this.resizeCanvas();
		
		displayInfobox();

		this.raf.start();

		console.log("lcdgame.js v" +  LCDGAME_VERSION + " :: start");
	},

	// -------------------------------------
	// timers and game loop
	// -------------------------------------
	addtimer: function(context, callback, ms, waitfirst) {

		// after .start() do instantly start callbacks (true), or wait the first time (false), so:
		// true  => .start() [callback] ..wait ms.. [callback] ..wait ms.. etc.
		// false => .start() ..wait ms.. [callback] ..wait ms.. [callback] etc.
		if (typeof waitfirst === "undefined") waitfirst = true;

		// add new timer object
		var tim = new LCDGame.Timer(context, callback, ms, waitfirst);
		
		this.timers.push(tim);
		
		return tim;
	},

	cleartimers: function() {
		// clear all timers
		for (var t=0; t < this.timers.length; t++) {
			this.timers[t].pause();
			this.timers[t] = null;
		};
		this.timers = [];
	},
	
	updateloop: function(timestamp) {

		// check all timers
		for (var t=0; t < this.timers.length; t++) {
			if (this.timers[t].enabled) {
				this.timers[t].update(timestamp);
			};
		};
		
		// any shapes updates
		if (this._refresh) {
			this.shapesRefresh();
			this._refresh = false;
		};
	},

	gameReset: function(gametype) {
		// new game reset variables
		this.score = 0;
		this.level = 0;
		this.gametype = gametype;
	},

	// -------------------------------------
	// sound effects
	// -------------------------------------
	loadSoundEffects: function() {
		// handle error
		console.log("loadSoundEffects - TODO load sound effects");
	},

	setSoundMute: function (value) {
		this.soundmute = value;
	},

	soundIndexByName: function (name) {
		var idx = 0;
		for (var i = 0; i < this.gamedata.sounds.length; i++) {
			if (this.gamedata.sounds[i].name == name) {
				return i;
			};
		};
		return -1;
	},

	playSoundEffect: function (name) {
		
		// device sound is not muted
		if (!this.soundmute) {
			// get sound index from name
			var idx = this.soundIndexByName(name);
			
			// if sound exists
			if (idx >= 0) {
				// if sound is playing then stop it now
				if (this.gamedata.sounds[idx].audio.paused == false) {
					this.gamedata.sounds[idx].audio.pause();
					// fix for IE11
					if (!isNaN(this.gamedata.sounds[idx].audio.duration)) {
						this.gamedata.sounds[idx].audio.currentTime = 0;
					};
				};
				// start playing sound
				this.gamedata.sounds[idx].audio.play();
			};
		};
	},

	// -------------------------------------
	// random integer
	// -------------------------------------
	randomInteger: function(min, max) {
		max = max - min + 1;
		var r = Math.floor(Math.random() * max) + min;
		return r;
	},

	// -------------------------------------
	// function for shapes and sequences
	// -------------------------------------
	shapeIndexByName: function(name) {
		for (var i = 0; i < this.gamedata.frames.length; i++) {
			if (this.gamedata.frames[i].filename == name)
				return i;
		}
		console.log("** ERROR ** shapeIndexByName('"+name+"') - filename not found.");
		// if not found return -1
		throw "lcdgames.js - "+arguments.callee.caller.toString()+", no frame with filename '" + name + "'";
		return -1;
	},

	setShapeByName: function(filename, value) {
		// if called too soon
		if (this.gamedata.frames) {
			// find shape 
			for (var i = 0; i < this.gamedata.frames.length; i++) {
				if (this.gamedata.frames[i].filename == filename) {
					this.gamedata.frames[i].value = value;
					this._refresh = true;
					return true;
				};
			};
		};
		return false;
	},
	
	setShapeByIdx: function(idx, value) {
		this.gamedata.frames[idx].value = value;
		this._refresh = true;
		return true;
	},
	
	sequenceIndexByName: function(name) {
		if (this.gamedata.sequences) {
			for (var i = 0; i < this.gamedata.sequences.length; i++) {
				if (this.gamedata.sequences[i].name == name)
					return i;
			}
			console.log("** ERROR ** sequenceIndexByName('"+name+"') - sequence name not found.");
			// if not found return -1
			throw "lcdgames.js - "+arguments.callee.caller.toString()+", no sequence with name '" + name + "'";
		};
		return -1;
	},

	sequenceClear: function(name) {
		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);

		// shift shape values one place DOWN
		for (var i = 0; i < this.gamedata.sequences[seqidx].ids.length; i++) {
			// get shape index in this sequence
			var shape = this.gamedata.sequences[seqidx].ids[i];
			// clear all shapes in sequence
			this.gamedata.frames[shape].value = false;
		};
		// refresh display
		this._refresh = true;
	},

	sequenceShift: function(name, max) {
		// example start [0] [1] [.] [3] [.] (.=off)
		//        result [.] [1] [2] [.] [4]
		
		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);

		// max position is optional
		if (typeof max === "undefined") max = this.gamedata.sequences[seqidx].ids.length;

		// shift shape values one place DOWN
		var i;
		for (i = max-1; i > 0; i--) {
			// get shape indexes of adjacent shapes in this sequence
			var shape1 = this.gamedata.sequences[seqidx].ids[i-1];
			var shape2 = this.gamedata.sequences[seqidx].ids[i];
			// shift shape values DOWN one place in sequence
			this.gamedata.frames[shape2].value = this.gamedata.frames[shape1].value;
		};
		// set first value to blank; default value false
		var shape1 = this.gamedata.sequences[seqidx].ids[0];
		this.gamedata.frames[shape1].value = false;

		// refresh display
		this._refresh = true;
	},

	sequenceShiftReverse: function(name, min) {
		// example start [.] [1] [.] [3] [4] (.=off)
		//        result [0] [.] [2] [3] [.]

		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);
		
		// min position is optional
		if (typeof min === "undefined") min = 0;

		// shift shape values one place UP
		var i;
		for (i = min; i < this.gamedata.sequences[seqidx].ids.length-1; i++) {
			// get shape indexes of adjacent shapes in this sequence
			var shape1 = this.gamedata.sequences[seqidx].ids[i];
			var shape2 = this.gamedata.sequences[seqidx].ids[i+1];
			// shift shape values UP one place in sequence
			this.gamedata.frames[shape1].value = this.gamedata.frames[shape2].value;
		};
		// set last value to blank; default value false
		var shape1 = this.gamedata.sequences[seqidx].ids[i];
		this.gamedata.frames[shape1].value = false;
		// refresh display
		this._refresh = true;
	},

	sequenceSetFirst: function(name, value) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// set value for first shape in sequence
		var shape1 = this.gamedata.sequences[seqidx].ids[0];
		this.gamedata.frames[shape1].value = value;
		// refresh display
		this._refresh = true;
	},

	sequenceSetPos: function(name, pos, value) {
		if (this.gamedata.sequences) {
			// get sequence
			var seqidx = this.sequenceIndexByName(name);

			// if pos is -1, then last last position
			if (pos == -1) {pos = this.gamedata.sequences[seqidx].ids.length-1};

			// if pos out of bound of sequence array
			if (pos < this.gamedata.sequences[seqidx].ids.length) {
				// set value for position shape in sequence
				var shape1 = this.gamedata.sequences[seqidx].ids[pos];
				this.gamedata.frames[shape1].value = value;

				// refresh display
				this._refresh = true;
			};
		}
	},

	shapeVisible: function(name) {
		// find shape 
		for (var i = 0; i < this.gamedata.frames.length; i++) {
			if (this.gamedata.frames[i].filename == name) {
				if (this.gamedata.frames[i].value == true) {
					return true;
				};
			};
		};
		return false;
	},
	
	sequenceShapeVisible: function(name, pos) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// single pos or any pos
		if (typeof pos === "undefined") {
			// no pos given, check if any shape visible
			for (var i = 0; i < this.gamedata.sequences[seqidx].ids.length; i++) {
				// check if any shape is visible (value==true)
				var shape1 = this.gamedata.sequences[seqidx].ids[i];
				if (this.gamedata.frames[shape1].value == true) {
					return true;
				};
			};
		} else {
			// if pos is -1, then last last position
			if (pos == -1) {pos = this.gamedata.sequences[seqidx].ids.length-1};
			
			// if pos out of bound of sequence array
			if (pos < this.gamedata.sequences[seqidx].ids.length) {
				// check if shape is visible (value==true)
				var shape1 = this.gamedata.sequences[seqidx].ids[pos];
				if (this.gamedata.frames[shape1].value == true) {
					return true;
				};
			};
		};
		return false;
	},

	shapesDisplayAll: function(value) {

		if (this.gamedata.frames) {
			// all shapes
			for (var i = 0; i < this.gamedata.frames.length; i++) {
				// print out current values of sequence
				if ( (this.gamedata.frames[i].type == "shape") || (this.gamedata.frames[i].type == "digitpos") ) {
					this.gamedata.frames[i].value = value;
				};
			};
			// all digits
			if (value == true) {
				for (var i = 0; i < this.gamedata.digits.length; i++) {
					this.digitsDisplay(this.gamedata.digits[i].name, this.gamedata.digits[i].max);
				};
			};
			// refresh display
			this._refresh = true;
		};
	},

	// -------------------------------------
	// function for digits
	// -------------------------------------
	digitsDisplay: function(name, str, rightalign) {
		// not loaded yet
		if (!this.gamedata.digits) return;

		// get sequence
		var digidx = -1;
		for (var i = 0; i < this.gamedata.digits.length; i++) {
			if (this.gamedata.digits[i].name == name) {
				digidx = i;
				break;
			};
		};
		
		if (digidx == -1) {
			console.log("** ERROR ** digitsDisplay('"+name+"') - digits not found.");
			// if not found return -1
			throw "lcdgames.js - digitsDisplay, no digits with name '" + name + "'";
		} else {

			// align right parameter is optional, set default value
			//if (rightalign === "undefined") {rightalign = false};

			// set value for first shape in sequence
			var chridx = 0; // index of character in str
			var firstid = 0; // index of id in shape ids
			
			// exception for right-align
			if (rightalign == true) {
				firstid = this.gamedata.digits[digidx].locids.length - str.length;
				// if too many digits
				if (firstid < 0) {
					chridx = Math.abs(firstid); // skip left-most digit(s) of str
					firstid = 0;
				};
			};

			// example
			// placeholders [ ] [ ] [ ] [ ] [ ]
			// str " 456"   [ ] [4] [5] [6]
			// outcome should be
			// placeholders [.] [4] [5] [6] [.]  (.=empty/invisible)
			// firstid = index 1-^
			
			// adjust all shapes of digitplaceholders to display correct digits, and force them to refresh
			for (var i=0; i < this.gamedata.digits[digidx].locids.length; i++) {
				// shape of digitplaceholder
				var locidx = this.gamedata.digits[digidx].locids[i];
				
				// make non-used digit placeholders invisible
				if ( (i < firstid) || (chridx >= str.length) ) {
					// make non-used digit placeholders invisible
					this.gamedata.frames[locidx].value = false;
				} else {
					// 48 = ascii code for "0"
					var digit = str.charCodeAt(chridx) - 48;

					// check if valid digit				
					if ( (digit >= 0) && (digit < this.gamedata.digits[digidx].ids.length) ) {
						var digitshape = this.gamedata.digits[digidx].ids[digit]; // shape of digit
						
						// change the "from" part of the placeholder so it will draw the desired digit shape
						this.gamedata.frames[locidx].frame.x = this.gamedata.frames[digitshape].frame.x;
						this.gamedata.frames[locidx].frame.y = this.gamedata.frames[digitshape].frame.y;

						// make sure the placeholder (with new digit) gets re-drawn
						this.gamedata.frames[locidx].value = true;
					} else {
						// non-digit, example space (' ')
						this.gamedata.frames[locidx].value = false;
					};
					// next character in str
					chridx = chridx + 1;
				};
			};

			// refresh display
			this._refresh = true;
		};
	},
	
	// -------------------------------------
	// function for drawing and redrawing shapes 
	// -------------------------------------
	shapesRefresh: function() {

		// TODO: implement dirty rectangles?
		// FOR NOW: simply redraw everything
	
		if (this.gamedata.frames) {
			// redraw entire background (=inefficient)
			this.context2d.drawImage(this.imageBackground, 0, 0);
			
			// add current/previous values to all shape objects
			for (var i = 0; i < this.gamedata.frames.length; i++) {
				if (this.gamedata.frames[i].value == true) {
					this.shapeDraw(i);
				};
			};
			
			this.drawDebugText();

			// debugging show button areas
			//for (var i=0; i < this.gamedata.buttons.length; i++) {
			//	var x1 = this.gamedata.buttons[i].area.x1;
			//	var y1 = this.gamedata.buttons[i].area.y1;
			//	var x2 = this.gamedata.buttons[i].area.x2;
			//	var y2 = this.gamedata.buttons[i].area.y2;
			//	this.debugRectangle(x1, y1, (x2-x1), (y2-y1));
			//};
		};
		// display was refreshed
		this._refresh = false;
		
	},

	shapeDraw: function(index) {
		// draw shape
		this.context2d.drawImage(
			this.imageShapes,
			this.gamedata.frames[index].frame.x, // from
			this.gamedata.frames[index].frame.y,
			this.gamedata.frames[index].frame.w,
			this.gamedata.frames[index].frame.h,
			this.gamedata.frames[index].spriteSourceSize.x, // to
			this.gamedata.frames[index].spriteSourceSize.y,
			this.gamedata.frames[index].spriteSourceSize.w,
			this.gamedata.frames[index].spriteSourceSize.h
		);

		// show shape index
		//this.context2d.font = "bold 16px sans-serif";
		//this.context2d.fillStyle = "#fff";
		//this.context2d.fillText(index, this.gamedata.frames[index].xpos, this.gamedata.frames[index].ypos);
	},

	debugText: function(str) {
		// set text
		this.debugtxt = str;
	},

	drawDebugText: function() {
		if (this.debugtxt) {
			// set font and position
			this.context2d.font = "bold 24px sans-serif";
			var x = 50;
			var y = 50;

			var lineheight = 15;		
			var lines = this.debugtxt.split('\n');

			for (var i = 0; i<lines.length; i++) {
				// shadow text
				this.context2d.fillStyle = "#000";
				this.context2d.fillText(lines[i], x+2, y+2);
				// white text
				this.context2d.fillStyle = "#fff";
				this.context2d.fillText(lines[i], x, y);
				y = y + lineheight;
			};
		};
	},

	// -------------------------------------
	// buttons input through keyboard
	// -------------------------------------
	buttonAdd: function(name, framenames, defaultkeys) {
		// if no buttons yet
		if (typeof this.buttons === 'undefined') {
			this.buttons = [];
		}
		var maxidx = this.gamedata.buttons.length;

		// add button keycodes
		this.gamedata.buttons[maxidx] = {};
		
		// set values for button
		this.gamedata.buttons[maxidx].name = name;
		this.gamedata.buttons[maxidx].frames = framenames;
		this.gamedata.buttons[maxidx].defaultkeys = defaultkeys;
		
		this.gamedata.buttons[maxidx].keycodes = this.determineKeyCodes(defaultkeys);
	},
		
	determineKeyCodes: function(keyname) {
		// variables
		var result = [];
		
		// possibly more than 1 keyvariables
		for (var i = 0; i < keyname.length; i++) {
			var c = 0;
			var k = keyname[i];
			
			// key code
			k = k.toUpperCase();
			if (k.indexOf("UP") > -1) {
				c = 38;
			} else if (k.indexOf("DOWN") > -1) {
				c = 40;
			} else if (k.indexOf("LEFT") > -1) {
				c = 37;
			} else if (k.indexOf("RIGHT") > -1) {
				c = 39;
			} else {
				c = k.charCodeAt(0);
			};
			// add
			result.push(c);
		};

		// return array of keycode(s)
		return result;
	},

	ontouchstart: function(evt) {

		evt.preventDefault();

		//  evt.changedTouches is changed touches in this event, not all touches at this moment
		for (var i = 0; i < event.changedTouches.length; i++)
		{
			this.onmousedown(event.changedTouches[i]);
		}
	},
	
	ontouchend: function(evt) {
		evt.preventDefault();

		//  evt.changedTouches is changed touches in this event, not all touches at this moment
		for (var i = 0; i < evt.changedTouches.length; i++)
		{
			this.onmouseup(evt.changedTouches[i]);
		}
	},

	onmousedown: function(evt) {

		var x = (evt.offsetX || evt.clientX - evt.target.offsetLeft);
		var y = (evt.offsetY || evt.clientY - evt.target.offsetTop);

		//var x = evt.layerX;
		//var y = evt.layerY;
		x = x / this.scaleFactor;
		y = y / this.scaleFactor;

		// check if pressed in defined buttons
		for (var i=0; i < this.gamedata.buttons.length; i++) {
			// inside button touch area
			if (   (x > this.gamedata.buttons[i].area.x1)
				&& (x < this.gamedata.buttons[i].area.x2)
				&& (y > this.gamedata.buttons[i].area.y1)
				&& (y < this.gamedata.buttons[i].area.y2)
			) {
				var btnidx = 0;
				// which type of device button
				switch(this.gamedata.buttons[i].type) {
					case "updown":
						// two direction button up/down
						var yhalf = ((this.gamedata.buttons[i].area.y2 - this.gamedata.buttons[i].area.y1) / 2);
						// up or down
						btnidx = (y < this.gamedata.buttons[i].area.y1 + yhalf ? 0 : 1);
						break;
					case "leftright":
						// two direction button left/right
						var xhalf = ((this.gamedata.buttons[i].area.x2 - this.gamedata.buttons[i].area.x1) / 2);
						// left or right
						btnidx = (x < this.gamedata.buttons[i].area.x1 + xhalf ? 0 : 1);
						break;
					case "dpad":
						// four direction button up/down/left/right
						var xhalf = ((this.gamedata.buttons[i].area.x2 - this.gamedata.buttons[i].area.x1) / 2);
						var yhalf = ((this.gamedata.buttons[i].area.y2 - this.gamedata.buttons[i].area.y1) / 2);
						// distance to center
						var xdist = x - this.gamedata.buttons[i].area.x1 - xhalf;
						var ydist = y - this.gamedata.buttons[i].area.y1 - yhalf;
						if (Math.abs(xdist) < Math.abs(ydist)) {
							// up or down
							btnidx = (ydist < 0 ? 0 : 1); // 0=up, 1=down
						} else {
							// left or right
							btnidx = (xdist < 0 ? 2 : 3); // 2=left, 3=right
						};
						break;
					//default: // case "button":
					//	// simple button
					//	btnidx = 0;
					//	break;
				};
				// button press down
				this.onButtonDown(i, btnidx);
			};
		};
	},
	
	onmouseup: function(evt) {

		var x = (evt.offsetX || evt.clientX - evt.target.offsetLeft);
		var y = (evt.offsetY || evt.clientY - evt.target.offsetTop);
		
		//var x = evt.layerX;
		//var y = evt.layerY;
		var x = x / this.scaleFactor;
		var y = y / this.scaleFactor;

		// check if pressed in defined buttons
		for (var i=0; i < this.gamedata.buttons.length; i++) {
			// inside button touch area
			if (   (x > this.gamedata.buttons[i].area.x1)
				&& (x < this.gamedata.buttons[i].area.x2)
				&& (y > this.gamedata.buttons[i].area.y1)
				&& (y < this.gamedata.buttons[i].area.y2)
			) {
				var btnidx = 0;
				// which type of device button
				switch(this.gamedata.buttons[i].type) {
					case "updown":
						// two direction button up/down
						var half = ((this.gamedata.buttons[i].area.y2 - this.gamedata.buttons[i].area.y1) / 2);
						// up or down
						btnidx = (y < this.gamedata.buttons[i].area.y1 + half ? 0 : 1);
						break;
					case "leftright":
						// two direction button left/right
						var half = ((this.gamedata.buttons[i].area.x2 - this.gamedata.buttons[i].area.x1) / 2);
						// left or right
						btnidx = (x < this.gamedata.buttons[i].area.x1 + half ? 0 : 1);
						break;
					case "dpad":
						// four direction button up/down/left/right
						var xhalf = ((this.gamedata.buttons[i].area.x2 - this.gamedata.buttons[i].area.x1) / 2);
						var yhalf = ((this.gamedata.buttons[i].area.y2 - this.gamedata.buttons[i].area.y1) / 2);
						// distance to center
						var xdist = x - this.gamedata.buttons[i].area.x1 - xhalf;
						var ydist = y - this.gamedata.buttons[i].area.y1 - yhalf;
						if (Math.abs(xdist) < Math.abs(ydist)) {
							// up or down
							btnidx = (ydist < 0 ? 0 : 1); // 0=up, 1=down
						} else {
							// left or right
							btnidx = (xdist < 0 ? 2 : 3); // 2=left, 3=right
						};
						break;
					//default: // case "button":
					//	// simple button
					//	btnidx = 0;
					//	break;
				};
				// button release
				this.onButtonUp(i, btnidx);
			};
		};
	},

	onkeydown: function(e) {
		// get keycode
		var keyCode = e.keyCode;

		// check if keycode in defined buttons
		for (var i=0; i < this.gamedata.buttons.length; i++) {
			for (var j=0; j < this.gamedata.buttons[i].keycodes.length; j++) {
				if (this.gamedata.buttons[i].keycodes[j] == keyCode) {
					this.onButtonDown(i, j);
				};
			};
		};
	},
	
	onkeyup: function(e) {
		// get keycode
		var keyCode = e.keyCode;

		// check if keycode in defined buttons
		for (var i=0; i < this.gamedata.buttons.length; i++) {
			for (var j=0; j < this.gamedata.buttons[i].keycodes.length; j++) {
				if (this.gamedata.buttons[i].keycodes[j] == keyCode) {
					this.onButtonUp(i);
				};
			};
		};
	},
	
	onButtonDown: function(btnidx, diridx) {
		// pass input to game
		var name = this.gamedata.buttons[btnidx].name;
		this.state.currentState().press(name, diridx);

		// show button down on screen
		var idx = this.gamedata.buttons[btnidx].ids[diridx];
		this.setShapeByIdx(idx, true);
	},
	
	onButtonUp: function(btnidx, diridx) {
		// TODO: visually update frame so key is in neutral position
		for (var s=0; s < this.gamedata.buttons[btnidx].ids.length; s++) {
			var idx = this.gamedata.buttons[btnidx].ids[s];
			this.setShapeByIdx(idx, false);
		};

		// pass input to game
		if (typeof this.state.currentState().release !== "undefined") {
			var name = this.gamedata.buttons[btnidx].name;
			this.state.currentState().release(name, diridx);
		}
	},

	debugRectangle: function(xpos, ypos, w, h) {
		var color = "#f0f";
		// highlight a shape
		this.context2d.beginPath();
		this.context2d.lineWidth = "1";
		this.context2d.strokeStyle = color;
		this.context2d.fillStyle = color;
		this.context2d.rect(xpos, ypos, w, h);
		this.context2d.stroke();
	},

	// -------------------------------------
	// check if touch device
	// -------------------------------------
	is_touch_device: function() {
		var el = document.createElement("div");
		el.setAttribute("lcdgame.js - ongesturestart", "return;");
		if(typeof el.ongesturestart === "function"){
			return true;
		}else {
			return false
		}
	}
};

// -------------------------------------
// beats per minute to milliseconds, static helper function
// -------------------------------------
LCDGame.BPMToMillSec = function (bpm) {
	return (60000 / bpm);
}
// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// shape object
// -------------------------------------
LCDGame.Shape = function (lcdgame, framename) {
	// save reference to game object 
	this.lcdgame = lcdgame;
	this.framename = framename;
	this.idx = 0;
};

// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// button object
// -------------------------------------
LCDGame.Button = function (lcdgame, name) {
	// save reference to game object 
	this.lcdgame = lcdgame;
	this.name = name;
	this.keycodes = [];
	
	// do a guess
	// save reference to game object

	//TODO: add support for buttons types
//button type="button"		ok
//button type="updown"		ok
//button type="leftright"	ok
//button type="dpad"		TODO
//button type="diagonal"	TODO
//button type="switch"		TODO

};

// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// pulse timer object
// -------------------------------------
LCDGame.Timer = function (context, callback, interval, waitfirst) {
	// context of callback
	this.context = context;
	
	// Event: Timer tick
	this.callback = callback;

	// frequency of the timer in milliseconds
	this.interval = interval || 1000;
	
	// call callback instantly, or wait one pulse until calling callback
	this.waitfirst = waitfirst;

	// counter, useful for directing animations etc.
	this.counter = 0;

	// maximum counter, useful for directing animations etc.
	this.max = null;

	// Property: Whether the timer is enable or not
	this.enabled = false;

	// Member variable: Hold interval id of the timer
	this.timerId = 0;
	this.lasttime = 0;
}
	
LCDGame.Timer.prototype = {

	// update each frame
	update: function(timestamp) {
	
		//debugger;
		var varname = this.callback.name;
		//for (var key in this.context) {
		//	if (this.context.hasOwnProperty(key)) {
		//		if (key.indexOf("timer") >= 0) {
		//			varname = key;
		//			break;
		//		};
		//	};
		//};
		
		var delta = timestamp - this.lasttime;
		
		// timer tick
		if (delta >= this.interval) {
			//console.log("LCDGame.Timer<"+varname+">.update() -> delta="+delta+" this.interval="+this.interval+" this.lasttime="+this.lasttime+" this.waitfirst="+this.waitfirst);
			//this.lasttime = timestamp;
			this.lasttime = this.lasttime + this.interval;
			// game callbacks
			this.doTimerEvent();
		};
	},
	
	// local timer event of Timer-object
	doTimerEvent: function() {
		// keep track how many times event has fired
		this.counter++;
		// do callback function to gameobj, so not to LCDGame.Timer object

		this.callback.call(this.context, this);
		// if maximum of callbacks was set
		if (typeof this.max !== "undefined") {
			if (this.counter >= this.max) this.enabled = false;
		};
	},

	// start/enable the timer
	start: function(max, waitfirst) {
		// change waitfirst only when passed as parameter
		if (typeof waitfirst !== "undefined") this.waitfirst = waitfirst;
		// initialise variables
		this.enabled = true;
		this.counter = 0;
		this.max = max;
		//this.lasttime = 0;
		this.lasttime = (this.context.lcdgame.raf.raftime || 0);
		// start immediately?
		if (this.waitfirst == false) this.lasttime -= this.interval;
	},

	// pause the timer
	pause: function() {
		// initialise variables
		this.enabled = false;
	},

	// unpause the timer; continue but do not reset the counter
	unpause: function() {
		this.lasttime = (this.context.lcdgame.raf.raftime || 0);
		if (this.waitfirst == false) this.lasttime -= this.interval;
		this.enabled = true;
	}
};
