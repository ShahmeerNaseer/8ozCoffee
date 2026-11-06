const header = document.querySelector('.site-header');
const progressBar = document.querySelector('.scroll-progress span');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const cupScene = document.getElementById('cupScene');
const heroGlow = document.querySelector('.hero-glow');
const year = document.getElementById('year');
const navLinks = document.querySelectorAll('.nav-menu a');

let ticking = false;

year.textContent = new Date().getFullYear();

function updateScrollState() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  header.classList.toggle('scrolled', scrollTop > 24);
  progressBar.style.width = `${Math.min(progress, 100)}%`;

  const parallax = Math.min(scrollTop * 0.08, 90);
  if (cupScene) cupScene.style.transform = `translateY(${parallax}px)`;
  if (heroGlow) heroGlow.style.transform = `translate3d(0, ${parallax * 0.35}px, 0)`;

  ticking = false;
}

function onScroll() {
  if (!ticking) {
    window.requestAnimationFrame(updateScrollState);
    ticking = true;
  }
}

function setupRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal');

  reveals.forEach((element) => {
    const siblings = [...element.parentElement.querySelectorAll(':scope > .reveal')];
    const index = Math.max(siblings.indexOf(element), 0);
    element.style.setProperty('--reveal-delay', `${Math.min(index * 90, 360)}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -8% 0px'
  });

  reveals.forEach((element) => observer.observe(element));
}

function setupMobileNav() {
  function setMenu(open) {
    navMenu.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  }

  navToggle.addEventListener('click', () => {
    setMenu(!navMenu.classList.contains('open'));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });
}

function setupSectionHighlight() {
  const sections = [...document.querySelectorAll('main section[id]')];
  const linkMap = new Map();

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) linkMap.set(href.slice(1), link);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = linkMap.get(entry.target.id);
      if (!link) return;

      if (entry.isIntersecting) {
        navLinks.forEach((navLink) => navLink.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, {
    rootMargin: '-35% 0px -55% 0px',
    threshold: 0
  });

  sections.forEach((section) => observer.observe(section));
}

setupRevealAnimations();
setupMobileNav();
setupSectionHighlight();

updateScrollState();
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
