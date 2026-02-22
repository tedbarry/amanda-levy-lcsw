/* ========================================
   Amanda Berman Levy, LCSW — Main JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ========== Current Year in Footer ==========
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ========== Mobile Menu Toggle ==========
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', !isOpen);

      // Swap icon between hamburger and X
      if (isOpen) {
        menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
      } else {
        menuIcon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
      }
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
      });
    });
  }

  // ========== Navbar Shadow on Scroll ==========
  const navbar = document.getElementById('navbar');

  const handleScroll = () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ========== Active Nav Link on Scroll ==========
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const updateActiveNav = () => {
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ========== FAQ Accordion ==========
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-btn');

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      faqItems.forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
      });

      // Open clicked (if it wasn't already open)
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ========== Contact Form ==========
  const form = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('#name').value.trim();
      const email = form.querySelector('#email').value.trim();
      const message = form.querySelector('#message').value.trim();

      // Basic validation
      if (!name || !email || !message) {
        return;
      }

      // Build mailto link as fallback (no backend)
      const subject = encodeURIComponent('New Message from ' + name);
      const body = encodeURIComponent(
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n\n' +
        'Message:\n' + message
      );

      window.location.href = 'mailto:amandalevylcsw@gmail.com?subject=' + subject + '&body=' + body;

      // Show success message
      successMsg.classList.remove('hidden');
      form.reset();

      // Hide success message after 8 seconds
      setTimeout(() => {
        successMsg.classList.add('hidden');
      }, 8000);
    });
  }

  // ========== Back to Top Button ==========
  const backToTop = document.getElementById('back-to-top');

  if (backToTop) {
    const toggleBackToTop = () => {
      if (window.scrollY > 400) {
        backToTop.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
        backToTop.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
      } else {
        backToTop.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
        backToTop.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
      }
    };

    window.addEventListener('scroll', toggleBackToTop, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========== Sticky Mobile CTA Bar ==========
  const mobileCta = document.getElementById('mobile-cta');

  if (mobileCta) {
    const toggleMobileCta = () => {
      if (window.scrollY > 600) {
        mobileCta.classList.remove('translate-y-full');
        mobileCta.classList.add('translate-y-0');
      } else {
        mobileCta.classList.add('translate-y-full');
        mobileCta.classList.remove('translate-y-0');
      }
    };

    window.addEventListener('scroll', toggleMobileCta, { passive: true });
  }

  // ========== Scroll Reveal Animation ==========
  const revealElements = document.querySelectorAll(
    '.specialty-card, .expertise-group, .faq-item'
  );

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal', 'visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  }

});
