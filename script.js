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

  if (isOpinionLightboxOpen()) {
    closeOpinionLightbox();
  }

  contactChooser.removeAttribute("hidden");
  contactChooser.hidden = false;
  contactChooser.setAttribute("aria-hidden", "false");
  body.classList.add("contact-chooser-open");

  window.requestAnimationFrame(() => {
    contactChooser.classList.add("is-open");
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
