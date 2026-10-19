(() => {
  if (window.__SRV_MENU_INITIALIZED__) return;

  const data = window.SRV_MENU_DATA;
  const tabs = document.getElementById('menuTabs');
  const grid = document.getElementById('menuItemsGrid');
  const search = document.getElementById('menuSearch');
  const result = document.getElementById('menuResultMessage');
  const empty = document.getElementById('menuNoResults');
  const fixedHeader = document.querySelector('header');
  const mainContent = document.querySelector('main');
  if (fixedHeader && mainContent) {
    const syncMainOffset = () => { mainContent.style.paddingTop = `${Math.ceil(fixedHeader.getBoundingClientRect().height)}px`; };
    syncMainOffset();
    if ('ResizeObserver' in window) new ResizeObserver(syncMainOffset).observe(fixedHeader);
    else window.addEventListener('resize', syncMainOffset);
  }
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavigation = document.getElementById('mobileNavigation');
  if (mobileMenu && mobileMenuToggle && mobileNavigation && !window.__SRV_MOBILE_NAV_INITIALIZED__) {
    window.__SRV_MOBILE_NAV_INITIALIZED__ = true;
    const syncMobileMenuState = () => {
      mobileMenuToggle.setAttribute('aria-expanded', String(mobileMenu.open));
    };
    const closeMobileMenu = () => {
      mobileMenu.open = false;
      syncMobileMenuState();
    };
    mobileMenu.addEventListener('toggle', syncMobileMenuState);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && mobileMenu.open) {
        event.preventDefault();
        closeMobileMenu();
        mobileMenuToggle.focus();
      }
    });
    mobileNavigation.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      const target = href && href.startsWith('#') ? document.getElementById(decodeURIComponent(href.slice(1))) : null;
      closeMobileMenu();
      if (!target) return;
      event.preventDefault();
      history.pushState(null, '', href);
      requestAnimationFrame(() => {
        const headerOffset = fixedHeader ? fixedHeader.getBoundingClientRect().height : 0;
        const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }
  if (!data || !tabs || !grid || !search || !result || !empty) {
    console.error('Restaurant menu initialization failed: required data or elements are missing.');
    if (result) result.textContent = 'Menu data could not be loaded.';
    return;
  }
  window.__SRV_MENU_INITIALIZED__ = true;

  const normalizeCategory = value => String(value).normalize('NFKC').trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  const categories = data.restaurantCategories.map(category => ({
    name: category.name === 'Breakfast and South Indian Specials' ? 'Breakfast' : category.name,
    key: normalizeCategory(category.name)
  }));
  let activeCategory = categories[0]?.key ?? '';
  const filterButtons = [];

  categories.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-tab-btn shrink-0 rounded-xl bg-surface-container px-4 py-2.5 font-title-md text-body-sm text-on-surface-variant transition-all hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary';
    button.textContent = category.name;
    button.dataset.category = category.key;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => { activeCategory = category.key; updateMenu(); });
    tabs.append(button);
    filterButtons.push(button);
  });

  data.restaurantCategories.forEach(category => category.items.forEach(name => {
    const card = document.createElement('article');
    card.className = 'menu-card flex min-h-14 items-center gap-2 rounded-lg border border-secondary/15 bg-surface-container-lowest px-3 py-2 shadow-sm transition-shadow hover:shadow-md';
    card.dataset.category = normalizeCategory(category.name);
    card.dataset.search = name.toLocaleLowerCase();
    const accent = document.createElement('span');
    accent.className = 'h-2.5 w-2.5 shrink-0 rounded-full bg-primary-container';
    accent.setAttribute('aria-hidden', 'true');
    const label = document.createElement('h4');
    label.className = 'font-title-md text-body-md text-primary';
    label.textContent = name;
    card.append(accent, label);
    grid.append(card);
  }));

  function updateMenu() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    grid.querySelectorAll('.menu-card').forEach(card => {
      const matches = card.dataset.category === activeCategory && (!query || card.dataset.search.includes(query));
      card.hidden = !matches;
      card.classList.toggle('flex', matches);
      if (matches) visible++;
    });
    filterButtons.forEach(button => {
      const selected = button.dataset.category === activeCategory;
      button.classList.toggle('bg-primary-container', selected);
      button.classList.toggle('text-on-primary', selected);
      button.classList.toggle('shadow-sm', selected);
      button.classList.toggle('bg-surface-container', !selected);
      button.classList.toggle('text-on-surface-variant', !selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    result.textContent = query ? `${visible} dish${visible === 1 ? '' : 'es'} found` : `${visible} dish${visible === 1 ? '' : 'es'}`;
    empty.classList.toggle('hidden', visible !== 0);
  }
  search.addEventListener('input', updateMenu);
  document.getElementById('clearMenuSearch').addEventListener('click', () => {
    search.value = '';
    updateMenu();
    search.focus();
  });
  updateMenu();

  const packageContainer = document.getElementById('cateringPackages');
  data.cateringPackages.forEach((pkg, index) => {
    const card = document.createElement('article');
    card.className = 'flex flex-col rounded-2xl border border-secondary/25 bg-surface p-5 shadow-sm';
    const title = document.createElement('h4');
    title.className = 'font-headline-md text-headline-md text-primary';
    title.textContent = pkg.name;
    const quantity = pkg.groups.reduce((sum, group) => sum + group.items.length, 0);
    const summary = document.createElement('p');
    summary.className = 'mt-2 font-body-sm text-on-surface-variant';
    summary.textContent = `${quantity} menu selections`;
    const controls = document.createElement('div');
    controls.className = 'mt-auto flex flex-col gap-2 pt-5';
    const explore = document.createElement('button');
    explore.type = 'button';
    explore.className = 'w-full rounded-lg bg-primary-container px-4 py-3 font-title-md text-body-sm text-on-primary hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary';
    explore.textContent = 'Explore Menu';
    explore.setAttribute('aria-haspopup', 'dialog');

    const id = `catering-menu-${index}`;
    explore.setAttribute('aria-controls', id);
    const dialog = document.createElement('dialog');
    dialog.id = id;
    dialog.className = 'm-auto max-h-[88vh] w-[min(92vw,720px)] max-w-none overflow-hidden rounded-2xl bg-surface p-0 text-on-surface shadow-2xl backdrop:bg-primary/60';
    dialog.setAttribute('aria-labelledby', `${id}-title`);
    dialog.style.maxHeight = '88vh';
    dialog.style.width = 'min(92vw, 720px)';
    dialog.style.overflow = 'hidden';
    const shell = document.createElement('div');
    shell.className = 'flex max-h-[88vh] flex-col';
    shell.style.display = 'flex';
    shell.style.flexDirection = 'column';
    shell.style.maxHeight = '88vh';
    const header = document.createElement('div');
    header.className = 'flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant bg-surface px-5 py-4 sm:px-7';
    const headingGroup = document.createElement('div');
    const heading = document.createElement('h4');
    heading.id = `${id}-title`;
    heading.className = 'font-headline-md text-headline-md text-primary';
    heading.textContent = `${pkg.name} Menu`;
    const intro = document.createElement('p');
    intro.className = 'mt-1 font-body-sm text-on-surface-variant';
    intro.textContent = 'Food selections';
    headingGroup.append(heading, intro);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary';
    close.setAttribute('aria-label', `Close ${pkg.name} menu`);
    close.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"/></svg>';
    header.append(headingGroup, close);
    const content = document.createElement('div');
    content.className = 'overflow-y-auto overscroll-contain px-5 py-5 sm:px-7';
    content.style.overflowY = 'auto';
    content.style.overscrollBehavior = 'contain';
    content.style.minHeight = '0';
    content.style.flex = '1 1 auto';
    content.style.maxHeight = 'calc(88vh - 82px)';
    pkg.groups.forEach(group => {
      if (!group.items.length) return;
      const section = document.createElement('section');
      section.className = 'mb-5 last:mb-0';
      const subheading = document.createElement('h5');
      subheading.className = 'mb-2 border-b border-secondary/25 pb-1 font-title-md text-primary';
      subheading.textContent = group.name;
      const list = document.createElement('ul');
      list.className = 'grid grid-cols-1 gap-x-5 gap-y-2 text-body-sm text-on-surface-variant sm:grid-cols-2';
      group.items.forEach(name => {
        const item = document.createElement('li');
        item.className = 'flex items-start gap-2';
        const dot = document.createElement('span');
        dot.className = 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary';
        dot.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.textContent = name;
        item.append(dot, label);
        list.append(item);
      });
      section.append(subheading, list);
      content.append(section);
    });
    shell.append(header, content);
    dialog.append(shell);

    const enquiry = document.createElement('a');
    enquiry.className = 'w-full rounded-lg border border-primary px-4 py-3 text-center font-title-md text-body-sm text-primary hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary';
    enquiry.textContent = 'Enquire on WhatsApp';
    enquiry.target = '_blank';
    enquiry.rel = 'noopener noreferrer';
    const message = `Hello, I would like to enquire about the ${pkg.name} catering menu. Event type: [type]. Event date: [date]. Guest count: [count]. Please share details.`;
    enquiry.href = `https://wa.me/919611542717?text=${encodeURIComponent(message)}`;
    controls.append(explore, enquiry);
    card.append(title, summary, controls);
    packageContainer.append(card, dialog);

    explore.addEventListener('click', () => {
      dialog.dataset.previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
    const restoreBodyScroll = () => {
      document.body.style.overflow = dialog.dataset.previousOverflow ?? '';
      delete dialog.dataset.previousOverflow;
    };
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', restoreBodyScroll);
  });
})();
