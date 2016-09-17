var blipp = require('blippar').blipp;

var scene = blipp.addScene();
var markerW = blipp.getMarker().getWidth();
var markerH = blipp.getMarker().getHeight();

// Scene creation
scene.onCreate = function() {
    var Plane = scene.addSprite().setColor('#ffff00').setScale(500);
	scene.addText('Test1')
		 .setFontSize(72)
		 .setTranslationY(400);    	

}

scene.onShow = function()
{
    console.log("Scene on show");
	
	var logo = scene.addSprite("15.jpg")
					.setName("logo")
					.setTranslation(0, 0, 1);

	logo.onCreate = function()
	{
		animateLogo(this);
	}

	var lat = blipp.getGeo().getLat();
	var lon = blipp.getGeo().getLon();
	console.log("Our coordinates: lat=" + lat + ", lon=" + lon);

}

animateLogo = function(node)
{
	var anim = node.animate().translationX(0).rotationZ(3600).scaleX(580).scaleY(580).delay(500).duration(5000);
	anim.interpolate = function(value)
	{
		return Math.sqrt(value);
	}
}
