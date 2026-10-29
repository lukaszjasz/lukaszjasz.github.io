const body = document.body;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const faqButtons = [...document.querySelectorAll(".faq-question")];
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const sections = [...document.querySelectorAll("main section[id]")];
const accentOnlyItems = [...document.querySelectorAll(".metric-card, .timeline__item")];
const opinionButtons = [...document.querySelectorAll(".opinion-card")];
const opinionCardWraps = [...document.querySelectorAll(".opinion-card-wrap")];
const opinionGallery = document.querySelector(".opinion-gallery");
const opinionGalleryStatus = document.querySelector(".opinion-gallery__status");
const opinionGalleryPrev = document.querySelector("[data-opinion-gallery-prev]");
const opinionGalleryNext = document.querySelector("[data-opinion-gallery-next]");
const opinionLightbox = document.querySelector(".opinion-lightbox");
const opinionLightboxImage = opinionLightbox?.querySelector(".opinion-lightbox__image");
const opinionLightboxCaption = opinionLightbox?.querySelector(".opinion-lightbox__caption");
const opinionLightboxCounter = opinionLightbox?.querySelector(".opinion-lightbox__counter");
const opinionLightboxCloseButtons = [
  ...document.querySelectorAll("[data-opinion-close]"),
];
const opinionLightboxPrev = opinionLightbox?.querySelector("[data-opinion-prev]");
const opinionLightboxNext = opinionLightbox?.querySelector("[data-opinion-next]");
const contactOpenButtons = [...document.querySelectorAll("[data-contact-open]")];
const contactChooser = document.querySelector(".contact-chooser");
const contactChooserCloseButtons = [...document.querySelectorAll("[data-contact-close]")];
const contactChooserLinks = [...document.querySelectorAll(".contact-chooser__card")];
const currentYear = document.getElementById("currentYear");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coachingPicker = document.querySelector(".coaching-picker");
const coachingForm = coachingPicker?.querySelector("form");
const coachingSteps = [...(coachingPicker?.querySelectorAll("[data-coaching-step]") || [])];
const coachingResult = coachingPicker?.querySelector("[data-coaching-result]");
const coachingIntro = coachingPicker?.querySelector("[data-coaching-intro]");
const coachingBack = coachingPicker?.querySelector("[data-coaching-back]");
const coachingNext = coachingPicker?.querySelector("[data-coaching-next]");
const coachingStorageKey = "jasza-coaching-picker-seen-v1";
const coachingCooldown = 7 * 24 * 60 * 60 * 1000;
let coachingStep = 0;
let coachingAutoTimer;
let coachingSeenThisVisit = false;
let coachingReturnFocus;
const accentTargetSelector = [
  ".section-tag",
  ".panel-card__tag",
  ".audience-highlight__label",
  ".metric-card__value",
  ".timeline__year",
  ".step-card__index",
  ".pricing-card__badge",
  ".hero-glimpse__badge",
  ".transform-gallery__badge",
  ".benefits-list li",
  ".check-list li",
  ".pricing-list li",
].join(", ");
const accentQueuedTargets = new WeakSet();
let activeOpinionIndex = 0;
let activeOpinionGalleryIndex = 0;

const collectAccentTargets = (container) => {
  const targets = [...container.querySelectorAll(accentTargetSelector)];

  if (container.matches(accentTargetSelector)) {
    targets.unshift(container);
  }

  return [...new Set(targets)];
};

const activateAccentSequence = (container) => {
  const accentTargets = collectAccentTargets(container);

  if (!accentTargets.length) {
    return;
  }

  let sequenceIndex = 0;

  accentTargets.forEach((target) => {
    if (accentQueuedTargets.has(target)) {
      return;
    }

    accentQueuedTargets.add(target);
    target.classList.add("scroll-accent");

    const delay = prefersReducedMotion.matches ? 0 : sequenceIndex * 170;
    window.setTimeout(() => {
      target.classList.add("is-accent-visible");
    }, delay);

    sequenceIndex += 1;
  });
};

const isOpinionLightboxOpen = () =>
  Boolean(opinionLightbox && !opinionLightbox.hidden);

const isContactChooserOpen = () =>
  Boolean(contactChooser && !contactChooser.hidden);

const setOpinionGalleryStatus = (index = activeOpinionGalleryIndex) => {
  if (!opinionGalleryStatus || !opinionCardWraps.length) {
    return;
  }

  activeOpinionGalleryIndex =
    (index + opinionCardWraps.length) % opinionCardWraps.length;
  opinionGalleryStatus.textContent = `${activeOpinionGalleryIndex + 1} / ${opinionCardWraps.length}`;
};

const syncOpinionGalleryIndex = () => {
  if (!opinionGallery || !opinionCardWraps.length || window.innerWidth >= 720) {
    return;
  }

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  const galleryStart = opinionGallery.scrollLeft;

  opinionCardWraps.forEach((item, index) => {
    const distance = Math.abs(item.offsetLeft - galleryStart);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  setOpinionGalleryStatus(closestIndex);
};

const scrollOpinionGalleryToIndex = (index) => {
  if (!opinionGallery || !opinionCardWraps.length || window.innerWidth >= 720) {
    return;
  }

  const total = opinionCardWraps.length;
  const nextIndex = (index + total) % total;
  activeOpinionGalleryIndex = nextIndex;
  opinionCardWraps[nextIndex].scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "nearest",
    inline: "start",
  });
  setOpinionGalleryStatus(nextIndex);
};

const setOpinionSlide = (index) => {
  if (!opinionButtons.length || !opinionLightboxImage) {
    return;
  }

  const total = opinionButtons.length;
  activeOpinionIndex = (index + total) % total;

  const activeButton = opinionButtons[activeOpinionIndex];
  opinionLightboxImage.src = activeButton.dataset.opinionSrc || "";
  opinionLightboxImage.alt = activeButton.dataset.opinionAlt || "";

  if (opinionLightboxCaption) {
    opinionLightboxCaption.textContent =
      "Realny screen rekomendacji od podopiecznego.";
  }

  if (opinionLightboxCounter) {
    opinionLightboxCounter.textContent = `${activeOpinionIndex + 1} / ${total}`;
  }
};

const openOpinionLightbox = (index) => {
  if (!opinionLightbox) {
    return;
  }

  window.clearTimeout(coachingAutoTimer);
  coachingPicker?.close?.();

  if (isContactChooserOpen()) {
    closeContactChooser();
  }

  opinionLightbox.removeAttribute("hidden");
  setOpinionSlide(index);
  opinionLightbox.hidden = false;
  opinionLightbox.setAttribute("aria-hidden", "false");
  body.classList.add("opinion-lightbox-open");

  window.requestAnimationFrame(() => {
    opinionLightbox.classList.add("is-open");
  });
};

const closeOpinionLightbox = () => {
  if (!opinionLightbox) {
    return;
  }

  opinionLightbox.classList.remove("is-open");
  opinionLightbox.setAttribute("aria-hidden", "true");
  body.classList.remove("opinion-lightbox-open");

  window.setTimeout(() => {
    if (!opinionLightbox.classList.contains("is-open")) {
      opinionLightbox.setAttribute("hidden", "");
      opinionLightbox.hidden = true;
    }
  }, 180);
};

const openContactChooser = () => {
  if (!contactChooser) {
    return;
  }

  window.clearTimeout(coachingAutoTimer);
  coachingSeenThisVisit = true;
  coachingPicker?.close?.();

  if (isOpinionLightboxOpen()) {
    closeOpinionLightbox();
  }

  contactChooser.removeAttribute("hidden");
  contactChooser.hidden = false;
  contactChooser.setAttribute("aria-hidden", "false");
  body.classList.add("contact-chooser-open");

  window.requestAnimationFrame(() => {
    contactChooser.classList.add("is-open");
    contactChooser.querySelector("button")?.focus();
  });
};

const closeContactChooser = () => {
  if (!contactChooser) {
    return;
  }

  contactChooser.classList.remove("is-open");
  contactChooser.setAttribute("aria-hidden", "true");
  body.classList.remove("contact-chooser-open");

  window.setTimeout(() => {
    if (!contactChooser.classList.contains("is-open")) {
      contactChooser.setAttribute("hidden", "");
      contactChooser.hidden = true;
    }
  }, 180);
};

const rememberCoachingVisit = () => {
  coachingSeenThisVisit = true;
  try {
    localStorage.setItem(coachingStorageKey, String(Date.now()));
  } catch {
    // The popup still appears only once per visit when storage is unavailable.
  }
};

const showCoachingStep = (index, focus = true) => {
  coachingStep = index;
  coachingForm.hidden = false;
  coachingIntro.hidden = false;
  coachingResult.hidden = true;
  coachingSteps.forEach((step, stepIndex) => {
    step.hidden = stepIndex !== index;
    step.disabled = stepIndex !== index;
  });
  coachingPicker.querySelector("[data-coaching-step-number]").textContent = String(index + 1);
  coachingBack.hidden = index === 0;
  coachingNext.textContent = index === coachingSteps.length - 1 ? "Zobacz mój kolejny krok" : "Dalej →";
  if (focus) {
    const legend = coachingSteps[index].querySelector("legend");
    legend.tabIndex = -1;
    legend.focus();
  }
};

const openCoachingPicker = () => {
  if (typeof coachingPicker?.showModal !== "function" || coachingPicker.open || isContactChooserOpen() || isOpinionLightboxOpen()) {
    return;
  }
  window.clearTimeout(coachingAutoTimer);
  closeNav();
  coachingReturnFocus = document.activeElement;
  rememberCoachingVisit();
  showCoachingStep(0, false);
  coachingPicker.showModal();
  body.classList.add("coaching-picker-open");
};

const showCoachingResult = () => {
  const selected = ["goal", "experience", "support"].map((name) => {
    const input = coachingForm.querySelector(`input[name="${name}"]:checked`);
    return { value: input.value, label: input.closest("label").querySelector("span").textContent };
  });
  const [goal, , support] = selected;
  const goalText = {
    redukcja: "Skupmy się na redukcji i lepszej sylwetce.",
    masa: "Zbudujmy plan na rozwój Twojej sylwetki.",
    powrot: "Zacznijmy od planu, który wpisze się w Twoją codzienność.",
  };
  const supportText = {
    prowadzenie: "Prowadzenie online 1:1 pozwoli nam regularnie analizować Twoje postępy i dostosowywać plan. Omówmy szczegóły przed rozpoczęciem współpracy.",
    plan: "Możemy zacząć od indywidualnego planu do samodzielnej realizacji. Wspólnie ustalimy jego zakres i dopasujemy go do Twoich możliwości.",
    rozmowa: "Porozmawiajmy o Twoim celu i ustalmy, jakiego wsparcia potrzebujesz. Termin bezpłatnej konsultacji telefonicznej uzgodnimy w wiadomości.",
  };
  const summary = selected.map((answer) => answer.label).join("\n");
  coachingPicker.querySelector("[data-coaching-result-title]").textContent = goalText[goal.value];
  coachingPicker.querySelector("[data-coaching-result-text]").textContent = supportText[support.value];
  coachingPicker.querySelector("[data-coaching-summary]").textContent = summary;
  const message = `Cześć Łukasz! Chcę porozmawiać o współpracy.\n\n${summary}\n\nProszę o ustalenie kolejnego kroku i terminu rozmowy.`;
  coachingPicker.querySelector("[data-coaching-email]").href = `mailto:jasza.trener@gmail.com?subject=${encodeURIComponent("Mój cel - współpraca online")}&body=${encodeURIComponent(message)}`;
  coachingForm.hidden = true;
  coachingIntro.hidden = true;
  coachingResult.hidden = false;
  const title = coachingPicker.querySelector("[data-coaching-result-title]");
  title.tabIndex = -1;
  title.focus();
};

const scheduleCoachingPicker = () => {
  window.clearTimeout(coachingAutoTimer);
  if (typeof coachingPicker?.showModal !== "function" || document.hidden || coachingSeenThisVisit) {
    return;
  }
  try {
    const lastSeen = Number(localStorage.getItem(coachingStorageKey));
    if (lastSeen && Date.now() - lastSeen < coachingCooldown) {
      return;
    }
  } catch {
    // Storage restrictions must not prevent the page from working.
  }
  coachingAutoTimer = window.setTimeout(() => {
    if (document.hidden || body.classList.contains("nav-open") || document.activeElement?.matches("input, textarea, select")) {
      return;
    }
    openCoachingPicker();
  }, 8000);
};

if (typeof coachingPicker?.showModal === "function") {
  document.querySelectorAll("[data-coaching-open]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", openCoachingPicker);
  });
  coachingPicker.querySelectorAll("[data-coaching-close]").forEach((button) => {
    button.addEventListener("click", () => coachingPicker.close());
  });
  coachingPicker.addEventListener("click", (event) => {
    const rect = coachingPicker.getBoundingClientRect();
    if (event.target === coachingPicker && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) {
      coachingPicker.close();
    }
  });
  coachingPicker.addEventListener("close", () => {
    body.classList.remove("coaching-picker-open");
    if (!isContactChooserOpen() && !isOpinionLightboxOpen()) {
      coachingReturnFocus?.focus?.();
    }
  });
  coachingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!coachingForm.reportValidity()) {
      return;
    }
    if (coachingStep < coachingSteps.length - 1) {
      showCoachingStep(coachingStep + 1);
    } else {
      showCoachingResult();
    }
  });
  coachingBack.addEventListener("click", () => showCoachingStep(coachingStep - 1));
  coachingPicker.querySelector("[data-coaching-restart]").addEventListener("click", () => showCoachingStep(0));
  coachingPicker.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => coachingPicker.close());
  });
  document.addEventListener("visibilitychange", scheduleCoachingPicker);
  scheduleCoachingPicker();
}

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const closeNav = () => {
  body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

navToggle?.addEventListener("click", () => {
  const isOpen = body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (body.classList.contains("nav-open")) {
      closeNav();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (isOpinionLightboxOpen()) {
      closeOpinionLightbox();
    }

    if (isContactChooserOpen()) {
      closeContactChooser();
    }

    closeNav();
  }
});

window.addEventListener("scroll", () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
});

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    const answer = button.nextElementSibling;

    faqButtons.forEach((item) => {
      const panel = item.nextElementSibling;
      item.setAttribute("aria-expanded", "false");
      if (panel) {
        panel.style.maxHeight = null;
      }
    });

    if (!expanded) {
      button.setAttribute("aria-expanded", "true");
      if (answer) {
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    }
  });
});

opinionButtons.forEach((button, index) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openOpinionLightbox(index);
  });
});

opinionLightboxCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeOpinionLightbox();
  });
});

opinionLightboxPrev?.addEventListener("click", () => {
  setOpinionSlide(activeOpinionIndex - 1);
});

opinionLightboxNext?.addEventListener("click", () => {
  setOpinionSlide(activeOpinionIndex + 1);
});

opinionGalleryPrev?.addEventListener("click", () => {
  scrollOpinionGalleryToIndex(activeOpinionGalleryIndex - 1);
});

opinionGalleryNext?.addEventListener("click", () => {
  scrollOpinionGalleryToIndex(activeOpinionGalleryIndex + 1);
});

opinionGallery?.addEventListener("scroll", () => {
  window.requestAnimationFrame(syncOpinionGalleryIndex);
});

contactOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    closeNav();
    openContactChooser();
  });
});

contactChooserCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeContactChooser();
  });
});

contactChooserLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeContactChooser();
  });
});

document.addEventListener("keydown", (event) => {
  if (!isOpinionLightboxOpen()) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setOpinionSlide(activeOpinionIndex - 1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    setOpinionSlide(activeOpinionIndex + 1);
  }
});

window.addEventListener("resize", () => {
  setOpinionGalleryStatus(activeOpinionGalleryIndex);
  syncOpinionGalleryIndex();
});

setOpinionGalleryStatus(0);
syncOpinionGalleryIndex();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        activateAccentSequence(entry.target);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
);

revealItems.forEach((item) => revealObserver.observe(item));

const accentObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activateAccentSequence(entry.target);
        accentObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
);

accentOnlyItems.forEach((item) => accentObserver.observe(item));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const id = entry.target.getAttribute("id");
      const targetLink = siteNav?.querySelector(`a[href="#${id}"]`);

      if (!targetLink) {
        return;
      }

      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove("is-active"));
        targetLink.classList.add("is-active");
      }
    });
  },
  {
    threshold: 0.35,
    rootMargin: "-25% 0px -50% 0px",
  }
);

sections.forEach((section) => sectionObserver.observe(section));

const initHeroCarousel = () => {
  const carousel = document.querySelector(".hero-carousel");
  const slides = [...(carousel?.querySelectorAll("[data-hero-slide]") || [])];
  if (!carousel || slides.length < 2) {
    return;
  }

  const controls = carousel.querySelector(".hero-carousel__controls");
  const pauseButton = carousel.querySelector("[data-hero-pause]");
  const dots = [...carousel.querySelectorAll("[data-hero-select]")];
  const counter = carousel.querySelector("[data-hero-counter]");
  let activeIndex = 0;
  let timer;
  let requestId = 0;
  let visible = false;
  let paused = prefersReducedMotion.matches;
  let pointerPaused = false;
  let focusPaused = false;

  const updatePauseButton = () => {
    pauseButton.textContent = paused ? "Odtwórz" : "Pauza";
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.setAttribute("aria-label", paused ? "Wznów automatyczną zmianę zdjęć" : "Zatrzymaj automatyczną zmianę zdjęć");
  };

  const prepareSlide = async (index) => {
    const image = slides[index].querySelector("img");
    if (!image.getAttribute("src")) {
      image.loading = "eager";
      image.src = image.dataset.heroSrc;
    }
    try {
      await image.decode();
      return image.naturalWidth > 0;
    } catch {
      return false;
    }
  };

  const canRotate = () =>
    visible && !paused && !pointerPaused && !focusPaused && !document.hidden &&
    !coachingPicker?.open && !isContactChooserOpen() && !isOpinionLightboxOpen() &&
    !body.classList.contains("nav-open");

  const schedule = () => {
    window.clearTimeout(timer);
    if (canRotate()) {
      timer = window.setTimeout(() => showSlide(activeIndex + 1), 6000);
    }
  };

  const showSlide = async (index, manual = false) => {
    window.clearTimeout(timer);
    if (manual) {
      paused = true;
      updatePauseButton();
    }
    const nextIndex = (index + slides.length) % slides.length;
    const currentRequest = ++requestId;
    const ready = await prepareSlide(nextIndex);
    if (currentRequest !== requestId) {
      return;
    }
    if (!ready) {
      schedule();
      return;
    }
    if (!manual && !canRotate()) {
      schedule();
      return;
    }

    activeIndex = nextIndex;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      dots[slideIndex].setAttribute("aria-pressed", String(active));
    });
    counter.textContent = `${activeIndex + 1} / ${slides.length}`;
    if (visible) {
      void prepareSlide((activeIndex + 1) % slides.length);
    }
    schedule();
  };

  dots.forEach((button) => {
    button.addEventListener("click", () => showSlide(Number(button.dataset.heroSelect), true));
  });
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    if (!paused) {
      pointerPaused = false;
      focusPaused = false;
    }
    updatePauseButton();
    schedule();
  });
  carousel.addEventListener("pointerenter", () => {
    pointerPaused = true;
    schedule();
  });
  carousel.addEventListener("pointerleave", () => {
    pointerPaused = false;
    schedule();
  });
  carousel.addEventListener("focusin", () => {
    focusPaused = true;
    schedule();
  });
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      focusPaused = false;
      schedule();
    }
  });
  document.addEventListener("visibilitychange", schedule);
  prefersReducedMotion.addEventListener("change", () => {
    if (prefersReducedMotion.matches) {
      paused = true;
      updatePauseButton();
    }
    schedule();
  });

  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.2;
    if (visible) {
      void prepareSlide((activeIndex + 1) % slides.length);
    }
    schedule();
  }, { threshold: 0.2 });
  visibilityObserver.observe(carousel);

  const overlayObserver = new MutationObserver(schedule);
  overlayObserver.observe(body, { attributes: true, attributeFilter: ["class"] });
  [contactChooser, opinionLightbox].forEach((overlay) => {
    if (overlay) {
      overlayObserver.observe(overlay, { attributes: true, attributeFilter: ["hidden"] });
    }
  });
  if (coachingPicker) {
    overlayObserver.observe(coachingPicker, { attributes: true, attributeFilter: ["open"] });
  }
  updatePauseButton();
  controls.hidden = false;
};

initHeroCarousel();
