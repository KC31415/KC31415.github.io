// Light/dark toggle. Default follows the OS setting; a click saves the choice.
(function () {
  var root = document.documentElement;
  var btn = document.querySelector(".theme-toggle");
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function current() {
    return root.dataset.theme || (mq.matches ? "dark" : "light");
  }
  function label() {
    if (btn) btn.setAttribute("aria-label", current() === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  if (btn) {
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
    });
  }
  label();

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
