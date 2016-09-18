var blipp = require('blippar').blipp;
blipp.read("main.json");

var scene = blipp.getScene();

var markerW = blipp.getMarker().getWidth();
var markerH = blipp.getMarker().getHeight();

var sW    = blipp.getScreenWidth()  * 1.003;
var sH    = blipp.getScreenHeight() * 1.003;

var JsonResult;

// Scene creation
scene.onCreate = function()  {
	var lat = blipp.getGeo().getLat();
	var lon = blipp.getGeo().getLon(); 

	PngWebServiceCall(lat, lon, createScene);
}

createScene = function(data) {
	scene.screen = scene.getChild("Screen");
	scene.leftHotspot = scene.screen.getChild("LeftHotspot");
	scene.rightHotspot = scene.screen.getChild("RightHotspot");

	scene.data = data;
	console.log(data[0].name);
	iconCount = 5; //temp

	var iconPosX = 1;
	var iconPosY = -(2/3) * (sH/2);

	//ICONS 
	scene.icons = getIcons(data);

	// Adjust hotspots position and scale and define their callback function
	scene.leftHotspot.setTranslation(-1.3 * sW/4, iconPosY, 0).setScale(sW/2);
	scene.leftHotspot.onTouchEnd = function(id, x, y) { iconsShift('left'); }
	
	scene.rightHotspot.setTranslation(1.3 * sW/4, iconPosY, 0).setScale(sW/2);
	scene.rightHotspot.onTouchEnd = function(id, x, y) { iconsShift('right'); }

	updateSchedule();
}

function getIcons(data) {
	var count = data.length;
	
    var iconPosX = (sW / (count - 1));
	var iconPosY = -(2/3) * (sH/2);
	icons = []
	biggestIconIdx = parseInt(count / 2, 10);
	for (i = 0; i < data.length; i++) {
		var icon = buildIcon(data[i].name, data[i].route_color)
					.setRotation(0,0,0)
					.setTranslation(iconPosX * (i-17) + i*250, iconPosY, 0)
					.setScale(3 - (Math.abs(i-biggestIconIdx) / (count-1)));
		
		icons.push(icon);
		scene.screen.addChild(icon);
	}

	scene.currentIconIndex = biggestIconIdx;

	return icons;
}

function iconsShift(direction) {
	var iconsCount      = scene.icons.length;
	var animDuration    = 300;

	// Bailout if in the middle of an animation
	if (!scene.leftHotspot.getClickable() || !scene.rightHotspot.getClickable()) {
		return;
	}

	// Lock the sensors during animation
	scene.leftHotspot.setClickable(false);
	scene.rightHotspot.setClickable(false);

	// Rotate the icons array
	var shiftedIcons = arrayRotate(scene.icons, direction);

	// Animate the icons
	var targetIndex   = 0;
	var textureIndex  = 0;
	for (i = 0; i < iconsCount; i++) {
		// Determine the target index
		if (direction === 'left') {
			targetIndex  = modulus (i - 1, iconsCount);
		} else {
			targetIndex  = modulus (i + 1, iconsCount);
		}

		// Animate the icon position, scale and alpha
		var anim = scene.icons[i].animate();
		anim.translation(scene.icons[targetIndex].getTranslation())
			.scale(scene.icons[targetIndex].getScale())
		    .alpha(scene.icons[targetIndex].getAlpha())
		    .duration(animDuration);
	}

	// Update the icons array
	scene.icons = shiftedIcons;
	
	updateSchedule();

	// Unlock the sensors
	scene.animate().delay(animDuration).onEnd = function() {
		scene.leftHotspot.setClickable(true);
		scene.rightHotspot.setClickable(true);
	}
}

function modulus(x, y) {
	return ((x % y) + y) % y;
}

function arrayRotate(array, direction) {
	array = array.slice();
	if (direction === 'left') {
    	array.push(array.shift());
  	} else {
  		array.unshift(array.pop());
  	}
  	return array;
}

function updateSchedule() {

	if(scene.getChild("schedule"))
		scene.getChild("schedule").destroy();

	var currentIcon = scene.icons[scene.currentIconIndex];
	var currentText = currentIcon.getText();

	buildSchedule(currentText)
}

function buildSchedule(key) {

	var scheduleItem;
	for (var i = 0; i < scene.data.length; i++) {
		if (scene.data[i].name === key) {
			scheduleItem = scene.data[i];
			break;
		}
	}

	var schedule = scene.addChild("Node", "schedule");
	for (var i = 0; i < scheduleItem.times.length; i++) {
		var icon = buildIcon(scheduleItem.times[i].route_short_name, scheduleItem.times[i].route_color);
		icon.setTranslation(-sW/4, sH/2 - 300 * (i+1));
		var text = buildIcon(scheduleItem.times[i].arrival_time, scheduleItem.times[i].route_color);
		text.setTranslation(-sW/4 + 600, sH/2 - 300 * (i+1));
		text.setBgColor([1,1,1,0.7]);
		schedule.addChild(icon);
		schedule.addChild(text);
	}
}

function buildIcon(text, color) {
	console.log(text);
	var color = hexToRgb("#"+color);
	var icon = new Blippar.Text();
	icon.setName(text)
		.setText(text)
		.setRotation(0,0,0)
		.setFontSize(24)
		.setCornerRadius(10)
		.setBgColor([color.r, color.g, color.b, 1])
		.setTextMargins([20, 5])
		.setScale(3);

	return icon;
}

PngWebServiceCall = function(lat, lon, callback) {
	var date = new Date();
	console.log("Current time: " + 	hhmmss(date));
	blipp.downloadAssets('https://api.scriptrapps.io/getByLocation.png?lat=' + lat + '&lon=' + lon,// + '&time=' + hhmmss(date),
	['getByLocation.png'],
	'get',
	function (status, info) {
		loaded = true;
		if (status == 'OK') {
			console.log('Download Done');
			var json = blipp.loadJson('getByLocation.png', true);
			console.log("JSON: " + json);
			ParseResult(json, callback);
		} else {
			console.log('Loaded ' + info + ' %');
		}
	},
	['Authorization', 'bearer QzFGN0ZEMTQ4MjpzY3JpcHRyOkUyNDlBQjJGQTgzREUyMzNCRjVCODg2RDg1NzQ4NzRF'],
	 true);	
}

ParseResult = function(json, callback) {
	console.log(json.response.metadata.scriptLog[0].message);
	callback(json.response.result.data);
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16)/255,
        g: parseInt(result[2], 16)/255,
        b: parseInt(result[3], 16)/255
    } : null;
}

function hhmmss(d) {
    hours = format_two_digits(d.getHours());
    minutes = format_two_digits(d.getMinutes());
    seconds = format_two_digits(d.getSeconds());
    return hours + "-" + minutes + "-" + seconds;
}

function format_two_digits(n) {
    return n < 10 ? '0' + n : n;
}
