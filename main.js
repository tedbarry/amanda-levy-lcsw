/* ========================================
   Amanda Levy, LCSW — Main JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ========== Hash Redirects for Old Bookmarks ==========
  // Redirect legacy single-page anchors to new multi-page URLs
  const hashRedirects = {
    '#services': 'services.html',
    '#fees': 'fees-faq.html',
    '#faq': 'fees-faq.html#faq',
    '#contact': 'contact.html'
  };

  const currentPath = window.location.pathname;
  const isHome = currentPath === '/' || currentPath.endsWith('/index.html') || currentPath.endsWith('/index');

  if (isHome && window.location.hash) {
    const redirect = hashRedirects[window.location.hash];
    if (redirect) {
      window.location.replace(redirect);
      return; // Stop executing — we're navigating away
    }
  }

  // ========== Active Nav Link for Current Page ==========
  const allNavLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const hash = window.location.hash;

  allNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    let isActive = false;

    if ((path === '' || path === 'index.html') && (href === '/' || href === '/#about')) {
      // Home page: "Home" is active by default, "About" activates on scroll
      if (href === '/') isActive = true;
    } else if (path === 'services.html' && href === 'services.html') {
      isActive = true;
    } else if (path === 'fees-faq.html') {
      if (hash === '#faq' && href === 'fees-faq.html#faq') {
        isActive = true;
      } else if (hash !== '#faq' && href === 'fees-faq.html') {
        isActive = true;
      }
    } else if (path === 'contact.html' && href === 'contact.html') {
      isActive = true;
    } else if (path === 'blog.html' && href === 'blog.html') {
      isActive = true;
    } else if (path === 'post.html' && href === 'blog.html') {
      isActive = true;
    } else if (path === 'portal.html' && href === 'blog.html') {
      isActive = true;
    } else if (path === 'admin.html' && href === 'blog.html') {
      isActive = true;
    } else if (path === 'login.html' && href === 'blog.html') {
      isActive = true;
    }

    if (isActive) {
      link.classList.add('active');
    }
  });

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

  // ========== Active Nav Link on Scroll (Home page only) ==========
  const sections = document.querySelectorAll('section[id]');
  const navLinksScroll = document.querySelectorAll('.nav-link');

  if (isHome && sections.length) {
    const updateActiveNav = () => {
      const scrollPos = window.scrollY + 120;

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
          navLinksScroll.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.remove('active');
            // Map section IDs to new nav hrefs
            if (id === 'home' && href === '/') {
              link.classList.add('active');
            } else if (id === 'about' && href === '/#about') {
              link.classList.add('active');
            }
          });
        }
      });
    };

    window.addEventListener('scroll', updateActiveNav, { passive: true });
  }

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

  // ========== Therapeutic Approach Details ==========
  const approachData = {
    'family-systems': {
      title: 'Family Systems Therapy',
      desc: 'Family Systems therapy views individuals as part of an interconnected family unit. Rather than focusing on one person in isolation, this approach explores how family dynamics, communication patterns, and relationships influence each member. It helps families understand how changes in one part of the system affect everyone, and works toward healthier patterns of interaction and support.'
    },
    'cbt': {
      title: 'Cognitive Behavioral Therapy (CBT)',
      desc: 'CBT is a widely researched and highly effective approach that focuses on the connection between thoughts, feelings, and behaviors. By identifying unhelpful thought patterns and learning to challenge and reframe them, clients develop practical coping skills that lead to lasting changes in mood and behavior. CBT is particularly effective for anxiety, depression, and stress-related concerns.'
    },
    'dbt': {
      title: 'Dialectical Behavior Therapy (DBT)',
      desc: 'DBT combines cognitive-behavioral techniques with mindfulness practices. Originally developed for individuals with intense emotions, it teaches four key skill sets: mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness. DBT helps clients accept themselves while also working toward meaningful change — balancing acceptance with the motivation to grow.'
    },
    'hypnotherapy': {
      title: 'Hypnotherapy',
      desc: 'Hypnotherapy uses guided relaxation and focused attention to achieve a heightened state of awareness and concentration. In this deeply relaxed state, clients can explore thoughts, feelings, and memories that may be hidden from their conscious mind. It can be helpful for managing stress, overcoming habits, reducing anxiety, and addressing a variety of emotional and behavioral concerns.'
    },
    'psychodynamic': {
      title: 'Psychodynamic Therapy',
      desc: 'Psychodynamic therapy explores how past experiences and unconscious processes influence current behavior and relationships. By understanding patterns that may have developed in childhood or earlier life stages, clients gain deeper self-awareness and insight. This approach helps uncover the root causes of emotional struggles, leading to more lasting and meaningful change.'
    },
    'strength-based': {
      title: 'Strength-Based Therapy',
      desc: 'Strength-Based therapy focuses on your existing strengths, resources, and resilience rather than concentrating solely on problems or deficits. This empowering approach recognizes that everyone has innate abilities and coping skills that can be built upon. By identifying and amplifying what is already working well, clients develop greater confidence and more effective strategies for overcoming challenges.'
    },
    'structural': {
      title: 'Structural Family Therapy',
      desc: 'Structural Family Therapy examines and reshapes the organization of the family — including boundaries, hierarchies, and subsystems. It helps families establish healthy structures where parents can effectively lead, children feel secure, and each member has an appropriate role. This approach is especially effective for families navigating transitions, conflicts, or challenges with children and adolescents.'
    }
  };

  const approachDetail = document.getElementById('approach-detail');
  const approachTitle = document.getElementById('approach-title');
  const approachDesc = document.getElementById('approach-desc');
  const approachClose = document.getElementById('approach-close');
  const approachBtns = document.querySelectorAll('.approach-clickable');

  if (approachDetail && approachBtns.length) {
    approachBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-approach');
        const data = approachData[key];
        if (!data) return;

        // If clicking the same one that's already open, close it
        if (btn.classList.contains('active-approach') && !approachDetail.classList.contains('hidden')) {
          approachDetail.classList.add('hidden');
          btn.classList.remove('active-approach');
          return;
        }

        // Remove active from all
        approachBtns.forEach(b => b.classList.remove('active-approach'));

        // Set active
        btn.classList.add('active-approach');

        // Populate and show
        approachTitle.textContent = data.title;
        approachDesc.textContent = data.desc;
        approachDetail.classList.remove('hidden');

        // Re-trigger animation
        approachDetail.style.animation = 'none';
        approachDetail.offsetHeight; // force reflow
        approachDetail.style.animation = '';
      });
    });

    // Close button
    if (approachClose) {
      approachClose.addEventListener('click', () => {
        approachDetail.classList.add('hidden');
        approachBtns.forEach(b => b.classList.remove('active-approach'));
      });
    }
  }

  // ========== Contact Form (Formspree AJAX) ==========
  const form = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');
  const errorMsg = document.getElementById('form-error');
  const submitBtn = document.getElementById('form-submit-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.querySelector('#name').value.trim();
      const email = form.querySelector('#email').value.trim();
      const message = form.querySelector('#message').value.trim();

      // Basic validation
      if (!name || !email || !message) return;

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          successMsg.classList.remove('hidden');
          errorMsg.classList.add('hidden');
          form.reset();
          setTimeout(() => successMsg.classList.add('hidden'), 8000);
        } else {
          throw new Error('Form submission failed');
        }
      } catch (err) {
        errorMsg.classList.remove('hidden');
        successMsg.classList.add('hidden');
        setTimeout(() => errorMsg.classList.add('hidden'), 8000);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }

  // ========== Quote Rotator ==========
  const quoteSlides = document.querySelectorAll('.quote-slide');
  const quoteDots = document.querySelectorAll('.quote-dot');
  let currentQuote = 0;
  let quoteInterval;

  function showQuote(index) {
    quoteSlides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
    quoteDots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
      d.style.backgroundColor = i === index ? '' : '';
    });
    currentQuote = index;
  }

  function nextQuote() {
    showQuote((currentQuote + 1) % quoteSlides.length);
  }

  if (quoteSlides.length > 1) {
    quoteInterval = setInterval(nextQuote, 6000);

    // Click dots to navigate
    quoteDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        clearInterval(quoteInterval);
        showQuote(i);
        quoteInterval = setInterval(nextQuote, 6000);
      });
    });
  }

  // ========== Social Proof Animated Counters ==========
  const counterElements = document.querySelectorAll('[data-target]');

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'));
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);

      // Format: for 1000, show "1,000"
      el.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  if (counterElements.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterElements.forEach(el => counterObserver.observe(el));
  }

  // ========== Parallax Hero Shapes ==========
  const shapes = document.querySelectorAll('.parallax-shape');

  if (shapes.length) {
    const parallaxSpeeds = [0.03, 0.02, 0.015];

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      shapes.forEach((shape, i) => {
        const speed = parallaxSpeeds[i] || 0.02;
        shape.style.transform = `translateY(${scrollY * speed}px)`;
      });
    }, { passive: true });
  }

  // ========== "Is Therapy Right For Me?" Self-Check ==========
  const scQuestions = document.querySelectorAll('.sc-question');
  const scProgress = document.getElementById('sc-progress');
  const scProgressText = document.getElementById('sc-progress-text');
  const scResult = document.getElementById('sc-result');
  const scResultText = document.getElementById('sc-result-text');
  const scRestart = document.getElementById('sc-restart');
  let scCurrent = 0;
  let scYesCount = 0;

  function scShowQuestion(index) {
    scQuestions.forEach((q, i) => {
      q.classList.toggle('active', i === index);
    });
    const pct = (index / scQuestions.length) * 100;
    if (scProgress) scProgress.style.width = pct + '%';
    if (scProgressText) scProgressText.textContent = `Question ${index + 1} of ${scQuestions.length}`;
  }

  function scShowResult() {
    // Hide questions and progress
    scQuestions.forEach(q => q.classList.remove('active'));
    if (scProgress) scProgress.style.width = '100%';
    if (scProgressText) scProgressText.textContent = 'Complete';

    // Show result
    if (scResult) scResult.classList.remove('hidden');

    if (scYesCount >= 3) {
      scResultText.textContent = "It sounds like talking to someone could really help. You don\u2019t have to go through this alone. Amanda offers a free 15-minute consultation to discuss what you\u2019re going through \u2014 no pressure, no obligation.";
    } else if (scYesCount >= 1) {
      scResultText.textContent = "Whatever you\u2019re going through matters, and you deserve to feel heard. Therapy is a space to explore your feelings at your own pace. Amanda offers a free 15-minute consultation whenever you\u2019re ready \u2014 no pressure at all.";
    } else {
      scResultText.textContent = "It\u2019s great that things feel manageable right now. If that ever changes, know that reaching out for support is always a sign of strength, not weakness. Amanda is here whenever you need her.";
    }
  }

  // Attach click handlers to all self-check buttons
  document.querySelectorAll('.sc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('data-answer') === 'yes') scYesCount++;
      scCurrent++;

      if (scCurrent >= scQuestions.length) {
        scShowResult();
      } else {
        scShowQuestion(scCurrent);
      }
    });
  });

  // Restart
  if (scRestart) {
    scRestart.addEventListener('click', () => {
      scCurrent = 0;
      scYesCount = 0;
      scResult.classList.add('hidden');
      scShowQuestion(0);
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
    '.specialty-card, .expertise-group, .faq-item, .timeline-step, .counter-item, .insurance-step'
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

  // ========== Global Auth Check for Nav Links ==========
  // Fetch current user and show/hide Portal/Admin nav links on all pages
  (async function initGlobalNavAuth() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      const user = (res.ok && data.user) ? data.user : null;

      // Store for blog.js to reuse
      window.__currentUser = user;

      if (user) {
        // Show portal link
        const portalLinks = document.querySelectorAll('#nav-portal-link, #mobile-nav-portal-link');
        portalLinks.forEach(el => el.classList.remove('hidden'));

        // Show admin link if admin
        if (user.is_admin) {
          const adminLinks = document.querySelectorAll('#nav-admin-link, #mobile-nav-admin-link');
          adminLinks.forEach(el => el.classList.remove('hidden'));
        }
      }
    } catch (e) {
      window.__currentUser = null;
    }
  })();

});
