function draw(){
	console.log('one request from browser')
	var canvas = document.getElementById('canv')
	var ctx = canvas.getContext('2d')
	var img = new Image()
	img.onload = function(){ ctx.drawImage(img, 0, 0) }
	img.src = './c/data3/ME49.png'
}