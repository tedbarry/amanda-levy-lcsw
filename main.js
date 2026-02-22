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
