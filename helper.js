/**
 * helper file for various webpage things
 */



//var helppath = "http:www.compsysbio.org/popnet/bin/help1.md"
var helppath = "/bin/help1.md"
var subhelppath = "/bin/subhelp.md"
showMD(document.getElementById('ins1'), helppath)
showMD(document.getElementById('sub_ins'), subhelppath)

document.getElementById("graph_tab_button").addEventListener('click', shrinkBanner)
document.getElementById("config_tab_button").addEventListener('click', growBanner)
document.getElementById("landing_tab_button").addEventListener('click', growBanner)

function showMD(e, file)
{
    var request = new XMLHttpRequest();
    var allText;
    request.open("GET", file, true);
    request.onreadystatechange = function ()
    {
        test = request.responseText;
        e.innerHTML = markdown.toHTML(test)
//        console.log(e)

    }
    request.send(null);
}

function shrinkBanner(){
	document.getElementById("header").style.height = "50px"
}

function growBanner(){
	document.getElementById("header").style.height = "150px"
}