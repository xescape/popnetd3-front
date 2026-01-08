//has code for the upload page. should be decoupled from the other pages.

document.getElementById("submit").addEventListener("click", submit, false);
document.getElementById("autogroup").addEventListener("change", modIVal);

function modIVal() {
  var source = document.getElementById("autogroup");
  var i = document.getElementById("ival");
  var pi = document.getElementById("pival");
  if (source.value === "True") {
    i.disabled = true;
    pi.disabled = true;
  } else {
    i.disabled = false;
    pi.disabled = false;
  }
}

function submit() {
  var config = new FormData(),
    ival = document.getElementById("ival").value,
    pival = document.getElementById("pival").value,
    sl = document.getElementById("sl").value;

  config.append("format", document.getElementById("input").value);
  config.append("reference", document.getElementById("reference").value);
  config.append("autogroup", document.getElementById("autogroup").value);
  config.append("ival", document.getElementById("ival").value);
  config.append("pival", document.getElementById("pival").value);
  config.append("sl", document.getElementById("sl").value);
  config.append("email", document.getElementById("email").value);

  try {
    config.append(
      "file",
      document.getElementById("uploadBtn").files[0],
      document.getElementById("uploadBtn").files[0].name
    );
  } catch (err) {
    config.append("file", "");
  }

  console.log(Array.from(config.entries));
  if (validateForm(config)) {
    var request = new XMLHttpRequest();
    showUploadBar();
    request.open("POST", url + "/data/run");
    request.onreadystatechange = function () {
      if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
        uploadSuccess();
      } else if (request.status != 200) {
        uploadFail();
      }
    };
    request.timeout = 600000;
    request.ontimeout = function () {
      uploadTimeOut();
    };
    request.send(config);
  }
}

function uploadSuccess() {
  removeUploadBar();
  alert(
    "Your job has been received. Please wait for an email response when it is completed."
  );
}

function uploadFail() {
  removeUploadBar();
  alert(
    "Upload failed. If you continue to experience this error, please contact popnetd3@gmail.com."
  );
}

function uploadTimeOut() {
  removeUploadBar();
  alert(
    "Upload exceeded time limit. If you have a large dataset, please contact popnetd3@gmail.com."
  );
}

function validateForm(form) {
  //make sure no empty fields, unless we're autogrouping, then ival and pival can be empty
  var exempt;
  if (form.get("autogroup") === "True") {
    exempt = ["ival", "pival"];
  } else {
    exempt = [];
  }

  for (let pair of form) {
    if (pair[1] === "" && !exempt.includes(pair[0])) {
      alert(pair[0] + " is empty. Please fill in all fields.");
      return false;
    }
  }

  //check ival and pival if not autogrouping
  if (!form.get("autogroup") === "True") {
    for (let i of ["ival", "pival"]) {
      if (isNaN(parseInt(form.get(i)))) {
        alert(i + " is not a number.");
        return false;
      }
    }

    //make sure params are within range.
    if (
      !(
        18 >= parseInt(form.get("ival")) > 0 &&
        4 >= parseInt(form.get("pival")) > 0
      )
    ) {
      alert("Please set appropriate cluster parameters according to tooltip.");
      return false;
    }
  }

  var sl = form.get("sl");
  if (isNaN(parseInt(sl)) || parseInt(sl) < 1) {
    alert("Section length must be greater than 0");
    return false;
  }

  return true;
}

function showUploadBar() {
  var parent = document.getElementById("container");

  //greycover
  var d = document.createElement("div");
  d.id = "greycover";
  d.className = "greycover";

  // d.style.height = `${parent.clientHeight}px`
  parent.appendChild(d);

  //loadingbox
  var d = document.createElement("div");
  d.id = "loadingbox";
  d.classList.add("mdl-card");
  d.classList.add("mdl-shadow--2dp");

  //text
  var t = document.createElement("div");
  t.classList.add("mdl-card__title");
  t.appendChild(document.createTextNode("Uploading Data..."));
  componentHandler.upgradeElement(t);
  d.appendChild(t);

  //progress bar
  var l = document.createElement("div");
  l.classList.add("mdl-progress");
  l.classList.add("mdl-js-progress");
  l.classList.add("mdl-progress__indeterminate");
  componentHandler.upgradeElement(l);
  d.appendChild(l);

  componentHandler.upgradeElement(d);
  parent.appendChild(d);
}

function removeUploadBar() {
  var parent = document.getElementById("container");

  //remove the loadingbox
  parent.removeChild(document.getElementById("greycover"));
  parent.removeChild(document.getElementById("loadingbox"));
}
