(function(){
  function currentBase(){
    var script = document.currentScript || (function(){ var scripts = document.getElementsByTagName("script"); return scripts[scripts.length - 1]; })();
    try { return new URL("/widget.html", script && script.src ? script.src : "https://www.slimewire.org/assets/slimewire/widget.js").href; }
    catch (error) { return "https://www.slimewire.org/widget.html"; }
  }
  var base = currentBase();
  var nodes = document.querySelectorAll("[data-slimewire-widget]");
  for (var i = 0; i < nodes.length; i += 1) {
    var node = nodes[i];
    var params = new URLSearchParams();
    params.set("type", node.getAttribute("data-slimewire-widget") || "scan");
    if (node.getAttribute("data-slimewire-token")) params.set("token", node.getAttribute("data-slimewire-token"));
    if (node.getAttribute("data-slimewire-label")) params.set("label", node.getAttribute("data-slimewire-label"));
    var iframe = document.createElement("iframe");
    iframe.title = node.getAttribute("data-slimewire-title") || "SlimeWire widget";
    iframe.src = base + "?" + params.toString();
    iframe.loading = "lazy";
    iframe.width = "520";
    iframe.height = "86";
    iframe.style.cssText = "width:100%;max-width:520px;height:86px;border:0;display:block;overflow:hidden";
    node.innerHTML = "";
    node.appendChild(iframe);
  }
})();
