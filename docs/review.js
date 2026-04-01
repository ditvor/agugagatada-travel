/**
 * Agugagatada — Review / annotation mode
 *
 * Activate: Shift+F
 * Deactivate: Shift+F again, or click "Exit" badge, or press Escape
 *
 * In review mode: hover any text element to highlight it, click to leave a comment.
 * Feedback is sent via your mail client with full context pre-filled.
 *
 * Config: set your email address below.
 */

(function () {
  'use strict';

  var FEEDBACK_EMAIL = ''; // e.g. 'igor@example.com'

  // ── State ────────────────────────────────────────────────────────────────────

  var active = false;
  var badge  = null;
  var tooltip = null;

  // ── Elements to make reviewable ──────────────────────────────────────────────

  var SELECTORS = [
    'h1', 'h2', 'h3',
    'p',
    'blockquote',
    'li'
  ].join(', ');

  // Parents whose children should never be reviewable (tags, nav, footer, buttons)
  var EXCLUDED_PARENTS = [
    '.site-nav',
    '.site-footer',
    '.hero__tags',
    '.stop__tags',
    '.hike-card__tags',
    '.hike-card-full__stats',
    '.hike-card-full__badges',
    '.hotel-card__tags',
    '.detour-card__tags',
    '.detour-card__time-tags',
    '.hike-filter-tabs',
    '.hike-list',
    '.day-switcher'
  ].join(', ');

  // ── Init ─────────────────────────────────────────────────────────────────────

  document.addEventListener('keydown', function (e) {
    if (e.shiftKey && e.key === 'F') {
      e.preventDefault();
      active ? deactivate() : activate();
    }
    if (e.key === 'Escape') {
      if (tooltip) { closeTooltip(); return; }
      if (active)  { deactivate(); }
    }
  });

  // ── Activate / deactivate ────────────────────────────────────────────────────

  function activate() {
    active = true;
    document.body.classList.add('review-active');
    tagTargets();
    showBadge();
    document.addEventListener('click', onBodyClick, true);
  }

  function deactivate() {
    active = false;
    document.body.classList.remove('review-active');
    closeTooltip();
    hideBadge();
    document.querySelectorAll('[data-reviewable]').forEach(function (el) {
      el.removeAttribute('data-reviewable');
    });
    document.removeEventListener('click', onBodyClick, true);
  }

  // ── Tag reviewable elements ──────────────────────────────────────────────────

  function tagTargets() {
    document.querySelectorAll(SELECTORS).forEach(function (el) {
      if (EXCLUDED_PARENTS && el.closest(EXCLUDED_PARENTS)) return;
      if (el.textContent.trim().length < 12) return;
      // Skip purely structural wrappers with no direct text
      if (el.tagName === 'LI' && el.querySelector('ul, ol')) return;
      el.setAttribute('data-reviewable', '1');
    });
  }

  // ── Badge ────────────────────────────────────────────────────────────────────

  function showBadge() {
    badge = document.createElement('div');
    badge.className = 'review-badge';
    badge.innerHTML =
      '<span class="review-badge__dot"></span>' +
      'Review mode — click any text to comment' +
      '<button class="review-badge__exit">Exit (Shift+F)</button>';
    badge.querySelector('.review-badge__exit').addEventListener('click', deactivate);
    document.body.appendChild(badge);
  }

  function hideBadge() {
    if (badge) { badge.remove(); badge = null; }
  }

  // ── Click handler ────────────────────────────────────────────────────────────

  function onBodyClick(e) {
    var reviewable = e.target.closest('[data-reviewable]');

    if (reviewable) {
      e.preventDefault();
      e.stopPropagation();
      openTooltip(reviewable);
      return;
    }

    // Click outside tooltip closes it
    if (tooltip && !tooltip.contains(e.target)) {
      closeTooltip();
    }
  }

  // ── Tooltip ──────────────────────────────────────────────────────────────────

  function openTooltip(el) {
    closeTooltip();

    var fullText = el.textContent.trim();
    var preview  = fullText.length > 90 ? fullText.slice(0, 90) + '…' : fullText;

    tooltip = document.createElement('div');
    tooltip.className = 'review-tooltip';
    tooltip.innerHTML =
      '<p class="review-tooltip__label">Commenting on:</p>' +
      '<p class="review-tooltip__context">' + esc(preview) + '</p>' +
      '<textarea class="review-tooltip__input" placeholder="Typo, wrong info, suggestion…" rows="3"></textarea>' +
      '<div class="review-tooltip__row">' +
        '<button class="review-tooltip__send">Send</button>' +
        '<button class="review-tooltip__cancel">Cancel</button>' +
      '</div>';

    tooltip.querySelector('.review-tooltip__send').addEventListener('click', function () {
      var note = tooltip.querySelector('.review-tooltip__input').value.trim();
      if (!note) {
        tooltip.querySelector('.review-tooltip__input').focus();
        return;
      }
      send(fullText, note);
      closeTooltip();
    });

    tooltip.querySelector('.review-tooltip__cancel').addEventListener('click', closeTooltip);

    document.body.appendChild(tooltip);
    position(tooltip, el);
    tooltip.querySelector('textarea').focus();
  }

  function closeTooltip() {
    if (tooltip) { tooltip.remove(); tooltip = null; }
  }

  function position(tip, el) {
    var rect  = el.getBoundingClientRect();
    var scrollY = window.pageYOffset;
    var scrollX = window.pageXOffset;
    var tipW  = 320;
    var tipH  = 180; // approximate

    // Prefer below the element
    var top  = rect.bottom + scrollY + 10;
    var left = rect.left   + scrollX;

    // Clamp horizontally within viewport
    var maxLeft = scrollX + window.innerWidth - tipW - 16;
    left = Math.min(left, maxLeft);
    left = Math.max(left, scrollX + 8);

    // If not enough space below, place above
    if (rect.bottom + tipH + 20 > window.innerHeight) {
      top = rect.top + scrollY - tipH - 10;
    }

    tip.style.top  = top  + 'px';
    tip.style.left = left + 'px';
  }

  // ── Send feedback ─────────────────────────────────────────────────────────────

  function send(elementText, comment) {
    var pageTitle = document.title;
    var pageUrl   = window.location.href;

    var subject = '[Review] ' + pageTitle;

    var body =
      'Page: ' + pageTitle + '\n' +
      'URL: ' + pageUrl + '\n\n' +
      '--- Element ---\n' +
      '"' + elementText.slice(0, 300) + '"\n\n' +
      '--- Comment ---\n' +
      comment;

    var href = 'mailto:' + encodeURIComponent(FEEDBACK_EMAIL) +
      '?subject=' + encodeURIComponent(subject) +
      '&body='    + encodeURIComponent(body);

    window.open(href, '_self');
  }

  // ── Utility ──────────────────────────────────────────────────────────────────

  function esc(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
