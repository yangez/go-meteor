﻿/*!
 * Copyright (c) 2013 Jan Prokop
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Main namespace - it initializes WGo in first run and then execute main function.
 * You must call WGo.init() if you want to use library, without calling WGo.
 */


WGo = {
	// basic information
	version: "2.0",

	// constants for colors (rather use WGo.B or WGo.W)
	B: 1,
	W: -1,

	// if true errors will be shown in dialog window, otherwise they will be ignored
	ERROR_REPORT: true,
	// DIR: mydir,

	// Language of player, you can change this global variable any time. Object WGo.i18n.<your lang> must exist.
	lang: "en",

	// Add terms for each language here
	i18n: {
		en: {}
	}
}

// translating function
WGo.t = function(str) {
	var loc = WGo.i18n[WGo.lang][str] || WGo.i18n.en[str];
	if(loc) {
		for(var i = 1; i < arguments.length; i++) {
			loc = loc.replace("$", arguments[i]);
		}
		return loc;
	}
	return str;
}

// helping function for class inheritance
WGo.extendClass = function(parent, child) {
	child.prototype = Object.create(parent.prototype);
	child.prototype.constructor = child;
	child.prototype.super = parent;

	return child;
};

// helping function for class inheritance
WGo.abstractMethod = function() {
	throw Error('unimplemented abstract method');
};

// helping function for deep cloning of simple objects,
WGo.clone = function(obj) {
	if(obj && typeof obj == "object") {
		var n_obj = obj.constructor == Array ? [] : {};

		for(var key in obj) {
			if(obj[key] == obj) n_obj[key] = obj;
			else n_obj[key] = WGo.clone(obj[key]);
		}

		return n_obj;
	}
	else return obj;
}

// filter html to avoid XSS
WGo.filterHTML = function(text) {
	if(!text || typeof text != "string") return text;
	return text.replace("<", "&lt;").replace(">", "&gt;");
}

//---------------------- WGo.Board -----------------------------------------------------------------------------

/**
 * Board class constructor - it creates a canvas board
 *
 * @param elem DOM element to put in
 * @param config configuration object. It is object with "key: value" structure. Possible configurations are:
 *
 * - size: number - size of the board (default: 19)
 * - width: number - width of the board (default: 0)
 * - height: number - height of the board (default: 0)
 * - font: string - font of board writings (default: "Calibri")
 * - lineWidth: number - line width of board drawings
 * - starPoints: Object - star points coordinates, defined for various board sizes. Look at Board.default for more info.
 * - stoneHandler: Board.DrawHandler - stone drawing handler (default: Board.drawHandlers.NORMAL)
 * - starSize: number - size of star points (default: 1). Radius of stars is dynamic, however you can modify it by given constant.
 * - stoneSize: number - size of stone (default: 1). Radius of stone is dynamic, however you can modify it by given constant.
 * - shadowSize: number - size of stone shadow (default: 1). Radius of shadow is dynamic, however you can modify it by given constant.
 * - background: string - background of the board, it can be either color (#RRGGBB) or url. Empty string means no background. (default: WGo.DIR+"wood1.jpg")
 * - section: {
 *     top: number,
 *     right: number,
 *     bottom: number,
 *     left: number
 *   }
 *   It defines a section of board to be displayed. You can set a number of rows(or cols) to be skipped on each side.
 *   Numbers can be negative, in that case there will be more empty space. In default all values are zeros.
 */

var Board = function(elem, config) {
	var config = config || {};

	// set user configuration
	for(var key in config) this[key] = config[key];

	// add default configuration
	for(var key in WGo.Board.default) if(this[key] === undefined) this[key] = WGo.Board.default[key];

	// set section if set
	this.tx = this.section.left;
	this.ty = this.section.top;
	this.bx = this.size-1-this.section.right;
	this.by = this.size-1-this.section.bottom;

	// init board
	this.init();

	// append to element
	elem.appendChild(this.element);

	// set initial dimensions
	if(this.width && this.height) this.setDimensions(this.width, this.height);
	else if(this.width) this.setWidth(this.width);
	else if(this.height) this.setHeight(this.height);
}

var shadow_handler = {
	draw: function(args, board) {
		var xr = board.getX(args.x),
			yr = board.getY(args.y),
			sr = board.stoneRadius;

		this.beginPath();
		this.fillStyle = 'rgba(32,32,32,0.5)';
		this.arc(xr-0.5, yr-0.5, sr-0.5, 0, 2*Math.PI, true);
		this.fill();
	}
}

var get_markup_color = function(board, x, y) {
	if(board.obj_arr[x][y][0].c == WGo.B) return "white";
	return "black";
}

var redraw_layer = function(board, layer) {
	var handler;

	board[layer].clear();
	board[layer].draw(board);

	for(var x = 0; x < board.size; x++) {
		for(var y = 0; y < board.size; y++) {
			for(var key in board.obj_arr[x][y]) {
				if(!board.obj_arr[x][y][key].type) handler = board.stoneHandler;
				else if(typeof board.obj_arr[x][y][key].type == "string") handler = Board.drawHandlers[board.obj_arr[x][y][key].type];
				else handler = board.obj_arr[x][y][key].type;

				if(handler[layer]) handler[layer].draw.call(board[layer].context, board.obj_arr[x][y][key], board);
			}
		}
	}

	for(var key in board.obj_list) {
		var handler = board.obj_list[key].handler;

		if(handler[layer]) handler[layer].draw.call(board[layer].context, board.obj_list[key].args, board);
	}
}

// drawing handlers

Board.drawHandlers = {
	// handler for normal stones
	NORMAL: {
		// draw handler for stone layer
		stone: {
			// drawing function - args object contain info about drawing object, board is main board object
			// this function is called from canvas2D context
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius,
					radgrad;

				// set stone texture
				if(args.c == WGo.W) {
					radgrad = this.createRadialGradient(xr-2*sr/5,yr-2*sr/5,sr/3,xr-sr/5,yr-sr/5,5*sr/5);
					radgrad.addColorStop(0, '#fff');
					//radgrad.addColorStop(1, '#d4d4d4');
					radgrad.addColorStop(1, '#aaa');
				}
				else {
					radgrad = this.createRadialGradient(xr-2*sr/5,yr-2*sr/5,1,xr-sr/5,yr-sr/5,4*sr/5);
					radgrad.addColorStop(0, '#666');
					radgrad.addColorStop(1, '#000');
				}

				// paint stone
				this.beginPath();
				this.fillStyle = radgrad;
				this.arc(xr-0.5, yr-0.5, sr-0.5, 0, 2*Math.PI, true);
				this.fill();
			}
		},
		// adding shadow handler
		shadow: shadow_handler,
	},

	PAINTED: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius,
					radgrad;

				if(args.c == WGo.W) {
					radgrad = this.createRadialGradient(xr-2*sr/5,yr-2*sr/5,2,xr-sr/5,yr-sr/5,4*sr/5);
					radgrad.addColorStop(0, '#fff');
					radgrad.addColorStop(1, '#ddd');
				}
				else {
					radgrad = this.createRadialGradient(xr-2*sr/5,yr-2*sr/5,1,xr-sr/5,yr-sr/5,4*sr/5);
					radgrad.addColorStop(0, '#111');
					radgrad.addColorStop(1, '#000');
				}

				this.beginPath();
				this.fillStyle = radgrad;
				this.arc(xr-0.5, yr-0.5, sr-0.5, 0, 2*Math.PI, true);
				this.fill();

				this.beginPath();
				this.lineWidth = sr/6;

				if(args.c == WGo.W) {
					this.strokeStyle = '#999';
					this.arc(xr+sr/8, yr+sr/8, sr/2, 0, Math.PI/2, false);
				}
				else {
					this.strokeStyle = '#ccc';
					this.arc(xr-sr/8, yr-sr/8, sr/2, Math.PI, 1.5*Math.PI);
				}

				this.stroke();
			}
		},
		shadow: shadow_handler,
	},

	GLOW: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius;

				var radgrad;
				if(args.c == WGo.W) {
					radgrad = this.createRadialGradient(xr-2*sr/5,yr-2*sr/5,sr/3,xr-sr/5,yr-sr/5,8*sr/5);
					radgrad.addColorStop(0, '#fff');
					radgrad.addColorStop(1, '#666');
				}
				else {
					radgrad = this.createRadialGradient(xr-2*sr/5,yr-2*sr/5,1,xr-sr/5,yr-sr/5,3*sr/5);
					radgrad.addColorStop(0, '#555');
					radgrad.addColorStop(1, '#000');
				}

				this.beginPath();
				this.fillStyle = radgrad;
				this.arc(xr-0.5, yr-0.5, sr-0.5, 0, 2*Math.PI, true);
				this.fill();
			},
		},
		shadow: shadow_handler,
	},

	MONO: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius,
					lw = board.lineWidth || 1;

				if(args.c == WGo.W) this.fillStyle = "white";
				else this.fillStyle = "black";

				this.beginPath();
				this.arc(xr, yr, sr-lw, 0, 2*Math.PI, true);
				this.fill();

				this.lineWidth = lw;
				this.strokeStyle = "black";
				this.stroke();
			}
		},
	},

	CR: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius;

				this.strokeStyle = args.c || get_markup_color(board, args.x, args.y);
				this.lineWidth = args.lineWidth || board.lineWidth || 1;
				this.beginPath();
				this.arc(xr-0.5, yr-0.5, sr/2, 0, 2*Math.PI, true);
				this.stroke();
			},
		},
	},

	// Label drawing handler
	LB: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius,
					font = args.font || board.font || "";

				if(board.obj_arr[args.x][args.y][0].c == WGo.W) this.fillStyle = "black";
				else if(board.obj_arr[args.x][args.y][0].c == WGo.B) this.fillStyle = "white";
				else this.fillStyle = "#1C1C1C";

				if(args.text.length == 1) this.font = Math.round(sr*1.5)+"px "+font;
				else if(args.text.length == 2) this.font = Math.round(sr*1.2)+"px "+font;
				else this.font = Math.round(sr)+"px "+font;

				this.beginPath();
				this.textBaseline="middle";
				this.textAlign="center";
				this.fillText(args.text, xr, yr, 2*sr);

			},
		},

		// modifies grid layer too
		grid: {
			draw: function(args, board) {
				if(!board.obj_arr[args.x][args.y][0].c && !args._nodraw) {
					var xr = board.getX(args.x),
						yr = board.getY(args.y),
						sr = board.stoneRadius;
					this.clearRect(xr-sr,yr-sr,2*sr,2*sr);
				}
			},
			clear: function(args, board) {
				if(!board.obj_arr[args.x][args.y][0].c)  {
					args._nodraw = true;
					redraw_layer(board, "grid");
					delete args._nodraw;
				}
			}
		},
	},

	SQ: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = Math.round(board.stoneRadius);

				this.strokeStyle = args.c || get_markup_color(board, args.x, args.y);
				this.lineWidth = args.lineWidth || board.lineWidth || 1;
				this.beginPath();
				this.rect(Math.round(xr-sr/2)-0.5, Math.round(yr-sr/2)-0.5, sr, sr);
				this.stroke();
			}
		}
	},

	TR: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius;

				this.strokeStyle = args.c || get_markup_color(board, args.x, args.y);
				this.lineWidth = args.lineWidth || board.lineWidth || 1;
				this.beginPath();
				this.moveTo(xr-0.5, yr-0.5-Math.round(sr/2));
				this.lineTo(Math.round(xr-sr/2)-0.5, Math.round(yr+sr/3)+0.5);
				this.lineTo(Math.round(xr+sr/2)+0.5, Math.round(yr+sr/3)+0.5);
				this.closePath();
				this.stroke();
			}
		}
	},

	MA: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius;

				this.strokeStyle = args.c || get_markup_color(board, args.x, args.y);
				this.lineWidth = (args.lineWidth || board.lineWidth || 1) * 2;
				this.beginPath();
				this.moveTo(Math.round(xr-sr/2), Math.round(yr-sr/2));
				this.lineTo(Math.round(xr+sr/2), Math.round(yr+sr/2));
				this.moveTo(Math.round(xr+sr/2)-1, Math.round(yr-sr/2));
				this.lineTo(Math.round(xr-sr/2)-1, Math.round(yr+sr/2));
				this.stroke();
			}
		}
	},

	SL: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius;

				this.fillStyle = args.c || get_markup_color(board, args.x, args.y);
				this.beginPath();
				this.rect(xr-sr/2, yr-sr/2, sr, sr);
				this.fill();
			}
		}
	},

	SM: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius;

				this.strokeStyle = args.c || get_markup_color(board, args.x, args.y);
				this.lineWidth = (args.lineWidth || board.lineWidth || 1)*2;
				this.beginPath();
				this.arc(xr-sr/3, yr-sr/3, sr/6, 0, 2*Math.PI, true);
				this.stroke();
				this.beginPath();
				this.arc(xr+sr/3, yr-sr/3, sr/6, 0, 2*Math.PI, true);
				this.stroke();
				this.beginPath();
				this.moveTo(xr-sr/1.5,yr);
				this.bezierCurveTo(xr-sr/1.5,yr+sr/2,xr+sr/1.5,yr+sr/2,xr+sr/1.5,yr);
				this.stroke();
			}
		}
	},

	DEAD: {
		stone: {
			draw: function(args, board) {

				var centerX = board.getX(args.x),
					centerY = board.getY(args.y),
					radius = board.stoneRadius/3;

				this.strokeStyle = args.c || get_markup_color(board, args.x, args.y);
				this.beginPath();
				this.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
				this.fillStyle = 'red';
				this.fill();
				this.lineWidth = args.lineWidth || board.lineWidth || 1;
				this.closePath();
				this.stroke();
			}
		}
	},

	// 50% opacity stone for hovering
	BLACK_HOVER: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius,
					radgrad;

				radgrad = this.createRadialGradient(xr-2*sr/5,yr-2*sr/5,1,xr-sr/5,yr-sr/5,4*sr/5);
				radgrad.addColorStop(0, 'rgba(102, 102, 102, 0.7)');
				radgrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');

				// paint stone
				this.beginPath();
				this.fillStyle = radgrad;
				this.arc(xr-0.5, yr-0.5, sr-0.5, 0, 2*Math.PI, true);
				this.fill();
			}
		},
	},


	// 50% opacity stone for hovering
	WHITE_HOVER: {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius,
					radgrad;

				// set stone texture
				radgrad = this.createRadialGradient(xr-2*sr/5,yr-2*sr/5,sr/3,xr-sr/5,yr-sr/5,5*sr/5);
				radgrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
				//radgrad.addColorStop(1, '#d4d4d4');
				radgrad.addColorStop(1, 'rgba(170, 170, 170, 0.7)');

				// paint stone
				this.beginPath();
				this.fillStyle = radgrad;
				this.arc(xr-0.5, yr-0.5, sr-0.5, 0, 2*Math.PI, true);
				this.fill();
			}
		},
	},

	outline: {
		stone: {
			draw: function(args, board) {
				this.globalAlpha = 0.3;
				if(args.stoneStyle) Board.drawHandlers[args.stoneStyle].stone.draw.call(this, args, board);
				else board.stoneHandler.stone.draw.call(this, args, board);
				this.globalAlpha = 1;
			}
		}
	},

	mini: {
		stone: {
			draw: function(args, board) {
				board.stoneRadius = board.stoneRadius/2;
				if(args.stoneStyle) Board.drawHandlers[args.stoneStyle].stone.draw.call(this, args, board);
				else board.stoneHandler.stone.draw.call(this, args, board);
				board.stoneRadius = board.stoneRadius*2;
			}
		}
	},
}

Board.CanvasLayer = function() {
	this.element = document.createElement('canvas');
	this.context = this.element.getContext('2d')
}

Board.CanvasLayer.prototype = {
	constructor: Board.CanvasLayer,

	setDimensions: function(width, height) {
		this.element.width = width;
		this.element.height = height;
	},

	draw: function(board) {	},

	clear: function() {
		this.context.clearRect(0,0,this.element.width,this.element.height);
	}
}

Board.GridLayer = WGo.extendClass(Board.CanvasLayer, function() {
	this.super.call(this);
});

Board.GridLayer.prototype.draw = function(board) {
	// draw grid
	var tmp;

	this.context.beginPath();
	this.context.lineWidth = 1;
	this.context.strokeStyle = "#000";

	var tx = Math.round(board.left),
		ty = Math.round(board.top),
		bw = Math.round(board.fieldWidth*(board.size-1)),
		bh = Math.round(board.fieldHeight*(board.size-1));

	this.context.strokeRect(tx-0.5, ty-0.5, bw, bh);

	for(var i = 1; i < board.size-1; i++) {
		tmp = Math.round(board.getX(i))-0.5;
		this.context.moveTo(tmp, ty);
		this.context.lineTo(tmp, ty+bh);

		tmp = Math.round(board.getY(i))-0.5;
		this.context.moveTo(tx, tmp);
		this.context.lineTo(tx+bw, tmp);
	}

	this.context.stroke();

	// draw stars
	this.context.fillStyle = "#000";

	if(board.starPoints[board.size]) {
		for(var key in board.starPoints[board.size]) {
			this.context.beginPath();
			this.context.arc(board.getX(board.starPoints[board.size][key].x)-0.5, board.getY(board.starPoints[board.size][key].y)-0.5, board.starSize*((board.width/300)+1), 0, 2*Math.PI,true);
			this.context.fill();
		}
	}
}

Board.ShadowLayer = WGo.extendClass(Board.CanvasLayer, function(shadowSize) {
	this.super.call(this);
	this.shadowSize = shadowSize === undefined ? 1 : shadowSize;
});

Board.ShadowLayer.prototype.setDimensions = function(width, height) {
	this.super.prototype.setDimensions.call(this, width, height);
	this.context.setTransform(1,0,0,1,Math.round(this.shadowSize*width/300),Math.round(this.shadowSize*height/300));
}

var default_field_clear = function(args, board) {
	var xr = board.getX(args.x),
		yr = board.getY(args.y),
		sr = board.stoneRadius;
	this.clearRect(xr-sr-0.5,yr-sr-0.5, 2*sr, 2*sr);
	this.clearRect(xr-sr-0.5,yr-sr-0.5, 2*sr, 2*sr);
}

// Private methods of WGo.Board

var calcLeftMargin = function() {
	return (3*this.width)/(4*(this.bx+1-this.tx)+2) - this.fieldWidth*this.tx;
}

var calcTopMargin = function() {
	return (3*this.height)/(4*(this.by+1-this.ty)+2) - this.fieldHeight*this.ty;
}

var calcFieldWidth = function() {
	return (4*this.width)/(4*(this.bx+1-this.tx)+2);
}

var calcFieldHeight = function() {
	return (4*this.height)/(4*(this.by+1-this.ty)+2);
}

var clearField = function(x,y) {
	var handler;
	for(var key in this.obj_arr[x][y]) {
		if(!this.obj_arr[x][y][key].type) handler = this.stoneHandler;
		else if(typeof this.obj_arr[x][y][key].type == "string") handler = Board.drawHandlers[this.obj_arr[x][y][key].type];
		else handler = this.obj_arr[x][y][key].type;

		for(var layer in handler) {
			if(handler[layer].clear) handler[layer].clear.call(this[layer].context, this.obj_arr[x][y][key], this);
			else default_field_clear.call(this[layer].context, this.obj_arr[x][y][key], this);
		}
	}
}

var drawField = function(x,y) {
	var handler;
	for(var key in this.obj_arr[x][y]) {
		if(!this.obj_arr[x][y][key].type) handler = this.stoneHandler;
		else if(typeof this.obj_arr[x][y][key].type == "string") handler = Board.drawHandlers[this.obj_arr[x][y][key].type];
		else handler = this.obj_arr[x][y][key].type;

		for(var layer in handler) {
			handler[layer].draw.call(this[layer].context, this.obj_arr[x][y][key], this);
		}
	}
}

var getMousePos = function(e) {
    var top = 0,
		left = 0,
		obj = this.grid.element,
		x, y;

	while (obj && obj.tagName != 'BODY') {
        top += obj.offsetTop;
        left += obj.offsetLeft;
        obj = obj.offsetParent;
    }

	x = Math.round((e.pageX-left-this.left)/this.fieldWidth);
	y = Math.round((e.pageY-top-this.top)/this.fieldHeight);

    return {
        x: x >= this.size ? -1 : x,
        y: y >= this.size ? -1 : y
    };
}

var updateDim = function() {
	this.element.style.width = this.width+"px";
	this.element.style.height = this.height+"px";

	this.stoneRadius = this.stoneSize*Math.min(this.fieldWidth, this.fieldHeight)/2;

	for(var key in this.layers) {
		this.layers[key].setDimensions(this.width, this.height);
	}
}

// Public methods are in the prototype:

Board.prototype = {
	constructor: Board,

	/**
     * Initialization method, it is called in constructor. You shouldn't call it, but you can alter it.
	 */

	init: function() {

		// placement of objects (in 3D array)
		this.obj_arr = [];
		for(var i = 0; i < this.size; i++) {
			this.obj_arr[i] = [];
			for(var j = 0; j < this.size; j++) this.obj_arr[i][j] = [];
		}

		// other objects, stored in list
		this.obj_list = [];

		// layers
		this.layers = [];

		// event listeners, binded to board
		this.listeners = [];

		this.element = document.createElement('div');
		this.element.className = 'wgo-board';

		if(this.background) {
			if(this.background[0] == "#") this.element.style.backgroundColor = this.background;
			else {
				this.element.style.backgroundImage = "url('"+this.background+"')";
				/*this.element.style.backgroundRepeat = "repeat";*/
			}
		}

		this.grid = new Board.GridLayer();
		this.shadow = new Board.ShadowLayer(this.shadowSize);
		this.stone = new Board.CanvasLayer();

		this.addLayer(this.grid, 100);
		this.addLayer(this.shadow, 200);
		this.addLayer(this.stone, 300);
	},

	/**
	 * Set new width of board, height is computed to keep aspect ratio.
	 *
	 * @param {number} width
	 */

	setWidth: function(width) {
		this.width = width;
		this.fieldHeight = this.fieldWidth = calcFieldWidth.call(this);
		this.left = calcLeftMargin.call(this);

		this.height = (this.by-this.ty+1.5)*this.fieldHeight;
		this.top = calcTopMargin.call(this);

		updateDim.call(this);
		this.redraw();
	},

	/**
	 * Set new height of board, width is computed to keep aspect ratio.
	 *
	 * @param {number} height
	 */

	setHeight: function(height) {
		this.height = height;
		this.fieldWidth = this.fieldHeight = calcFieldHeight.call(this);
		this.top = calcTopMargin.call(this);

		this.width = (this.bx-this.tx+1.5)*this.fieldWidth;
		this.left = calcLeftMargin.call(this);

		updateDim.call(this);
		this.redraw();
	},

	/**
	 * Set both dimensions.
	 *
	 * @param {number} width
	 * @param {number} height
	 */

	setDimensions: function(width, height) {
		this.width = width || this.width;
		this.height = height || this.height;

		this.fieldWidth = calcFieldWidth.call(this);
		this.fieldHeight = calcFieldHeight.call(this);
		this.left = calcLeftMargin.call(this);
		this.top = calcTopMargin.call(this);

		updateDim.call(this);
		this.redraw();
	},

	/**
	 * Get currently visible section of the board
	 */

	getSection: function() {
		return this.section;
	},

	/**
	 * Set section of the board to be displayed
	 */

	setSection: function(section_or_top, right, bottom, left) {
		if(typeof section_or_top == "object") {
			this.section = section_or_top;
		}
		else {
			this.section = {
				top: section_or_top,
				right: right,
				bottom: bottom,
				left: left,
			}
		}

		this.tx = this.section.left;
		this.ty = this.section.top;
		this.bx = this.size-1-this.section.right;
		this.by = this.size-1-this.section.bottom;

		this.setDimensions();
	},

	/**
	 * Set board size (eg: 9, 13 or 19), this will clear board's objects.
	 */

	setSize: function(size) {
		var size = size || 19;

		if(size != this.size) {
			this.size = size;

			this.obj_arr = [];
			for(var i = 0; i < this.size; i++) {
				this.obj_arr[i] = [];
				for(var j = 0; j < this.size; j++) this.obj_arr[i][j] = [];
			}

			this.bx = this.size-1-this.section.right;
			this.by = this.size-1-this.section.bottom;
			this.setDimensions();
		}
	},

	/**
	 * Redraw everything.
	 */

	redraw: function() {
		this.grid.clear();
		this.stone.clear();
		this.shadow.clear();
		this.grid.draw(this);
		for(var i = 0; i < this.size; i++) {
			for(var j = 0; j < this.size; j++) {
				drawField.call(this, i, j);
			}
		}
		for(var key in this.obj_list) {
			var handler = this.obj_list[key].handler;

			for(var layer in handler) {
				handler[layer].draw.call(this[layer].context, this.obj_list[key].args, this);
			}
		}
	},

	/**
	 * Get absolute X coordinate
	 *
	 * @param {number} x relative coordinate
	 */

	getX: function(x) {
		return this.left+x*this.fieldWidth;
	},

	/**
	 * Get absolute Y coordinate
	 *
	 * @param {number} y relative coordinate
	 */

	getY: function(y) {
		return this.top+y*this.fieldHeight;
	},

	/**
	 * Add layer to the board. It is meant to be only for canvas layers.
	 *
	 * @param {Board.CanvasLayer} layer to add
	 * @param {number} weight layer with biggest weight is on the top
	 */

	addLayer: function(layer, weight) {
		layer.element.style.position = 'absolute';
		layer.element.style.zIndex = weight;
		layer.setDimensions(this.width, this.height);
		this.element.appendChild(layer.element);
		this.layers.push(layer);
	},

	/**
	 * Remove layer from the board.
	 *
	 * @param {Board.CanvasLayer} layer to remove
	 */

	removeLayer: function(layer) {
		var i = this.layers.indexOf(layer);
		if(i >= 0) {
			this.layers.splice(i,1);
			this.element.removeChild(layer.element);
		}
	},

	update: function(changes) {
		if(changes.remove && changes.remove == "all") this.removeAllObjects();
		else if(changes.remove) {
			for(var key in changes.remove) this.removeObject(changes.remove[key]);
		}

		if(changes.add) {
			for(var key in changes.add) this.addObject(changes.add[key]);
		}
	},

	/* // method doesn't work - Eric
	objectExists: function(obj) {
		for(var key in this.obj_arr[obj.x][obj.y]) {
			if(this.obj_arr[obj.x][obj.y][key].type == obj.type) {
				return true;
			}
		}
		return false;
	},
	*/

	addObject: function(obj) {
		// handling multiple objects
		if(obj.constructor == Array) {
			for(var key in obj) this.addObject(obj[key]);
			return;
		}

		// clear all objects on object's coordinates
		clearField.call(this, obj.x, obj.y);

		// if object of this type is on the board, replace it
		for(var key in this.obj_arr[obj.x][obj.y]) {
			if(this.obj_arr[obj.x][obj.y][key].type == obj.type) {
				this.obj_arr[obj.x][obj.y][key] = obj;
				drawField.call(this, obj.x, obj.y);
				return;
			}
		}

		// if object is a stone, add it at the beginning, otherwise at the end
		if(!obj.type) this.obj_arr[obj.x][obj.y].unshift(obj);
		else this.obj_arr[obj.x][obj.y].push(obj);

		// draw all objects
		drawField.call(this, obj.x, obj.y);
	},

	removeObject: function(obj) {
		// handling multiple objects
		if(obj.constructor == Array) {
			for(var key in obj) this.removeObject(obj[key]);
			return;
		}

		var i;
		for(var j = 0; j < this.obj_arr[obj.x][obj.y].length; j++) {
			if(this.obj_arr[obj.x][obj.y][j].type == obj.type) {
				i = j;
				break;
			}
		}
		if(i === undefined) return;

		// clear all objects on object's coordinates
		clearField.call(this, obj.x, obj.y);

		this.obj_arr[obj.x][obj.y].splice(i,1);

		drawField.call(this, obj.x, obj.y);
	},

	removeObjectsAt: function(x, y) {
		if(!this.obj_arr[x][y].length) return;

		clearField.call(this, x, y);
		this.obj_arr[x][y] = [];
	},

	removeAllObjects: function() {
		this.obj_arr = [];
		for(var i = 0; i < this.size; i++) {
			this.obj_arr[i] = [];
			for(var j = 0; j < this.size; j++) this.obj_arr[i][j] = [];
		}
		this.redraw();
	},

	removeObjectsOfType: function(type) {
		for(var i=0; i<this.size; i++) {
			for(var j = 0; j<this.size; j++) {
				var objects = this.obj_arr[i][j];
				for(var k=0; k<objects.length; k++) {
					if (objects[k].type == type) {
						this.removeObject(objects[k]);
					}
				}
			}
		}
	},

	addCustomObject: function(handler, args) {
		this.obj_list.push({handler: handler, args: args});
		this.redraw();
	},

	removeCustomObject: function(handler, args) {
		for(var key in this.obj_list) {
			if(this.obj_list[key].handler == handler && this.obj_list[key].args == args) {
				delete this.obj_list[key];
				this.redraw();
				return true;
			}
		}
		return false;
	},

	addEventListener: function(type, callback) {
		var _this = this,
			evListener = {
				type: type,
				callback: callback,
				handleEvent: function(e) {
					var coo = getMousePos.call(_this, e);
					callback(coo.x, coo.y, e);
				}
			};

		this.element.addEventListener(type, evListener, true);
		this.listeners.push(evListener);
	},

	removeEventListener: function(type, callback) {
		for(var key in this.listeners) {
			if(this.listeners[key].type == type && this.listeners[key].callback == callback) {
				this.element.removeEventListener(this.listeners[key].type, this.listeners[key], true);
				delete this.listeners[key];
				return true;
			}
		}
		return false;
	},

	getState: function() {
		return {
			objects: WGo.clone(this.obj_arr),
			custom: WGo.clone(this.obj_list)
		};
	},

	restoreState: function(state) {
		this.obj_arr = state.objects || this.obj_arr;
		this.obj_list = state.custom || this.obj_list;

		this.redraw();
	}
}

Board.default = {
	size: 19,
	width: 0,
	height: 0,
	font: "Calibri",
	lineWidth: 1,
	starPoints: {
		19:[{x:3, y:3 },
			{x:9, y:3 },
			{x:15,y:3 },
			{x:3, y:9 },
			{x:9, y:9 },
			{x:15,y:9 },
			{x:3, y:15},
			{x:9, y:15},
			{x:15,y:15}],
		13:[{x:3, y:3},
			{x:9, y:3},
			{x:3, y:9},
			{x:9, y:9}],
		9:[{x:4, y:4}],
	},
	stoneHandler: Board.drawHandlers.NORMAL,
	starSize: 1,
	shadowSize: 1,
	stoneSize: 1,
	section: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	background: WGo.DIR+"wood1.jpg"
}

// save Board
WGo.Board = Board;

//-------- WGo.Game ---------------------------------------------------------------------------

// function for stone capturing
do_capture = function(position, captured, x, y, c) {
	if(x >= 0 && x < position.size && y >= 0 && y < position.size && position.get(x,y) == c) {
		position.set(x,y,0);
		captured.push({x:x, y:y});

		do_capture(position, captured, x, y-1, c);
		do_capture(position, captured, x, y+1, c);
		do_capture(position, captured, x-1, y, c);
		do_capture(position, captured, x+1, y, c);
	}
}

// looking at liberties
check_liberties = function(position, testing, x, y, c) {
	// out of the board there aren't liberties
	if(x < 0 || x >= position.size || y < 0 || y >= position.size) return true;
	// however empty field means liberty
	if(position.get(x,y) == 0) return false;
	// already tested field or stone of enemy isn't giving us a liberty.
	if(testing.get(x,y) == true || position.get(x,y) == -c) return true;

	// set this field as tested
	testing.set(x,y,true);

	// in this case we are checking our stone, if we get 4 trues, it has no liberty
	return 	check_liberties(position, testing, x, y-1, c) &&
			check_liberties(position, testing, x, y+1, c) &&
			check_liberties(position, testing, x-1, y, c) &&
			check_liberties(position, testing, x+1, y, c);
}

// analysing function - modifies original position, if there are some capturing, and returns array of captured stones
check_capturing = function(position, x, y, c) {
	var captured = [];
	// is there a stone possible to capture?
	if(x >= 0 && x < position.size && y >= 0 && y < position.size && position.get(x,y) == c) {
		// create testing map
		var testing = Positions.new(position.gameId);
		// if it has zero liberties capture it
		if(check_liberties(position, testing, x, y, c)) {
			// capture stones from game
			do_capture(position, captured, x, y, c);
		}
	}
	return captured;
}
