//has code for the upload page. should be decoupled from the other pages.

document.getElementById("submit").addEventListener("click", submit, false);

function submit(){	
	var config = new FormData(),
		ival = document.getElementById("ival").value,
		pival = document.getElementById("pival").value,
		sl = document.getElementById("sl").value

	config.append('format', document.getElementById("input").value)
	config.append('reference', document.getElementById("reference").value)
	config.append('ival', document.getElementById("ival").value)
	config.append('pival', document.getElementById("pival").value)
	config.append('sl', document.getElementById("sl").value)
	config.append('email', document.getElementById("email").value)
	
	try{
		config.append('file', document.getElementById("uploadBtn").files[0], document.getElementById("uploadBtn").files[0].name)
	}
	catch(err){
		config.append('file', "")
	}
	
	console.log(Array.from(config.entries))
	if(validateForm(config)){
		
        var request = new XMLHttpRequest();
        showUploadBar()
        request.open('POST', url + "/data/run")
		request.onreadystatechange = function(){
			if(request.readyState == XMLHttpRequest.DONE && request.status == 200){
                uploadSuccess()
			}
        }
        request.timeout = 60000
        request.ontimeout = function(){
            uploadFail()
        }
		request.send(config)
	}
}

function uploadSuccess(){
    removeUploadBar()
	alert('Your job has been received. Please wait for an email response when it is completed.')
}

function uploadFail(){
    removeUploadBar()
    alert('Upload failed. If you continue to experience this error, please contact popnetd3@gmail.com.')
}

function validateForm(form){
	
	//make sure no empty fields
	for(let pair of form){
		if(pair[1] === ""){
			alert(pair[0] + ' is empty. Please fill in all fields.')
			return false
		}
	}
	
	//make sure numbers are numbers
	for(let i of ['ival', 'pival', 'sl']){
		if(isNaN(parseInt(form.get(i)))){
			alert(i + ' is not a number.')
			return false
		}
	}
	
	//make sure params are within range.
	if(!(18 >= parseInt(form.get('ival')) >= 1 && 4 >= parseInt(form.get('pival')) >= 1 && parseInt(form.get('sl')) > 0)){ 
		alert("Please set appropriate cluster parameters according to tooltip.")
		return false
	}
	
	return true
}


function showUploadBar(){
	var parent = document.getElementById("container")

	//greycover
	var d = document.createElement("div")
	d.id = 'greycover'
	d.className = 'greycover'
	
	// d.style.height = `${parent.clientHeight}px`
	parent.appendChild(d)

	//loadingbox
	var d = document.createElement("div")
    d.id = 'loadingbox'
    d.classList.add("mdl-card")
    d.classList.add("mdl-shadow--2dp")
    
    //text
    var t = document.createElement("div")
    t.classList.add("mdl-card__title")
    t.appendChild(document.createTextNode("Uploading Data..."))
    componentHandler.upgradeElement(t)
    d.appendChild(t)
    
	//progress bar
	var l = document.createElement("div")
	l.classList.add("mdl-progress")
	l.classList.add("mdl-js-progress")
    l.classList.add("mdl-progress__indeterminate")
    componentHandler.upgradeElement(l)
	d.appendChild(l)

    componentHandler.upgradeElement(d)
	parent.appendChild(d)
}

function removeUploadBar(){
	var parent = document.getElementById("container")
	
	//remove the loadingbox
	parent.removeChild(document.getElementById("greycover"))
	parent.removeChild(document.getElementById("loadingbox"))
}