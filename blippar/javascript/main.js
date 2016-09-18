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
    var Plane = scene.addSprite().setColor('#ffff00').setScale(500);
	scene.addText('Test3')
		 .setFontSize(72)
		 .setTranslationY(400);
		 
	scene.screen = scene.getChild("Screen");
	scene.leftHotspot = scene.screen.getChild("LeftHotspot");
	scene.rightHotspot = scene.screen.getChild("RightHotspot");

	iconCount = 5; //temp

	var iconPosX = 1;
	var iconPosY = -(2/3) * (sH/2);

	//ICONS 
	scene.icons = getIcons(iconCount);
	scene.currentIconIndex = 1;

	// Adjust position and size of the far end icons
	//scene.icons[0].setTranslationX(-1.7 * iconPosX);//.setScale(sW/12);
	//scene.icons[iconCount-1].setTranslationX( 1.7 * iconPosX);//.setScale(sW/12);;


	// Adjust hotspots position and scale and define their callback function
	scene.leftHotspot.setTranslation(-1.3 * sW/4, iconPosY, 0).setScale(sW/2);
	scene.leftHotspot.onTouchEnd = function(id, x, y) { iconsShift('left'); }
	
	scene.rightHotspot.setTranslation(1.3 * sW/4, iconPosY, 0).setScale(sW/2);
	scene.rightHotspot.onTouchEnd = function(id, x, y) { iconsShift('right'); }
	
	// var logo = scene.addSprite("15.jpg")
	// 				.setName("logo")
	// 				.setTranslation(0, 0, 1);

	// logo.onCreate = function()
	// {
	// 	animateLogo(this);
	// }

	// logo.onTouchEnd = function(id, x, y)
	// {
	//     console.log("Scene on show");
	
	// 	var lat = blipp.getGeo().getLat();
	// 	var lon = blipp.getGeo().getLon(); 

	//     PngWebServiceCall(lat, lon, ParseResult);
	//     console.log("Touched on : " + this.getName());
	// }
}

// scene.onShow = function()
// {
//     console.log("Scene on show");
	
// 	var lat = blipp.getGeo().getLat();
// 	var lon = blipp.getGeo().getLon();
// 	console.log("Our coordinates: lat=" + lat + ", lon=" + lon);

// }

animateLogo = function(node)
{
	var anim = node.animate().translationX(0).rotationZ(3600).scaleX(580).scaleY(580).delay(500).duration(5000);
	anim.interpolate = function(value)
	{
		return Math.sqrt(value);
	}
}

function getIcons(count) {

    var iconPosX = (sW / (count - 1));
	var iconPosY = -(2/3) * (sH/2);
	icons = []
	biggestIconIdx = parseInt(count / 2, 10);
	for (i = 0; i < count; i++) {
		var icon = scene.screen.addText('31'+i)
						.setName("icon_"+i)
						.setRotation(0,0,0)
						.setTranslation(iconPosX * (i-2), iconPosY, 0)
						.setFontSize(24)
						.setCornerRadius(10)
						.setBgColor([1, 0, 0, 1])
						.setTextMargins([20, 5])
						.setScale(3 - (Math.abs(i-biggestIconIdx) / (count-1)));
		
		icons.push(icon);
	}

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

	// Shift the current iconIndex
	if (direction === 'left') {
		scene.currentIconIndex = modulus(scene.currentIconIndex + 1, iconsCount);
	} else {
		scene.currentIconIndex = modulus(scene.currentIconIndex - 1, iconsCount);
	}

	// Rotate the icons array
	var shiftedIcons = arrayRotate(scene.icons, direction);

	// Animate the icons
	var targetIndex   = 0;
	var textureIndex  = 0;
	for (i = 0; i < iconsCount; i++) {
		// Determine the target index
		if (direction === 'left') {
			targetIndex  = modulus (i - 1, iconsCount);
// 			if (targetIndex == (iconsCount - 1)) {
// 				textureIndex = modulus(scene.icons[targetIndex].getActiveTexture() + 1, locationsCount);
// 				scene.icons[i].setActiveTexture(textureIndex);
// 			}
		} else {
			targetIndex  = modulus (i + 1, iconsCount);
// 			if (targetIndex == 0) {
// 				textureIndex = modulus(scene.icons[targetIndex].getActiveTexture() - 1, locationsCount);
// 				scene.icons[i].setActiveTexture(textureIndex);
// 			}
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