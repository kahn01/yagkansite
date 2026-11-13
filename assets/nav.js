/* YAĞKAN navigation controller — isolated from the main site script */
(function () {
  'use strict';
  if (window.__yagkanNavReady) return;
  window.__yagkanNavReady = true;

  function closeAll(except) {
    document.querySelectorAll('.site-nav .nav-toggle[aria-expanded="true"]').forEach(function (button) {
      if (button === except) return;
      button.setAttribute('aria-expanded', 'false');
      var id = button.getAttribute('aria-controls');
      var menu = id ? document.getElementById(id) : button.parentElement.querySelector('.site-links');
      if (menu) menu.classList.remove('is-open');
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('.site-nav .nav-toggle');
    if (button) {
      event.preventDefault();
      var id = button.getAttribute('aria-controls');
      var menu = id ? document.getElementById(id) : button.parentElement.querySelector('.site-links');
      if (!menu) return;
      var willOpen = button.getAttribute('aria-expanded') !== 'true';
      closeAll(button);
      button.setAttribute('aria-expanded', String(willOpen));
      menu.classList.toggle('is-open', willOpen);
      return;
    }

    var link = event.target.closest && event.target.closest('.site-nav .site-links a');
    if (link) {
      closeAll();
      return;
    }

    if (!event.target.closest || !event.target.closest('.site-nav')) closeAll();
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeAll();
      var button = document.querySelector('.site-nav .nav-toggle');
      if (button) button.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 760) closeAll();
  }, { passive: true });
})();