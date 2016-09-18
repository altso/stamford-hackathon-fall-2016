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

	var logo = scene.addSprite("15.jpg")
					.setName("logo")
					.setTranslation(0, 0, 1);

	logo.onCreate = function()
	{
		animateLogo(this);
	}

	logo.onTouchEnd = function(id, x, y)
	{
    	PngWebServiceCall(Math.round(Math.random() * 10) + 1, ParseResult);
	    console.log("Touched on : " + this.getName());
	}
}

scene.onShow = function()
{
    console.log("Scene on show");
	
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

PngWebServiceCall = function(value, callback) {
	blipp.downloadAssets('https://api.scriptrapps.io/test.png?value=' + value,
	['test.png'],
	'get',
	function (status, info) {
		loaded = true;
		if (status == 'OK') {
			console.log('Download Done');
			var json = blipp.loadJson('test.png', true);
			console.log("JSON: " + json);
			console.log(json.response.result.data);
			callback(json);
		} else {
			console.log('Loaded ' + info + ' %');
		}
	},
	['Authorization', 'bearer UDc4QTA0NTdDMDpzY3JpcHRyOjk3RjU1MTFCRUUwMDQ0RTk0OUU1NEIwMUJBQjE0ODJE'],
	 true);	
}

ParseResult = function(json) {
	scene.addText(json.response.result.data)
		 .setFontSize(72)
		 .setTranslationY(-500);  	
} 
