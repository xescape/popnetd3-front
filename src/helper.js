/**
 * helper file for various webpage things
 */

var helppath = "./bin/help1.md";
var subhelppath = "./bin/subhelp.md";
var tutpath = "./bin/tutorial.md";
var banner_size = "L";

showMD(document.getElementById("ins1"), helppath);
showMD(document.getElementById("sub_ins"), subhelppath);
showMD(document.getElementById("tutorial"), tutpath);

document
  .getElementById("graph_tab_button")
  .addEventListener("click", shrinkBanner);
document
  .getElementById("config_tab_button")
  .addEventListener("click", growBanner);
document
  .getElementById("landing_tab_button")
  .addEventListener("click", growBanner);
document
  .getElementById("tutorial_tab_button")
  .addEventListener("click", growBanner);

document
  .getElementById("graph_tab_button")
  .addEventListener("click", resize_container);
document
  .getElementById("config_tab_button")
  .addEventListener("click", resize_container);
document
  .getElementById("landing_tab_button")
  .addEventListener("click", resize_container);
document
  .getElementById("tutorial_tab_button")
  .addEventListener("click", resize_container);

function showMD(e, file) {
  var request = new XMLHttpRequest();
  request.open("GET", file, true);
  request.onreadystatechange = function () {
    if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
      var text = request.responseText;
      var temp = document.createElement("p");
      temp.innerHTML = markdown.toHTML(text);
      e.appendChild(temp);
    }
  };
  request.send(null);
}

function shrinkBanner() {
  if (banner_size === "L") {
    document.getElementById("header").style.height = "50px";
    banner_size = "S";
  }
}

function growBanner() {
  if (banner_size === "S") {
    document.getElementById("header").style.height = "150px";
    banner_size = "L";
  }
}

function resize_container() {
  sizes = {
    landing_tab_button: "1550px",
    config_tab_button: "800px",
    graph_tab_button: "900px",
    tutorial_tab_button: "3100px",
  };
  document.getElementById("viewport").style.height = sizes[this.id];
}
