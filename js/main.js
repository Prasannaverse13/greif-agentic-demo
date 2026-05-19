/**
 * Greif.com clone — navigation, hero slider, mobile menu
 */
(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector(".main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      mainNav.classList.toggle("is-open");
    });

    document.addEventListener("click", function (event) {
      if (
        mainNav.classList.contains("is-open") &&
        !mainNav.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {
        navToggle.setAttribute("aria-expanded", "false");
        mainNav.classList.remove("is-open");
      }
    });
  }

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a[data-nav]").forEach(function (link) {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });

  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");
  const prevBtn = document.querySelector(".hero-arrow--prev");
  const nextBtn = document.querySelector(".hero-arrow--next");
  let current = 0;
  let timer;

  function goTo(index) {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === current);
    });
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(function () {
      goTo(current + 1);
    }, 7000);
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
  }

  if (slides.length) {
    goTo(0);
    startAutoplay();

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        goTo(current - 1);
        startAutoplay();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        goTo(current + 1);
        startAutoplay();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        goTo(i);
        startAutoplay();
      });
    });

    const slider = document.querySelector(".hero-slider");
    if (slider) {
      slider.addEventListener("mouseenter", stopAutoplay);
      slider.addEventListener("mouseleave", startAutoplay);
    }
  }
})();
