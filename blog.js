/* ========================================
   Amanda Levy, LCSW — Blog JS
   Powers: blog.html, post.html, admin.html,
           portal.html, login.html
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ========== Global State ==========
  let currentUser = null;
  let currentPage = 1;
  let currentQuery = '';
  let isLoadingPosts = false;
  let hasMorePosts = true;
  let quillEditor = null;
  let editingSlug = null;

  // ========== Utility Functions ==========

  /**
   * Format a date string to "Feb 22, 2026" style
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Escape HTML entities for safe display
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Return a human-readable relative time string
   */
  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    if (isNaN(then)) return '';
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return days === 1 ? '1 day ago' : `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;
    const years = Math.floor(months / 12);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }

  /**
   * Generate a URL slug from a title string
   */
  function slugify(text) {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Debounce a function by the given delay in ms
   */
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /**
   * Calculate reading time from content HTML
   */
  function calcReadingTime(html) {
    if (!html) return '1 min read';
    const text = html.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }

  /**
   * Generic fetch wrapper with JSON parsing and error handling
   */
  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }


  // ========================================================
  //  1. AUTH STATE MANAGEMENT
  // ========================================================

  const authSignIn = document.getElementById('auth-sign-in');
  const authUserMenu = document.getElementById('auth-user-menu');
  const authUserName = document.getElementById('auth-user-name');
  const authAdminLink = document.getElementById('auth-admin-link');
  const authPortalLink = document.getElementById('auth-portal-link');

  /**
   * Show / hide the auth-related UI elements based on currentUser
   */
  function updateAuthUI() {
    if (currentUser) {
      if (authSignIn) authSignIn.classList.add('hidden');
      if (authUserMenu) authUserMenu.classList.remove('hidden');
      if (authUserName) authUserName.textContent = currentUser.display_name || currentUser.email;
      if (authAdminLink) {
        if (currentUser.is_admin) {
          authAdminLink.classList.remove('hidden');
        } else {
          authAdminLink.classList.add('hidden');
        }
      }
      if (authPortalLink) authPortalLink.classList.remove('hidden');
    } else {
      if (authSignIn) authSignIn.classList.remove('hidden');
      if (authUserMenu) authUserMenu.classList.add('hidden');
      if (authAdminLink) authAdminLink.classList.add('hidden');
    }
  }

  /**
   * Log the current user out and reload
   */
  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore errors — we still clear client state
    }
    window.location.reload();
  }

  // Expose logout globally so onclick="logout()" works from HTML
  window.logout = logout;

  /**
   * Fetch current user on page load
   */
  async function initAuth() {
    try {
      const data = await apiFetch('/api/auth/me');
      currentUser = data.user || null;
    } catch (e) {
      currentUser = null;
    }
    updateAuthUI();
  }

  // Always run auth check on every page
  initAuth().then(() => {
    // After auth resolves, initialize page-specific features
    initLoginPage();
    initBlogPage();
    initPostPage();
    initAdminPage();
    initPortalPage();
  });


  // ========================================================
  //  2. LOGIN PAGE (login.html)
  // ========================================================

  function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    const loginSuccess = document.getElementById('login-success');
    const loginSuccessEmail = document.getElementById('login-success-email');
    const loginError = document.getElementById('login-error');
    const loginErrorText = document.getElementById('login-error-text');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    // Handle URL error params (redirected from /api/auth/verify)
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');

    if (urlError && loginError && loginErrorText) {
      if (urlError === 'expired') {
        loginErrorText.textContent = 'Your sign-in link has expired. Please try again.';
      } else if (urlError === 'invalid') {
        loginErrorText.textContent = 'Invalid sign-in link.';
      } else {
        loginErrorText.textContent = 'Something went wrong. Please try again.';
      }
      loginError.classList.remove('hidden');
    }

    // If already logged in, redirect to blog
    if (currentUser) {
      window.location.href = '/blog.html';
      return;
    }

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = loginForm.querySelector('#login-email');
      const email = (emailInput ? emailInput.value : '').trim();
      if (!email) return;

      // Hide previous messages
      if (loginSuccess) loginSuccess.classList.add('hidden');
      if (loginError) loginError.classList.add('hidden');

      // Disable button
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        await apiFetch('/api/auth/send-magic-link', {
          method: 'POST',
          body: JSON.stringify({ email })
        });

        // Show success
        if (loginSuccess) loginSuccess.classList.remove('hidden');
        if (loginSuccessEmail) loginSuccessEmail.textContent = email;
        loginForm.classList.add('hidden');

      } catch (err) {
        if (loginError) loginError.classList.remove('hidden');
        if (loginErrorText) loginErrorText.textContent = err.message || 'Unable to send sign-in link. Please try again.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }


  // ========================================================
  //  3. BLOG LISTING PAGE (blog.html)
  // ========================================================

  function initBlogPage() {
    const postsGrid = document.getElementById('posts-grid');
    if (!postsGrid) return;

    const searchInput = document.getElementById('search-input');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const subscribeForm = document.getElementById('subscribe-form');

    /**
     * Fetch and render posts
     */
    async function loadPosts(page, query) {
      if (isLoadingPosts) return;
      isLoadingPosts = true;

      if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Loading...';
      }

      try {
        let url = `/api/posts?page=${page}`;
        if (query) url += `&q=${encodeURIComponent(query)}`;

        const data = await apiFetch(url);
        const posts = data.posts || [];

        // If this is page 1 (new search or initial load), clear grid
        if (page === 1) {
          postsGrid.innerHTML = '';
        }

        if (posts.length === 0 && page === 1) {
          postsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
              <p class="text-gray-500 text-lg">No posts found.</p>
              ${query ? '<p class="text-gray-400 text-sm mt-2">Try a different search term.</p>' : ''}
            </div>
          `;
          hasMorePosts = false;
        } else {
          posts.forEach(post => {
            postsGrid.insertAdjacentHTML('beforeend', renderPostCard(post));
          });
          hasMorePosts = data.has_more || false;
        }

        // Attach favorite handlers to new cards
        attachFavoriteHandlers(postsGrid);

      } catch (err) {
        if (page === 1) {
          postsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
              <p class="text-red-600">Unable to load posts. Please try again later.</p>
            </div>
          `;
        }
      } finally {
        isLoadingPosts = false;
        if (loadMoreBtn) {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = 'Load More';
          if (!hasMorePosts) loadMoreBtn.classList.add('hidden');
          else loadMoreBtn.classList.remove('hidden');
        }
      }
    }

    /**
     * Render a single post card as HTML string
     */
    function renderPostCard(post) {
      const date = formatDate(post.published_at || post.created_at);
      const excerpt = escapeHtml(post.excerpt || '');
      const title = escapeHtml(post.title || 'Untitled');
      const slug = encodeURIComponent(post.slug);
      const isFav = post.is_favorited ? 'text-red-500' : 'text-gray-300';

      const favoriteBtn = currentUser ? `
        <button class="favorite-btn absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
                data-post-id="${post.id}" data-favorited="${post.is_favorited ? '1' : '0'}"
                aria-label="Favorite this post">
          <svg class="w-5 h-5 ${isFav} transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      ` : '';

      return `
        <article class="bg-white rounded-2xl border border-sage-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
          ${favoriteBtn}
          <div class="p-6">
            <time class="text-xs text-sage-500 font-medium uppercase tracking-wider">${date}</time>
            <h2 class="font-serif text-xl font-semibold text-sage-900 mt-2 mb-3">
              <a href="post.html?slug=${slug}" class="hover:text-sage-600 transition-colors">${title}</a>
            </h2>
            <p class="text-gray-600 text-sm leading-relaxed line-clamp-3">${excerpt}</p>
            <a href="post.html?slug=${slug}" class="inline-block mt-4 text-sage-600 hover:text-sage-700 text-sm font-medium transition-colors">
              Read More &rarr;
            </a>
          </div>
        </article>
      `;
    }

    // Initial load
    loadPosts(1, '');

    // Search with debounce
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        currentQuery = searchInput.value.trim();
        currentPage = 1;
        hasMorePosts = true;
        loadPosts(1, currentQuery);
      }, 300));
    }

    // Load more
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        loadPosts(currentPage, currentQuery);
      });
    }

    // Subscribe form (shared with post.html)
    initSubscribeForm(subscribeForm);
  }


  // ========================================================
  //  3b. SHARED: Subscribe Form Handler
  // ========================================================

  function initSubscribeForm(form) {
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = form.querySelector('input[type="email"]');
      const email = (emailInput ? emailInput.value : '').trim();
      if (!email) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      const successEl = form.querySelector('.subscribe-success') || form.nextElementSibling;
      const errorEl = form.querySelector('.subscribe-error');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subscribing...';
      }

      try {
        await apiFetch('/api/subscribe', {
          method: 'POST',
          body: JSON.stringify({ email })
        });

        // Show success
        if (successEl) {
          successEl.textContent = 'You are subscribed!';
          successEl.classList.remove('hidden');
        }
        if (errorEl) errorEl.classList.add('hidden');
        form.reset();

        setTimeout(() => {
          if (successEl) successEl.classList.add('hidden');
        }, 5000);

      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message || 'Could not subscribe. Please try again.';
          errorEl.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Subscribe';
        }
      }
    });
  }


  // ========================================================
  //  3c. SHARED: Favorite Toggle Handler
  // ========================================================

  function attachFavoriteHandlers(container) {
    if (!container) return;

    container.querySelectorAll('.favorite-btn').forEach(btn => {
      // Avoid double-binding
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUser) {
          window.location.href = '/login.html';
          return;
        }

        const postId = btn.dataset.postId;
        const isFav = btn.dataset.favorited === '1';
        const svg = btn.querySelector('svg');

        try {
          if (isFav) {
            await apiFetch(`/api/favorites/${postId}`, { method: 'DELETE' });
            btn.dataset.favorited = '0';
            if (svg) svg.classList.replace('text-red-500', 'text-gray-300');
          } else {
            await apiFetch('/api/favorites', {
              method: 'POST',
              body: JSON.stringify({ post_id: postId })
            });
            btn.dataset.favorited = '1';
            if (svg) svg.classList.replace('text-gray-300', 'text-red-500');
          }
        } catch (err) {
          // Silently fail — user can retry
        }
      });
    });
  }


  // ========================================================
  //  4. SINGLE POST PAGE (post.html)
  // ========================================================

  function initPostPage() {
    const postTitle = document.getElementById('post-title');
    const postContent = document.getElementById('post-content');
    if (!postTitle || !postContent) return;

    const postDate = document.getElementById('post-date');
    const postReadingTime = document.getElementById('post-reading-time');
    const postFavoriteBtn = document.getElementById('post-favorite-btn');
    const postNotFound = document.getElementById('post-not-found');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const subscribeForm = document.getElementById('subscribe-form');

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
      showPostNotFound();
      return;
    }

    function showPostNotFound() {
      if (postNotFound) postNotFound.classList.remove('hidden');
      if (postTitle) postTitle.textContent = 'Post Not Found';
      if (postContent) postContent.innerHTML = '';
    }

    /**
     * Load the post data
     */
    async function loadPost() {
      try {
        const data = await apiFetch(`/api/posts/${encodeURIComponent(slug)}`);
        const post = data.post;
        if (!post) {
          showPostNotFound();
          return;
        }

        // Render post content
        postTitle.textContent = post.title || 'Untitled';
        if (postDate) postDate.textContent = formatDate(post.published_at || post.created_at);
        if (postReadingTime) postReadingTime.textContent = calcReadingTime(post.content);
        postContent.innerHTML = post.content || '';

        // Update page title
        document.title = `${post.title} | Amanda Levy, LCSW`;

        // Favorite button
        if (postFavoriteBtn && currentUser) {
          postFavoriteBtn.classList.remove('hidden');
          postFavoriteBtn.dataset.postId = post.id;
          postFavoriteBtn.dataset.favorited = post.is_favorited ? '1' : '0';
          updateFavoriteBtnUI(postFavoriteBtn);
          attachFavoriteHandlers(postFavoriteBtn.parentElement);
        }

        // Load comments
        loadComments(post.id);

        // Set up comment form
        initCommentForm(post.id);

      } catch (err) {
        if (err.message && err.message.includes('404')) {
          showPostNotFound();
        } else {
          postContent.innerHTML = '<p class="text-red-600">Unable to load this post. Please try again later.</p>';
        }
      }
    }

    function updateFavoriteBtnUI(btn) {
      if (!btn) return;
      const svg = btn.querySelector('svg');
      if (!svg) return;
      if (btn.dataset.favorited === '1') {
        svg.classList.remove('text-gray-300');
        svg.classList.add('text-red-500');
      } else {
        svg.classList.remove('text-red-500');
        svg.classList.add('text-gray-300');
      }
    }

    /**
     * Load comments for a post
     */
    async function loadComments(postId) {
      if (!commentsList) return;

      try {
        const data = await apiFetch(`/api/comments/${postId}`);
        const comments = data.comments || [];

        if (comments.length === 0) {
          commentsList.innerHTML = '<p class="text-gray-400 text-sm italic">No comments yet. Be the first to share your thoughts!</p>';
          return;
        }

        commentsList.innerHTML = comments.map(c => renderComment(c)).join('');

        // Attach delete handlers
        commentsList.querySelectorAll('.comment-delete-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this comment?')) return;

            try {
              await apiFetch(`/api/comments/${btn.dataset.commentId}`, { method: 'DELETE' });
              btn.closest('.comment-item').remove();

              // If no comments left, show placeholder
              if (commentsList.querySelectorAll('.comment-item').length === 0) {
                commentsList.innerHTML = '<p class="text-gray-400 text-sm italic">No comments yet. Be the first to share your thoughts!</p>';
              }
            } catch (err) {
              alert('Could not delete comment. Please try again.');
            }
          });
        });

      } catch (err) {
        commentsList.innerHTML = '<p class="text-gray-500 text-sm">Unable to load comments.</p>';
      }
    }

    /**
     * Render a single comment as HTML
     */
    function renderComment(comment) {
      const name = escapeHtml(comment.display_name || 'Anonymous');
      const text = escapeHtml(comment.content);
      const ago = timeAgo(comment.created_at);
      const isOwner = currentUser && (currentUser.id === comment.user_id || currentUser.is_admin);

      const deleteBtn = isOwner ? `
        <button class="comment-delete-btn text-gray-400 hover:text-red-500 text-xs transition-colors"
                data-comment-id="${comment.id}" aria-label="Delete comment">
          Delete
        </button>
      ` : '';

      return `
        <div class="comment-item border-b border-gray-100 py-4 last:border-0">
          <div class="flex items-center justify-between mb-1">
            <span class="font-medium text-sage-800 text-sm">${name}</span>
            <div class="flex items-center gap-3">
              <span class="text-gray-400 text-xs">${ago}</span>
              ${deleteBtn}
            </div>
          </div>
          <p class="text-gray-600 text-sm leading-relaxed">${text}</p>
        </div>
      `;
    }

    /**
     * Set up the comment form submission
     */
    function initCommentForm(postId) {
      if (!commentForm) return;

      // Show sign-in prompt if not logged in
      if (!currentUser) {
        commentForm.innerHTML = `
          <p class="text-gray-500 text-sm">
            <a href="/login.html" class="text-sage-600 hover:text-sage-700 font-medium">Sign in</a> to leave a comment.
          </p>
        `;
        return;
      }

      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const contentInput = commentForm.querySelector('#comment-content');
        const anonCheckbox = commentForm.querySelector('#comment-anonymous');
        const submitBtn = commentForm.querySelector('button[type="submit"]');
        const content = (contentInput ? contentInput.value : '').trim();

        if (!content) return;

        const originalText = submitBtn ? submitBtn.textContent : 'Post Comment';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Posting...';
        }

        try {
          await apiFetch('/api/comments', {
            method: 'POST',
            body: JSON.stringify({
              post_id: postId,
              content: content,
              is_anonymous: anonCheckbox ? anonCheckbox.checked : false
            })
          });

          // Reload comments to show the new one
          if (contentInput) contentInput.value = '';
          await loadComments(postId);

        } catch (err) {
          alert(err.message || 'Could not post comment. Please try again.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
      });
    }

    // Start loading the post
    loadPost();

    // Subscribe form
    initSubscribeForm(subscribeForm);
  }


  // ========================================================
  //  5. ADMIN PANEL (admin.html)
  // ========================================================

  function initAdminPage() {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;

    /**
     * Initialize admin — verify auth and admin status
     */
    function initAdmin() {
      if (!currentUser || !currentUser.is_admin) {
        window.location.href = '/login.html';
        return;
      }

      initAdminTabs();
      loadAdminPosts();
    }

    // Tab switching
    function initAdminTabs() {
      const tabBtns = adminPanel.querySelectorAll('.admin-tab-btn');
      const tabPanels = adminPanel.querySelectorAll('.admin-tab-panel');

      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;

          // Update button active states using .active CSS class
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          // Show target panel, hide others
          tabPanels.forEach(panel => {
            if (panel.id === `tab-${target}`) {
              panel.classList.remove('hidden');
            } else {
              panel.classList.add('hidden');
            }
          });

          // Load tab data on activation
          if (target === 'posts') loadAdminPosts();
          if (target === 'comments') loadAdminComments();
          if (target === 'subscribers') loadAdminSubscribers();
        });
      });
    }

    // --- Posts Tab ---

    async function loadAdminPosts() {
      const postsGrid = document.getElementById('admin-posts-grid');
      if (!postsGrid) return;

      postsGrid.innerHTML = '<p class="text-gray-400 text-sm py-4">Loading posts...</p>';

      try {
        const data = await apiFetch('/api/posts?all=1');
        const posts = data.posts || [];

        if (posts.length === 0) {
          postsGrid.innerHTML = '<p class="text-gray-500 py-4">No posts yet. Create your first one!</p>';
          return;
        }

        postsGrid.innerHTML = posts.map(post => {
          const date = formatDate(post.created_at);
          const title = escapeHtml(post.title || 'Untitled');
          const statusClass = post.status === 'published'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700';
          const statusLabel = post.status === 'published' ? 'Published' : 'Draft';

          return `
            <div class="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-sage-50/50 transition-colors">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-medium text-sage-900 truncate">${title}</h3>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}">${statusLabel}</span>
                </div>
                <p class="text-gray-400 text-xs">${date} &middot; ${post.slug}</p>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <button class="admin-edit-post-btn text-sage-600 hover:text-sage-800 text-sm font-medium transition-colors"
                        data-slug="${post.slug}">
                  Edit
                </button>
                <button class="admin-delete-post-btn text-gray-400 hover:text-red-600 text-sm transition-colors"
                        data-slug="${post.slug}" data-title="${escapeHtml(post.title)}">
                  Delete
                </button>
              </div>
            </div>
          `;
        }).join('');

        // Attach edit handlers
        postsGrid.querySelectorAll('.admin-edit-post-btn').forEach(btn => {
          btn.addEventListener('click', () => openPostEditor(btn.dataset.slug));
        });

        // Attach delete handlers
        postsGrid.querySelectorAll('.admin-delete-post-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm(`Delete "${btn.dataset.title}"? This cannot be undone.`)) return;
            try {
              await apiFetch(`/api/posts/${btn.dataset.slug}`, { method: 'DELETE' });
              loadAdminPosts();
            } catch (err) {
              alert(err.message || 'Could not delete post.');
            }
          });
        });

      } catch (err) {
        postsGrid.innerHTML = '<p class="text-red-600 py-4">Unable to load posts.</p>';
      }
    }

    // New Post button
    const newPostBtn = document.getElementById('admin-new-post-btn');
    if (newPostBtn) {
      newPostBtn.addEventListener('click', () => openPostEditor(null));
    }

    /**
     * Open the post editor (new or edit)
     */
    async function openPostEditor(slug) {
      const listView = document.getElementById('admin-posts-list-view');
      const editorView = document.getElementById('admin-post-editor');
      if (!listView || !editorView) return;

      listView.classList.add('hidden');
      editorView.classList.remove('hidden');
      editingSlug = slug;

      const titleInput = document.getElementById('editor-title');
      const slugInput = document.getElementById('editor-slug');
      const excerptInput = document.getElementById('editor-excerpt');
      const statusToggle = document.getElementById('editor-status');
      const editorContainer = document.getElementById('editor-content');
      const editorHeading = document.getElementById('editor-heading');

      // Initialize Quill if not done yet
      if (!quillEditor && editorContainer) {
        quillEditor = new Quill(editorContainer, {
          theme: 'snow',
          placeholder: 'Write your post...',
          modules: {
            toolbar: [
              [{ header: [2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              ['blockquote', 'code-block'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link', 'image'],
              ['clean']
            ]
          }
        });
      }

      // Reset form
      if (titleInput) titleInput.value = '';
      if (slugInput) slugInput.value = '';
      if (excerptInput) excerptInput.value = '';
      if (statusToggle) statusToggle.checked = false;
      if (quillEditor) quillEditor.setContents([]);

      if (slug) {
        // Load existing post for editing
        if (editorHeading) editorHeading.textContent = 'Edit Post';
        try {
          const data = await apiFetch(`/api/posts/${encodeURIComponent(slug)}`);
          const post = data.post;
          if (post) {
            if (titleInput) titleInput.value = post.title || '';
            if (slugInput) slugInput.value = post.slug || '';
            if (excerptInput) excerptInput.value = post.excerpt || '';
            if (statusToggle) statusToggle.checked = post.status === 'published';
            if (quillEditor && post.content) {
              quillEditor.root.innerHTML = post.content;
            }
          }
        } catch (err) {
          alert('Could not load post for editing.');
          closePostEditor();
        }
      } else {
        if (editorHeading) editorHeading.textContent = 'New Post';
      }

      // Auto-generate slug from title
      if (titleInput && slugInput) {
        titleInput.addEventListener('input', () => {
          if (!editingSlug) {
            slugInput.value = slugify(titleInput.value);
          }
        });
      }
    }

    function closePostEditor() {
      const listView = document.getElementById('admin-posts-list-view');
      const editorView = document.getElementById('admin-post-editor');
      if (listView) listView.classList.remove('hidden');
      if (editorView) editorView.classList.add('hidden');
      editingSlug = null;
    }

    // Cancel buttons (top and bottom of editor)
    const editorCancelBtn = document.getElementById('editor-cancel-btn');
    if (editorCancelBtn) {
      editorCancelBtn.addEventListener('click', closePostEditor);
    }
    const editorCancelBtn2 = document.getElementById('editor-cancel-btn-2');
    if (editorCancelBtn2) {
      editorCancelBtn2.addEventListener('click', closePostEditor);
    }

    // Save button
    const editorSaveBtn = document.getElementById('editor-save-btn');
    if (editorSaveBtn) {
      editorSaveBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('editor-title');
        const slugInput = document.getElementById('editor-slug');
        const excerptInput = document.getElementById('editor-excerpt');
        const statusToggle = document.getElementById('editor-status');

        const title = (titleInput ? titleInput.value : '').trim();
        const postSlug = (slugInput ? slugInput.value : '').trim();
        const excerpt = (excerptInput ? excerptInput.value : '').trim();
        const status = statusToggle && statusToggle.checked ? 'published' : 'draft';
        const content = quillEditor ? quillEditor.root.innerHTML : '';

        if (!title) {
          alert('Please enter a title.');
          return;
        }
        if (!postSlug) {
          alert('Please enter a slug.');
          return;
        }

        editorSaveBtn.disabled = true;
        editorSaveBtn.textContent = 'Saving...';

        try {
          const body = JSON.stringify({ title, slug: postSlug, excerpt, content, status });

          if (editingSlug) {
            // Update existing
            await apiFetch(`/api/posts/${encodeURIComponent(editingSlug)}`, {
              method: 'PUT',
              body
            });
          } else {
            // Create new
            await apiFetch('/api/posts', {
              method: 'POST',
              body
            });
          }

          closePostEditor();
          loadAdminPosts();

        } catch (err) {
          alert(err.message || 'Could not save post.');
        } finally {
          editorSaveBtn.disabled = false;
          editorSaveBtn.textContent = 'Save Post';
        }
      });
    }

    // Delete from editor
    const editorDeleteBtn = document.getElementById('editor-delete-btn');
    if (editorDeleteBtn) {
      editorDeleteBtn.addEventListener('click', async () => {
        if (!editingSlug) return;
        if (!confirm('Delete this post? This cannot be undone.')) return;

        try {
          await apiFetch(`/api/posts/${encodeURIComponent(editingSlug)}`, { method: 'DELETE' });
          closePostEditor();
          loadAdminPosts();
        } catch (err) {
          alert(err.message || 'Could not delete post.');
        }
      });
    }

    // --- Comments Tab ---

    async function loadAdminComments() {
      const commentsList = document.getElementById('admin-comments-list');
      if (!commentsList) return;

      commentsList.innerHTML = '<p class="text-gray-400 text-sm py-4 italic">Comment management will be added in Phase 4.</p>';
    }

    // --- Subscribers Tab ---

    async function loadAdminSubscribers() {
      const subscribersList = document.getElementById('admin-subscribers-list');
      if (!subscribersList) return;

      subscribersList.innerHTML = '<p class="text-gray-400 text-sm py-4">Loading subscribers...</p>';

      try {
        const data = await apiFetch('/api/admin/subscribers');
        const subscribers = data.subscribers || [];

        if (subscribers.length === 0) {
          subscribersList.innerHTML = '<p class="text-gray-500 py-4">No subscribers yet.</p>';
          return;
        }

        subscribersList.innerHTML = `
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th class="py-3 px-4">Email</th>
                  <th class="py-3 px-4">Subscribed</th>
                  <th class="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                ${subscribers.map(sub => {
                  const statusClass = sub.status === 'active'
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-500 bg-gray-50';
                  return `
                    <tr class="border-b border-gray-50 hover:bg-sage-50/50">
                      <td class="py-3 px-4 font-medium text-gray-700">${escapeHtml(sub.email)}</td>
                      <td class="py-3 px-4 text-gray-500">${formatDate(sub.created_at)}</td>
                      <td class="py-3 px-4">
                        <span class="text-xs px-2 py-0.5 rounded-full ${statusClass} capitalize">${sub.status || 'active'}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <p class="text-gray-400 text-xs mt-4">${subscribers.length} subscriber${subscribers.length !== 1 ? 's' : ''} total</p>
        `;

      } catch (err) {
        subscribersList.innerHTML = '<p class="text-red-600 py-4">Unable to load subscribers.</p>';
      }
    }

    // Run admin init
    initAdmin();
  }


  // ========================================================
  //  6. USER PORTAL (portal.html)
  // ========================================================

  function initPortalPage() {
    const portalPanel = document.getElementById('portal-panel');
    if (!portalPanel) return;

    /**
     * Initialize portal — verify auth
     */
    function initPortal() {
      if (!currentUser) {
        window.location.href = '/login.html';
        return;
      }

      initPortalTabs();

      // Handle ?welcome=1 for new users
      const params = new URLSearchParams(window.location.search);
      if (params.get('welcome') === '1') {
        const welcomeBanner = document.getElementById('portal-welcome-banner');
        if (welcomeBanner) welcomeBanner.classList.remove('hidden');

        // Auto-activate the Profile tab
        activatePortalTab('profile');
      } else {
        // Default: load comments tab
        loadPortalComments();
      }
    }

    function activatePortalTab(tabName) {
      const tabBtns = portalPanel.querySelectorAll('.portal-tab-btn');
      const tabPanels = portalPanel.querySelectorAll('.portal-tab-panel');

      // Update button active states using .active CSS class
      tabBtns.forEach(b => {
        b.classList.remove('active');
        if (b.dataset.tab === tabName) {
          b.classList.add('active');
        }
      });

      tabPanels.forEach(panel => {
        if (panel.id === `tab-${tabName}`) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });

      // Load tab data
      if (tabName === 'comments') loadPortalComments();
      if (tabName === 'favorites') loadPortalFavorites();
      if (tabName === 'profile') loadPortalProfile();
      if (tabName === 'settings') loadPortalSettings();
    }

    // Tab switching
    function initPortalTabs() {
      const tabBtns = portalPanel.querySelectorAll('.portal-tab-btn');

      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          activatePortalTab(btn.dataset.tab);
        });
      });
    }

    // --- My Comments Tab ---

    async function loadPortalComments() {
      const commentsList = document.getElementById('portal-comments-list');
      if (!commentsList) return;

      commentsList.innerHTML = '<p class="text-gray-400 text-sm py-4">Loading your comments...</p>';

      try {
        const data = await apiFetch('/api/portal/my-comments');
        const comments = data.comments || [];

        if (comments.length === 0) {
          commentsList.innerHTML = '<p class="text-gray-500 py-4">You haven\'t left any comments yet.</p>';
          return;
        }

        commentsList.innerHTML = comments.map(c => {
          const postTitle = escapeHtml(c.post_title || 'Unknown post');
          const text = escapeHtml(c.content);
          const ago = timeAgo(c.created_at);

          return `
            <div class="portal-comment-item border-b border-gray-100 py-4 last:border-0">
              <div class="flex items-center justify-between mb-1">
                <a href="post.html?slug=${encodeURIComponent(c.post_slug || '')}" class="text-sage-600 hover:text-sage-700 font-medium text-sm transition-colors">${postTitle}</a>
                <div class="flex items-center gap-3">
                  <span class="text-gray-400 text-xs">${ago}</span>
                  <button class="portal-delete-comment-btn text-gray-400 hover:text-red-500 text-xs transition-colors"
                          data-comment-id="${c.id}" aria-label="Delete comment">
                    Delete
                  </button>
                </div>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed">${text}</p>
            </div>
          `;
        }).join('');

        // Delete handlers
        commentsList.querySelectorAll('.portal-delete-comment-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Delete this comment?')) return;
            try {
              await apiFetch(`/api/comments/${btn.dataset.commentId}`, { method: 'DELETE' });
              btn.closest('.portal-comment-item').remove();
              if (commentsList.querySelectorAll('.portal-comment-item').length === 0) {
                commentsList.innerHTML = '<p class="text-gray-500 py-4">You haven\'t left any comments yet.</p>';
              }
            } catch (err) {
              alert('Could not delete comment.');
            }
          });
        });

      } catch (err) {
        commentsList.innerHTML = '<p class="text-red-600 py-4">Unable to load your comments.</p>';
      }
    }

    // --- Favorites Tab ---

    async function loadPortalFavorites() {
      const favoritesList = document.getElementById('portal-favorites-list');
      if (!favoritesList) return;

      favoritesList.innerHTML = '<p class="text-gray-400 text-sm py-4">Loading your favorites...</p>';

      try {
        const data = await apiFetch('/api/favorites');
        const posts = data.posts || data.favorites || [];

        if (posts.length === 0) {
          favoritesList.innerHTML = '<p class="text-gray-500 py-4">No favorites yet. Heart a post to save it here!</p>';
          return;
        }

        favoritesList.innerHTML = posts.map(post => {
          const title = escapeHtml(post.title || 'Untitled');
          const date = formatDate(post.published_at || post.created_at);
          const excerpt = escapeHtml(post.excerpt || '');

          return `
            <div class="portal-favorite-item flex items-start gap-4 border-b border-gray-100 py-4 last:border-0">
              <div class="flex-1 min-w-0">
                <a href="post.html?slug=${encodeURIComponent(post.slug)}" class="font-medium text-sage-900 hover:text-sage-600 transition-colors">${title}</a>
                <p class="text-gray-400 text-xs mt-1">${date}</p>
                ${excerpt ? `<p class="text-gray-600 text-sm mt-1 line-clamp-2">${excerpt}</p>` : ''}
              </div>
              <button class="portal-unfavorite-btn text-red-400 hover:text-red-600 p-1 transition-colors flex-shrink-0"
                      data-post-id="${post.id}" aria-label="Remove from favorites">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>
          `;
        }).join('');

        // Unfavorite handlers
        favoritesList.querySelectorAll('.portal-unfavorite-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            try {
              await apiFetch(`/api/favorites/${btn.dataset.postId}`, { method: 'DELETE' });
              btn.closest('.portal-favorite-item').remove();
              if (favoritesList.querySelectorAll('.portal-favorite-item').length === 0) {
                favoritesList.innerHTML = '<p class="text-gray-500 py-4">No favorites yet. Heart a post to save it here!</p>';
              }
            } catch (err) {
              alert('Could not remove favorite.');
            }
          });
        });

      } catch (err) {
        favoritesList.innerHTML = '<p class="text-red-600 py-4">Unable to load favorites.</p>';
      }
    }

    // --- Profile Tab ---

    async function loadPortalProfile() {
      const profileForm = document.getElementById('portal-profile-form');
      const profileEmail = document.getElementById('portal-profile-email');
      const profileName = document.getElementById('portal-profile-name');
      if (!profileForm) return;

      // Show current user info
      if (profileEmail) profileEmail.value = currentUser.email || '';
      if (profileName) profileName.value = currentUser.display_name || '';

      // Remove old listener by replacing node
      const newForm = profileForm.cloneNode(true);
      profileForm.parentNode.replaceChild(newForm, profileForm);

      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = newForm.querySelector('#portal-profile-name');
        const displayName = (nameInput ? nameInput.value : '').trim();
        const submitBtn = newForm.querySelector('button[type="submit"]');
        const feedback = newForm.querySelector('.profile-feedback');

        if (!displayName) {
          alert('Display name cannot be empty.');
          return;
        }

        const originalText = submitBtn ? submitBtn.textContent : 'Save';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving...';
        }

        try {
          await apiFetch('/api/portal/profile', {
            method: 'PUT',
            body: JSON.stringify({ display_name: displayName })
          });

          currentUser.display_name = displayName;
          updateAuthUI();

          if (feedback) {
            feedback.textContent = 'Profile updated!';
            feedback.classList.remove('hidden', 'text-red-600');
            feedback.classList.add('text-green-600');
            setTimeout(() => feedback.classList.add('hidden'), 3000);
          }

        } catch (err) {
          if (feedback) {
            feedback.textContent = err.message || 'Could not save profile.';
            feedback.classList.remove('hidden', 'text-green-600');
            feedback.classList.add('text-red-600');
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
      });
    }

    // --- Settings Tab ---

    async function loadPortalSettings() {
      const subscriptionToggle = document.getElementById('portal-subscription-toggle');
      const deleteAccountBtn = document.getElementById('portal-delete-account-btn');

      // Subscription toggle
      if (subscriptionToggle) {
        // Check current subscription status
        try {
          const data = await apiFetch('/api/portal/subscription-status');
          subscriptionToggle.checked = data.subscribed || false;
        } catch (e) {
          // Default to unchecked
        }

        // Remove old listener
        const newToggle = subscriptionToggle.cloneNode(true);
        subscriptionToggle.parentNode.replaceChild(newToggle, subscriptionToggle);

        newToggle.addEventListener('change', async () => {
          try {
            if (newToggle.checked) {
              await apiFetch('/api/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email: currentUser.email })
              });
            } else {
              await apiFetch('/api/unsubscribe', {
                method: 'POST',
                body: JSON.stringify({ email: currentUser.email })
              });
            }
          } catch (err) {
            // Revert on error
            newToggle.checked = !newToggle.checked;
            alert(err.message || 'Could not update subscription.');
          }
        });
      }

      // Delete account
      if (deleteAccountBtn) {
        // Remove old listener
        const newBtn = deleteAccountBtn.cloneNode(true);
        deleteAccountBtn.parentNode.replaceChild(newBtn, deleteAccountBtn);

        newBtn.addEventListener('click', async () => {
          const first = confirm('Are you sure you want to delete your account? This will remove all your comments and favorites.');
          if (!first) return;

          const second = confirm('This action is permanent and cannot be undone. Delete your account?');
          if (!second) return;

          try {
            await apiFetch('/api/portal/account', { method: 'DELETE' });
            window.location.href = '/blog.html';
          } catch (err) {
            alert(err.message || 'Could not delete account. Please try again.');
          }
        });
      }
    }

    // Run portal init
    initPortal();
  }

});
