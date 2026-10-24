const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    mainNav.classList.toggle("is-open", !isOpen);
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    });
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

const foodCarousel = document.querySelector("[data-food-carousel]");
if (foodCarousel) {
  const track = foodCarousel.querySelector(".food-carousel-track");
  const slides = [...foodCarousel.querySelectorAll("[data-food-slide]")];
  const dots = foodCarousel.querySelector(".food-carousel-dots");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentSlide = 0;
  let timer;

  foodCarousel.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });

  const goToSlide = (index) => {
    currentSlide = (index + slides.length) % slides.length;
    [...dots.children].forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentSlide);
      dot.setAttribute("aria-current", dotIndex === currentSlide ? "true" : "false");
    });
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentSlide);
      slide.setAttribute("aria-hidden", String(slideIndex !== currentSlide));
    });
  };
  const startCarousel = () => {
    if (reduceMotion) return;
    clearInterval(timer);
    timer = window.setInterval(() => goToSlide(currentSlide + 1), 5500);
  };

  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show food collage ${index + 1}`);
    dot.addEventListener("click", () => { goToSlide(index); startCarousel(); });
    dots.append(dot);
    slide.setAttribute("aria-hidden", String(index !== 0));
  });
  foodCarousel.querySelector(".food-carousel-prev").addEventListener("click", () => { goToSlide(currentSlide - 1); startCarousel(); });
  foodCarousel.querySelector(".food-carousel-next").addEventListener("click", () => { goToSlide(currentSlide + 1); startCarousel(); });
  foodCarousel.addEventListener("mouseenter", () => clearInterval(timer));
  foodCarousel.addEventListener("mouseleave", startCarousel);
  foodCarousel.addEventListener("focusin", () => clearInterval(timer));
  foodCarousel.addEventListener("focusout", startCarousel);
  goToSlide(0);
  startCarousel();
}

const progress = document.querySelector(".scroll-progress span");
let scrollFrame = 0;
function updateScrollEffects() {
  scrollFrame = 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.width = `${maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0}%`;

  document.querySelectorAll("[data-parallax]").forEach((element) => {
    const amount = Number(element.getAttribute("data-parallax"));
    if (!Number.isFinite(amount)) return;
    const offset = (element.getBoundingClientRect().top - window.innerHeight / 2) * amount;
    element.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
  });
}

window.addEventListener("scroll", () => {
  if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollEffects);
}, { passive: true });
window.addEventListener("resize", updateScrollEffects);
updateScrollEffects();

const revealItems = [...document.querySelectorAll("[data-reveal]")];
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const counters = [...document.querySelectorAll("[data-count]")];
function animateCounter(element) {
  const target = Number(element.getAttribute("data-count"));
  if (!Number.isFinite(target)) return;
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) window.requestAnimationFrame(tick);
  }
  window.requestAnimationFrame(tick);
}

if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  counters.forEach((counter) => counterObserver.observe(counter));
}

const menuLib = window.LunchLuxeMenu;
if (menuLib) {
  const enquiryButton = document.querySelector("[data-menu-enquiry]");
  let selectedTier = "premium";
  let selectedAddons = [];

  const updateEnquiry = () => {
    if (!enquiryButton) return;
    const tierLabel = menuLib.tiers[selectedTier].label;
    const lines = [
      `Hi LunchLuxe, I'm interested in the ${tierLabel} plan.`,
      ...menuLib.addonMessageLines(selectedAddons),
      "Please confirm current pricing, the weekly menu and delivery availability for my area.",
    ];
    enquiryButton.href = menuLib.whatsappHref(lines.join("\n"));
    enquiryButton.target = "_blank";
    enquiryButton.rel = "noopener";
    const count = selectedAddons.reduce((sum, item) => sum + item.qty, 0);
    enquiryButton.firstChild.textContent = count
      ? `Enquire: ${tierLabel} plan + ${count} add-on${count > 1 ? "s" : ""} `
      : `Enquire: ${tierLabel} plan `;
  };

  menuLib.mountWeeklyMenu(document.querySelector("[data-weekly-menu]"), {
    tier: selectedTier,
    showTierTabs: true,
    onTierChange: (tier) => {
      selectedTier = tier;
      updateEnquiry();
    },
  });

  menuLib.mountAddons(document.querySelector("[data-addons]"), {
    summary: document.querySelector("[data-addon-summary]"),
    onChange: (selection) => {
      selectedAddons = selection;
      updateEnquiry();
    },
  });
}
