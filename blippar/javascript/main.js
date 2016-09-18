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

createScene = function(json) {
	scene.screen = scene.getChild("Screen");
	scene.leftHotspot = scene.screen.getChild("LeftHotspot");
	scene.rightHotspot = scene.screen.getChild("RightHotspot");

	iconCount = 5; //temp

	var iconPosX = 1;
	var iconPosY = -(2/3) * (sH/2);

	//ICONS 
	scene.icons = getIcons(iconCount);

	// Adjust hotspots position and scale and define their callback function
	scene.leftHotspot.setTranslation(-1.3 * sW/4, iconPosY, 0).setScale(sW/2);
	scene.leftHotspot.onTouchEnd = function(id, x, y) { iconsShift('left'); }
	
	scene.rightHotspot.setTranslation(1.3 * sW/4, iconPosY, 0).setScale(sW/2);
	scene.rightHotspot.onTouchEnd = function(id, x, y) { iconsShift('right'); }
}

function getIcons(count) {

    var iconPosX = (sW / (count - 1));
	var iconPosY = -(2/3) * (sH/2);
	icons = []
	biggestIconIdx = parseInt(count / 2, 10);
	for (i = 0; i < count; i++) {
		var name = '31'+i;
		var icon = scene.screen.addText(name)
						.setName(name)
						.setRotation(0,0,0)
						.setTranslation(iconPosX * (i-2), iconPosY, 0)
						.setFontSize(24)
						.setCornerRadius(10)
						.setBgColor([1, 0, 0, 1])
						.setTextMargins([20, 5])
						.setScale(3 - (Math.abs(i-biggestIconIdx) / (count-1)));
		
		icons.push(icon);
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
	
	// DO STUFF HERE
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

	var schedule = scene.addChild("Node", "schedule");
	var icon = copyIcon(currentIcon);
	icon.setTranslation(-sW/4, sH/4);
	var text = copyIcon(currentIcon);
	text.setText("Timings for " + icon.getText());
	text.setTranslation(-sW/4 + 600, sH/4);
	text.setBgColor([1,1,1,0.7]);
	schedule.addChild(icon);
	schedule.addChild(text);
}

function copyIcon(icon) {

	var copy = new Blippar.Text();
	copy.setName("schedule_"+icon.getName())
		.setText(icon.getText())
		.setRotation(0,0,0)
		.setFontSize(icon.getFontSize())
		.setCornerRadius(icon.getCornerRadius())
		.setBgColor(icon.getBgColor())
		.setTextMargins(icon.getTextMargins())
		.setScale(3);

	return copy;
}

PngWebServiceCall = function(lat, lon, callback) {
	blipp.downloadAssets('https://api.scriptrapps.io/getByLocation.png?lat=' + lat + '&lon=' + lon,
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
	callback(json);
}

function hexToRgb(hex) {
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return [r,g,b, 1];
}
