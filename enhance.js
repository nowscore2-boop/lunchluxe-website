(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  // Light up highlighted key points as they scroll into view
  const marks = [...document.querySelectorAll("mark.hl, .section-head")];
  if ("IntersectionObserver" in window && !reduceMotion) {
    const markObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target;
        target.classList.add(target.matches("mark") ? "is-lit" : "is-visible");
        observer.unobserve(target);
      });
    }, { threshold: 0.6 });
    marks.forEach((mark) => markObserver.observe(mark));
  } else {
    marks.forEach((mark) => mark.classList.add(mark.matches("mark") ? "is-lit" : "is-visible"));
  }

  // Draw the "how it works" path once visible
  const steps = document.querySelector(".steps");
  if (steps && "IntersectionObserver" in window) {
    new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      steps.classList.add("is-drawn");
      observer.disconnect();
    }, { threshold: 0.3 }).observe(steps);
  } else if (steps) {
    steps.classList.add("is-drawn");
  }

  // Scroll-driven timeline fill, active moment and back-to-top button
  const timeline = document.querySelector(".timeline");
  const moments = [...document.querySelectorAll(".moment")];
  const toTop = document.createElement("button");
  toTop.className = "to-top";
  toTop.type = "button";
  toTop.setAttribute("aria-label", "Back to top");
  toTop.textContent = "↑";
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
  document.body.append(toTop);

  let frame = 0;
  function onScroll() {
    frame = 0;
    toTop.classList.toggle("is-shown", window.scrollY > 700);
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const middle = window.innerHeight * 0.6;
    const pct = Math.min(Math.max((middle - rect.top) / rect.height, 0), 1);
    timeline.style.setProperty("--timeline", `${(pct * 100).toFixed(1)}%`);
    moments.forEach((moment) => {
      const box = moment.getBoundingClientRect();
      moment.classList.toggle("is-active", box.top < middle && box.bottom > middle - 120);
    });
  }
  window.addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  // Activate nav link for the section in view
  const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((section) => navObserver.observe(section));
  }

  if (reduceMotion) return;

  // 3D tilt + spotlight for plan cards
  if (finePointer) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointerenter", () => { card.style.transition = "transform .15s ease-out, box-shadow .3s, opacity .8s, filter .8s"; });
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 9}deg) translateY(-6px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transition = "transform .5s cubic-bezier(.2,.7,.2,1), box-shadow .3s";
        card.style.transform = "";
      });
    });

    // Subtle magnetic pull on primary CTAs
    document.querySelectorAll(".hero-ctas .button, .cta-card .button").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        button.style.transform = `translate(${dx * 0.15}px, ${dy * 0.25}px)`;
      });
      button.addEventListener("pointerleave", () => { button.style.transform = ""; });
    });
  }

  // Floating food particles in the hero
  const hero = document.querySelector(".hero");
  if (hero) {
    const layer = document.createElement("div");
    layer.className = "hero-particles";
    layer.setAttribute("aria-hidden", "true");
    const icons = ["🌿", "🍃", "🌶️", "🍋", "🥕", "🌿", "🍅", "🍃"];
    icons.forEach((icon, index) => {
      const particle = document.createElement("span");
      particle.textContent = icon;
      particle.style.left = `${5 + index * 12 + Math.random() * 6}%`;
      particle.style.animationDelay = `${index * -1.8}s`;
      particle.style.animationDuration = `${12 + Math.random() * 8}s`;
      particle.style.fontSize = `${14 + Math.random() * 12}px`;
      layer.append(particle);
    });
    hero.prepend(layer);
  }
})();
