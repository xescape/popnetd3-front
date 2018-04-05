/**
 * helper file for various webpage things
 */

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

var helppath = "http://www.compsysbio.org/popnetd3/bin/help1.md"
showMD(document.getElementById('ins1'), helppath)
