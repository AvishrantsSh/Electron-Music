function snack(text = "") {
    var x = document.getElementById("snackbar");
    if (text != "") x.textContent = text
    x.className = "show";
    setTimeout(function() { x.className = x.className.replace("show", ""); }, 3000);
}