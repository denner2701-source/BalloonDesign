(() => {
  const buildProject = (name, shape, cols, rows, painter) => {
    const cells = blankCells(cols, rows), balloonSizes = blankSizes(cols, rows);
    for (let row = 0; row < rows; row += 1) for (let col = 0; col < cols; col += 1) {
      const result = painter(col, row, cols, rows);
      if (!result) continue;
      const index = row * cols + col;
      cells[index] = result.color;
      balloonSizes[index] = result.size || 9;
    }
    return { id: crypto.randomUUID(), name, shape, cols, rows, palette: structuredClone(paletteDefaults), selected: '#8b5cf6', selectedSize: 9, cells, balloonSizes, checklist: [], budget: {}, zoom: 1, rotation: -12 };
  };
  const starters = [
    { id: 'starter-rainbow', title: 'Arco Aurora', tags: ['arco', 'colorido', 'entrada'], author: 'BalloonDesign', project: buildProject('Arco Aurora', 'arch', 16, 10, (col, row, cols) => ({ color: ['#f472b6', '#fbad8f', '#f8da72', '#62d8b0', '#75bff4', '#8b5cf6'][Math.min(5, Math.floor(col / cols * 6))], size: row % 3 === 0 ? 11 : 9 })) },
    { id: 'starter-panel', title: 'Jardim Moderno', tags: ['painel', 'flores', 'pastel'], author: 'BalloonDesign', project: buildProject('Jardim Moderno', 'panel_alternating', 12, 8, (col, row) => ({ color: (col + row) % 7 === 0 ? '#f472b6' : (col * 2 + row) % 5 === 0 ? '#f8da72' : '#62d8b0', size: (col + row) % 3 === 0 ? 11 : 9 })) },
    { id: 'starter-organic', title: 'Orgânico Pôr do Sol', tags: ['orgânico', 'festa', 'degradê'], author: 'BalloonDesign', project: buildProject('Orgânico Pôr do Sol', 'organic', 20, 12, (col, row, cols, rows) => { const progress = cols <= 1 ? 0 : col / (cols - 1); const center = rows * (.72 - progress * .40 + Math.sin(progress * Math.PI * 2) * .08); if (Math.abs(row - center) > Math.max(1.4, rows * .16)) return null; return { color: ['#fbad8f', '#f472b6', '#8b5cf6'][Math.min(2, Math.floor(progress * 3))], size: [5, 9, 11, 16][(row + col) % 4] }; }) }
  ];
  let cloudProjects = [];
  let ownLikes = new Set();
  let followedProfiles = new Set();
  let galleryScope = 'all';

  const normalized = (row, profile) => ({ id: row.id, title: row.title, tags: row.tags || [], author: profile?.display_name || profile?.username || 'Decorador da comunidade', username: profile?.username || '', ownerId: row.owner_id, likeCount: row.like_count || 0, project: { ...(row.project_data || {}), shape: normalizeShape(row.shape || row.project_data?.shape) }, cloud: true });
  function filtered() {
    const search = ($('#gallery-search').value || '').trim().toLocaleLowerCase('pt-BR');
    const type = $('#gallery-type-filter').value;
    const userId = window.balloonSession?.user?.id;
    const scoped = galleryScope === 'mine' ? cloudProjects.filter(item => item.ownerId === userId) : galleryScope === 'following' ? cloudProjects.filter(item => followedProfiles.has(item.ownerId)) : [...starters, ...cloudProjects];
    return scoped.filter(item => (!type || normalizeShape(item.project.shape) === type) && (!search || `${item.title} ${item.author} ${item.tags.join(' ')}`.toLocaleLowerCase('pt-BR').includes(search)));
  }
  function renderGallery() {
    const items = filtered();
    $('#gallery-results').textContent = `${items.length} ${items.length === 1 ? 'projeto' : 'projetos'}`;
    const authenticatedScope = galleryScope === 'mine' || galleryScope === 'following';
    const emptyCopy = !window.balloonSession && authenticatedScope ? '<div class="empty-state"><b>Entre para usar esta área</b><p>Seus projetos publicados e os perfis seguidos aparecem aqui.</p><button class="text-button" data-gallery-login>Entrar na conta</button></div>' : galleryScope === 'following' ? '<div class="empty-state"><b>Nenhum projeto de perfis seguidos</b><p>Na aba Geral, siga decoradores para montar seu feed.</p></div>' : '<div class="empty-state"><b>Nenhum projeto encontrado</b><p>Limpe os filtros ou publique o primeiro projeto.</p></div>';
    $('#gallery-list').innerHTML = items.length ? items.map(item => `<article class="project-card gallery-card"><div class="project-thumb"><canvas width="300" height="180" data-gallery-canvas="${item.id}"></canvas></div><div class="project-card-body"><div class="gallery-meta"><span>${escapeHtml(item.author)}${item.username ? ` <small>@${escapeHtml(item.username)}</small>` : ''}</span><small>${shapeLabel(item.project.shape)}</small></div><h3>${escapeHtml(item.title)}</h3><div class="tag-list">${item.tags.slice(0, 4).map(tag => `<span>#${escapeHtml(tag)}</span>`).join('')}</div><div class="project-card-actions"><button data-gallery-duplicate="${item.id}">Duplicar</button><button data-gallery-share="${item.id}">Compartilhar</button>${item.cloud ? `<button class="${ownLikes.has(item.id) ? 'liked' : ''}" data-gallery-like="${item.id}">♥ ${item.likeCount}</button>` : ''}${item.cloud && item.ownerId !== window.balloonSession?.user?.id ? `<button class="${followedProfiles.has(item.ownerId) ? 'following' : ''}" data-gallery-follow="${item.id}">${followedProfiles.has(item.ownerId) ? 'Seguindo' : 'Seguir'}</button><button data-gallery-report="${item.id}">Denunciar</button>` : ''}${item.cloud && item.ownerId === window.balloonSession?.user?.id ? `<button class="danger-action" data-gallery-delete="${item.id}">Remover</button>` : ''}</div></div></article>`).join('') : emptyCopy;
    items.forEach(item => { const target = $(`[data-gallery-canvas="${item.id}"]`); if (target) miniProject(target, structuredClone(item.project)); });
  }
  async function loadGallery() {
    if (!window.balloonCloud) { renderGallery(); return; }
    const { data, error } = await window.balloonCloud.from('published_projects').select('id, owner_id, title, shape, tags, project_data, published_at, like_count').order('published_at', { ascending: false }).limit(60);
    if (error) { console.error('Gallery load failed', error); renderGallery(); return; }
    const ownerIds = [...new Set((data || []).map(item => item.owner_id))];
    let profiles = [];
    if (ownerIds.length) {
      const { data: profileRows, error: profileError } = await window.balloonCloud.from('profiles').select('user_id, username, display_name').in('user_id', ownerIds);
      if (profileError) console.error('Gallery profiles failed', profileError);
      profiles = profileRows || [];
    }
    const profilesById = new Map(profiles.map(profile => [profile.user_id, profile]));
    cloudProjects = (data || []).map(row => normalized(row, profilesById.get(row.owner_id)));
    ownLikes = new Set();
    followedProfiles = new Set();
    if (window.balloonSession) {
      const [{ data: likes }, { data: follows }] = await Promise.all([
        window.balloonCloud.from('gallery_likes').select('project_id').eq('user_id', window.balloonSession.user.id),
        window.balloonCloud.from('profile_follows').select('followed_id').eq('follower_id', window.balloonSession.user.id)
      ]);
      (likes || []).forEach(item => ownLikes.add(item.project_id));
      (follows || []).forEach(item => followedProfiles.add(item.followed_id));
    }
    renderGallery();
  }
  const itemById = id => [...starters, ...cloudProjects].find(item => item.id === id);
  $('#gallery-list').addEventListener('click', async event => {
    if (event.target.dataset.galleryLogin !== undefined) { $('#profile-button').click(); return; }
    const id = event.target.dataset.galleryDuplicate || event.target.dataset.galleryShare || event.target.dataset.galleryLike || event.target.dataset.galleryFollow || event.target.dataset.galleryReport || event.target.dataset.galleryDelete;
    if (!id) return;
    const item = itemById(id); if (!item) return;
    if (event.target.dataset.galleryDuplicate) {
      state = { ...structuredClone(item.project), id: crypto.randomUUID(), name: `Cópia de ${item.title}`, updatedAt: Date.now() };
      ensureCells(); await saveProject(); activateView('studio'); renderAll(); toast('Modelo duplicado em Meus projetos.');
    } else if (event.target.dataset.galleryShare) {
      const share = { title: item.title, text: `Inspiração BalloonDesign: ${item.title}`, url: location.href.split('#')[0] };
      if (navigator.share) await navigator.share(share).catch(() => {}); else { await navigator.clipboard.writeText(`${share.text} — ${share.url}`); toast('Link copiado.'); }
    } else if (event.target.dataset.galleryLike) {
      if (!window.balloonSession) { $('#profile-button').click(); return; }
      if (ownLikes.has(id)) await window.balloonCloud.from('gallery_likes').delete().eq('project_id', id).eq('user_id', window.balloonSession.user.id);
      else await window.balloonCloud.from('gallery_likes').insert({ project_id: id, user_id: window.balloonSession.user.id });
      await loadGallery();
    } else if (event.target.dataset.galleryFollow) {
      if (!window.balloonSession) { $('#profile-button').click(); return; }
      const relation = { follower_id: window.balloonSession.user.id, followed_id: item.ownerId };
      const operation = followedProfiles.has(item.ownerId) ? window.balloonCloud.from('profile_follows').delete().match(relation) : window.balloonCloud.from('profile_follows').insert(relation);
      const { error } = await operation;
      toast(error ? 'Não foi possível atualizar este perfil.' : followedProfiles.has(item.ownerId) ? 'Você deixou de seguir este perfil.' : 'Perfil seguido.');
      await loadGallery();
    } else if (event.target.dataset.galleryReport) {
      if (!window.balloonSession) { $('#profile-button').click(); return; }
      const reason = prompt('Descreva brevemente o motivo da denúncia:'); if (!reason?.trim()) return;
      const { error } = await window.balloonCloud.from('gallery_reports').insert({ project_id: id, user_id: window.balloonSession.user.id, reason: reason.trim().slice(0, 500) });
      toast(error ? 'Não foi possível enviar a denúncia.' : 'Denúncia registrada para análise.');
    } else if (event.target.dataset.galleryDelete) {
      if (!confirm(`Remover “${item.title}” da galeria?`)) return;
      const { error } = await window.balloonCloud.from('published_projects').delete().eq('id', id).eq('owner_id', window.balloonSession.user.id);
      toast(error ? 'Não foi possível remover a publicação.' : 'Publicação removida.'); await loadGallery();
    }
  });
  $('#publish-project').addEventListener('click', () => {
    if (!window.balloonSession) { $('#profile-button').click(); toast('Entre na conta para publicar na galeria.'); return; }
    $('#publish-title').value = state.name;
    $('#publish-tags').value = shapeLabel().toLocaleLowerCase('pt-BR');
    $('#publish-message').textContent = '';
    $('#publish-dialog').showModal();
  });
  $('#publish-close').addEventListener('click', () => $('#publish-dialog').close());
  $('#publish-form').addEventListener('submit', async event => {
    event.preventDefault();
    const title = $('#publish-title').value.trim();
    const tags = $('#publish-tags').value.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean).slice(0, 8);
    $('#publish-message').textContent = 'Publicando…';
    const projectData = { ...structuredClone(state), budget: {}, checklist: [] };
    const { error } = await window.balloonCloud.from('published_projects').insert({ owner_id: window.balloonSession.user.id, project_id: state.id, title, shape: normalizeShape(state.shape), tags, project_data: projectData });
    if (error) { console.error('Publish failed', error); $('#publish-message').textContent = 'Não foi possível publicar agora.'; return; }
    $('#publish-dialog').close(); toast('Projeto publicado na galeria.'); await loadGallery(); activateView('gallery');
  });
  ['#gallery-search', '#gallery-type-filter'].forEach(selector => $(selector).addEventListener('input', renderGallery));
  $$('[data-gallery-scope]').forEach(button => button.addEventListener('click', () => {
    galleryScope = button.dataset.galleryScope;
    $$('[data-gallery-scope]').forEach(item => item.classList.toggle('active', item === button));
    renderGallery();
  }));
  window.addEventListener('balloon-auth-change', loadGallery);
  window.addEventListener('balloon-profile-change', loadGallery);
  const previousActivate = activateView;
  activateView = view => { previousActivate(view); if (view === 'gallery') void loadGallery(); };
  renderGallery();
  setTimeout(() => void loadGallery(), 0);
})();
