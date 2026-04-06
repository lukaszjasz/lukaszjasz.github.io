const body = document.body;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const faqButtons = [...document.querySelectorAll(".faq-question")];
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const sections = [...document.querySelectorAll("main section[id]")];
const accentOnlyItems = [...document.querySelectorAll(".metric-card, .timeline__item")];
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

    const delay = prefersReducedMotion.matches ? 0 : sequenceIndex * 110;
    window.setTimeout(() => {
      target.classList.add("is-accent-visible");
    }, delay);

    sequenceIndex += 1;
  });
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
