/**
 * <tienda-header> — Encabezado modular para tienda en línea
 * ------------------------------------------------------------
 * Web Component nativo (sin frameworks, sin dependencias).
 * Usa Shadow DOM: su CSS nunca choca con el de la página host,
 * y el CSS de la página host nunca lo rompe a él.
 *
 * USO MÍNIMO:
 *   <script src="tienda-header.js"></script>
 *   <tienda-header store-name="Mi Tienda"></tienda-header>
 *
 * Ver README.md para la lista completa de atributos, variables
 * CSS, slots, eventos y métodos JS.
 */

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = /* html */ `
<style>
  :host {
    /* ---------- Tokens personalizables (variables CSS) ---------- */
    --th-bg: #ffffff;
    --th-text: #14181f;
    --th-muted: #6b7280;
    --th-accent: #3454d1;
    --th-accent-text: #ffffff;
    --th-border: #e6e8ec;
    --th-height: 72px;
    --th-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --th-radius: 8px;
    --th-max-width: 1280px;
    --th-padding-x: 24px;
    --th-z: 100;

    display: block;
    font-family: var(--th-font);
    color: var(--th-text);
  }

  :host([sticky]) .th-bar {
    position: sticky;
    top: 0;
    z-index: var(--th-z);
  }

  * { box-sizing: border-box; }

  .th-bar {
    background: var(--th-bg);
    border-bottom: 1px solid var(--th-border);
    width: 100%;
  }

  .th-inner {
    max-width: var(--th-max-width);
    margin: 0 auto;
    height: var(--th-height);
    padding: 0 var(--th-padding-x);
    display: flex;
    align-items: center;
    gap: 24px;
  }

  /* ---------- Logo ---------- */
  .th-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--th-text);
    font-weight: 700;
    font-size: 1.125rem;
    flex-shrink: 0;
    cursor: pointer;
    background: none;
    border: none;
    font-family: inherit;
    padding: 0;
  }
  .th-logo img { height: 32px; width: auto; display: block; }
  .th-logo span { white-space: nowrap; }

  /* ---------- Navegación ---------- */
  nav.th-nav {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .th-nav ul {
    list-style: none;
    display: flex;
    gap: 4px;
    margin: 0;
    padding: 0;
    flex-wrap: nowrap;
  }

  .th-nav li { flex-shrink: 0; }

  .th-nav li { position: relative; }

  .th-nav a, .th-nav button.th-navlink {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border-radius: var(--th-radius);
    color: var(--th-text);
    text-decoration: none;
    font-size: 0.9375rem;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }
  .th-nav a:hover, .th-nav button.th-navlink:hover { background: color-mix(in srgb, var(--th-accent) 8%, transparent); }

  .th-caret { width: 10px; height: 10px; transition: transform .15s ease; opacity: .6; }
  .th-nav li.th-open .th-caret { transform: rotate(180deg); }

  .th-submenu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 200px;
    background: var(--th-bg);
    border: 1px solid var(--th-border);
    border-radius: var(--th-radius);
    box-shadow: 0 8px 24px rgba(0,0,0,.08);
    padding: 6px;
    display: none;
    flex-direction: column;
    z-index: calc(var(--th-z) + 1);
  }
  .th-nav li.th-open .th-submenu { display: flex; }
  .th-submenu a {
    padding: 8px 10px;
    border-radius: 6px;
    font-weight: 400;
  }

  /* ---------- Búsqueda ---------- */
  .th-search {
    display: flex;
    align-items: center;
    flex: 0 1 220px;
    min-width: 0;
    border: 1px solid var(--th-border);
    border-radius: 999px;
    padding: 0 6px 0 14px;
    height: 40px;
    background: #fafafa;
  }
  .th-search input {
    border: none;
    background: none;
    outline: none;
    flex: 1;
    font-size: 0.9375rem;
    font-family: inherit;
    min-width: 0;
    color: var(--th-text);
  }
  .th-search input::placeholder { color: var(--th-muted); }
  .th-search button {
    border: none;
    background: var(--th-accent);
    color: var(--th-accent-text);
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .th-search svg { width: 16px; height: 16px; }

  /* ---------- Acciones (cuenta / carrito) ---------- */
  .th-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .th-icon-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--th-text);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 8px 10px;
    border-radius: var(--th-radius);
  }
  .th-icon-btn:hover { background: color-mix(in srgb, var(--th-accent) 8%, transparent); }
  .th-icon-btn svg { width: 22px; height: 22px; flex-shrink: 0; }

  .th-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    background: var(--th-accent);
    color: var(--th-accent-text);
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1;
    min-width: 16px;
    height: 16px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
  }

  .th-login-btn {
    background: var(--th-accent);
    color: var(--th-accent-text);
    border-radius: var(--th-radius);
    padding: 9px 16px;
  }
  .th-login-btn:hover { opacity: .92; background: var(--th-accent); }

  /* ---------- Hamburguesa / móvil ---------- */
  .th-burger {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    color: var(--th-text);
  }
  .th-burger svg { width: 24px; height: 24px; }

  @media (max-width: 1040px) {
    .th-search { display: none; }
    nav.th-nav { display: none; }
    .th-burger { display: flex; }

    :host([data-mobile-open]) nav.th-nav {
      display: flex;
      position: fixed;
      top: var(--th-height);
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--th-bg);
      flex-direction: column;
      align-items: stretch;
      padding: 12px;
      overflow-y: auto;
      z-index: calc(var(--th-z) - 1);
    }
    :host([data-mobile-open]) .th-nav ul { flex-direction: column; width: 100%; }
    :host([data-mobile-open]) .th-nav li { width: 100%; }
    :host([data-mobile-open]) .th-nav a,
    :host([data-mobile-open]) .th-nav button.th-navlink { width: 100%; padding: 12px; }
    :host([data-mobile-open]) .th-submenu { position: static; box-shadow: none; border: none; padding-left: 12px; }

    :host([data-mobile-open]) .th-mobile-search {
      display: flex;
      margin: 4px 0 16px;
    }
  }

  .th-mobile-search-box {
    display: flex;
    align-items: center;
    border: 1px solid var(--th-border);
    border-radius: 999px;
    padding: 0 6px 0 14px;
    height: 42px;
    background: #fafafa;
    width: 100%;
  }
  .th-mobile-search-box input {
    border: none;
    background: none;
    outline: none;
    flex: 1;
    min-width: 0;
    font-size: 0.9375rem;
    font-family: inherit;
    color: var(--th-text);
  }
  .th-mobile-search-box input::placeholder { color: var(--th-muted); }
  .th-mobile-search-box button {
    border: none;
    background: var(--th-accent);
    color: var(--th-accent-text);
    width: 32px;
    height: 32px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .th-mobile-search-box svg { width: 16px; height: 16px; }

  .th-mobile-search { display: none; }

  .th-sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }

  :host(:focus-within) a:focus-visible,
  :host(:focus-within) button:focus-visible {
    outline: 2px solid var(--th-accent);
    outline-offset: 2px;
  }
</style>

<div class="th-bar">
  <div class="th-inner">
    <button class="th-burger" part="burger" aria-label="Abrir menú" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>

    <a class="th-logo" part="logo" href="#" id="th-logo-link">
      <slot name="logo"></slot>
    </a>

    <nav class="th-nav" part="nav" aria-label="Navegación principal">
      <div id="th-mobile-search" class="th-mobile-search">
        <div class="th-mobile-search-box">
          <input type="search" id="th-mobile-search-input" placeholder="Buscar productos…" aria-label="Buscar productos" />
          <button id="th-mobile-search-btn" aria-label="Buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </div>
      <slot name="nav"></slot>
      <ul id="th-menu-list"></ul>
    </nav>

    <div class="th-search" part="search">
      <input type="search" id="th-search-input" placeholder="Buscar productos…" aria-label="Buscar productos" />
      <button id="th-search-btn" aria-label="Buscar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>
    </div>

    <div class="th-actions" part="actions">
      <slot name="actions"></slot>
    </div>
  </div>
</div>
`;

class TiendaHeader extends HTMLElement {
  static get observedAttributes() {
    return [
      'store-name', 'logo-src', 'menu', 'show-search', 'show-cart',
      'show-login', 'cart-count', 'user-name', 'sticky', 'logo-href'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
    this._menu = [];
    this._cartCount = 0;
    this._user = null;
  }

  connectedCallback() {
    this._$logo = this.shadowRoot.getElementById('th-logo-link');
    this._$menuList = this.shadowRoot.getElementById('th-menu-list');
    this._$searchInput = this.shadowRoot.getElementById('th-search-input');
    this._$searchBtn = this.shadowRoot.getElementById('th-search-btn');
    this._$burger = this.shadowRoot.querySelector('.th-burger');
    this._$searchWrap = this.shadowRoot.querySelector('.th-search');
    this._$mobileSearchInput = this.shadowRoot.getElementById('th-mobile-search-input');
    this._$mobileSearchBtn = this.shadowRoot.getElementById('th-mobile-search-btn');
    this._$actions = this.shadowRoot.querySelector('.th-actions');

    this._renderLogo();
    this._renderMenuFromAttr();
    this._renderActions();
    this._bindEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'store-name' || name === 'logo-src' || name === 'logo-href') this._renderLogo();
    if (name === 'menu') this._renderMenuFromAttr();
    if (['show-search', 'show-cart', 'show-login', 'cart-count', 'user-name'].includes(name)) this._renderActions();
  }

  /* ---------------- Logo ---------------- */
  _renderLogo() {
    if (!this._$logo) return;
    // Si el usuario ya puso contenido en el slot "logo", no lo pisamos.
    if (this.querySelector('[slot="logo"]')) return;

    const name = this.getAttribute('store-name') || 'Mi Tienda';
    const logoSrc = this.getAttribute('logo-src');
    this._$logo.href = this.getAttribute('logo-href') || '#';
    this._$logo.innerHTML = '';

    if (logoSrc) {
      const img = document.createElement('img');
      img.src = logoSrc;
      img.alt = name;
      this._$logo.appendChild(img);
    }
    const span = document.createElement('span');
    span.textContent = name;
    this._$logo.appendChild(span);
  }

  /* ---------------- Menú ---------------- */
  _renderMenuFromAttr() {
    const raw = this.getAttribute('menu');
    if (!raw) return;
    try {
      this._menu = JSON.parse(raw);
      this.setMenu(this._menu);
    } catch (e) {
      console.warn('[tienda-header] atributo "menu" no es JSON válido:', e);
    }
  }

  /** API pública: setMenu([{label, href, children:[{label,href}]}]) */
  setMenu(items) {
    this._menu = items || [];
    if (!this._$menuList) return;
    this._$menuList.innerHTML = '';

    this._menu.forEach((item) => {
      const li = document.createElement('li');
      const hasChildren = Array.isArray(item.children) && item.children.length;

      if (hasChildren) {
        const btn = document.createElement('button');
        btn.className = 'th-navlink';
        btn.type = 'button';
        btn.innerHTML = `<span>${item.label}</span>
          <svg class="th-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const open = li.classList.toggle('th-open');
          this._closeOtherMenus(li);
          btn.setAttribute('aria-expanded', String(open));
        });
        li.appendChild(btn);

        const sub = document.createElement('div');
        sub.className = 'th-submenu';
        item.children.forEach((child) => {
          const a = document.createElement('a');
          a.href = child.href || '#';
          a.textContent = child.label;
          sub.appendChild(a);
        });
        li.appendChild(sub);
      } else {
        const a = document.createElement('a');
        a.href = item.href || '#';
        a.textContent = item.label;
        li.appendChild(a);
      }
      this._$menuList.appendChild(li);
    });
  }

  _closeOtherMenus(exceptLi) {
    this._$menuList.querySelectorAll('li.th-open').forEach((li) => {
      if (li !== exceptLi) li.classList.remove('th-open');
    });
  }

  /* ---------------- Acciones (búsqueda / login / carrito) ---------------- */
  _renderActions() {
    if (!this._$actions) return;

    const showSearch = this.getAttribute('show-search') !== 'false';
    const showLogin = this.getAttribute('show-login') !== 'false';
    const showCart = this.getAttribute('show-cart') !== 'false';
    const userName = this.getAttribute('user-name');
    const cartCount = this.getAttribute('cart-count') || this._cartCount || '0';

    if (this._$searchWrap) {
      if (showSearch) {
        this._$searchWrap.style.removeProperty('display'); // deja que el CSS / @media decida
      } else {
        this._$searchWrap.style.display = 'none'; // forzado a ocultarse por atributo
      }
    }

    // Limpia botones generados previamente (deja el slot "actions" y la búsqueda móvil intactos)
    this._$actions.querySelectorAll('[data-generated]').forEach((el) => el.remove());

    if (!this.querySelector('[slot="actions"]')) {
      if (showLogin) {
        const btn = document.createElement('button');
        btn.setAttribute('data-generated', '');
        btn.className = userName ? 'th-icon-btn' : 'th-icon-btn th-login-btn';
        btn.type = 'button';
        btn.innerHTML = userName
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg><span>${userName}</span>`
          : `Iniciar sesión`;
        btn.addEventListener('click', () => this._emit('login-click', { userName }));
        this._$actions.insertBefore(btn, this._$actions.firstChild);
      }
      if (showCart) {
        const btn = document.createElement('button');
        btn.setAttribute('data-generated', '');
        btn.className = 'th-icon-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Carrito de compras');
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span class="th-badge">${cartCount}</span>`;
        btn.addEventListener('click', () => this._emit('cart-click', { count: Number(cartCount) }));
        this._$actions.appendChild(btn);
      }
    }
  }

  /** API pública: actualiza el número del carrito sin re-renderizar todo */
  setCartCount(n) {
    this._cartCount = n;
    this.setAttribute('cart-count', String(n));
    const badge = this.shadowRoot.querySelector('.th-badge');
    if (badge) badge.textContent = String(n);
  }

  /** API pública: refleja sesión iniciada / cerrada */
  setUser(user) {
    this._user = user;
    if (user && user.name) this.setAttribute('user-name', user.name);
    else this.removeAttribute('user-name');
  }

  /* ---------------- Eventos ---------------- */
  _bindEvents() {
    this._$searchBtn.addEventListener('click', () => this._doSearch());
    this._$searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._doSearch();
    });

    this._$mobileSearchBtn.addEventListener('click', () => this._doSearch(this._$mobileSearchInput));
    this._$mobileSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._doSearch(this._$mobileSearchInput);
    });

    this._$burger.addEventListener('click', () => {
      const open = this.toggleAttribute('data-mobile-open');
      this._$burger.setAttribute('aria-expanded', String(open));
      this._emit('menu-toggle', { open });
    });

    // Cierra submenús / menú móvil al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!e.composedPath().includes(this)) {
        this._$menuList?.querySelectorAll('li.th-open').forEach((li) => li.classList.remove('th-open'));
      }
    });

    this._$logo.addEventListener('click', (e) => {
      if (this._$logo.getAttribute('href') === '#') e.preventDefault();
      this._emit('logo-click', {});
    });
  }

  _doSearch(sourceInput) {
    const input = sourceInput || this._$searchInput;
    const query = input.value.trim();
    this._emit('header-search', { query });
  }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}

customElements.define('tienda-header', TiendaHeader);