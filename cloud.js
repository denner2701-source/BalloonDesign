(() => {
  const config = window.BALLOON_SUPABASE_CONFIG;
  const authDialog = $('#auth-dialog');
  const authMessage = $('#auth-message');
  const localSaveProject = saveProject;
  const localRenderProjectList = renderProjectList;
  let session = null;
  let publicProfile = null;
  let syncing = false;
  window.balloonSession = null;
  window.balloonProfile = null;

  const initials = (email = '') => email.split('@')[0].split(/[._-]/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'BD';
  const setMessage = (message, error = false) => {
    authMessage.textContent = message;
    authMessage.classList.toggle('error', error);
  };

  function updateAccountUi() {
    const email = session?.user?.email || '';
    const signedIn = Boolean(session);
    $('#auth-name').textContent = signedIn ? (publicProfile?.display_name || publicProfile?.username || email.split('@')[0]) : 'Entrar na conta';
    $('#auth-status').textContent = signedIn ? 'Sincronização ativa' : 'Modo local';
    $('#auth-avatar').textContent = initials(email);
    $('#auth-fields').hidden = signedIn;
    $('#auth-account').hidden = !signedIn;
    $('#account-email').textContent = email;
    $('#account-avatar').textContent = initials(email);
    $('#profile-display-name').value = publicProfile?.display_name || '';
    $('#profile-username').value = publicProfile?.username || '';
  }

  if (!config || !window.supabase?.createClient) {
    $('#auth-status').textContent = 'Nuvem indisponível';
    setMessage('Não foi possível carregar a conexão segura. O modo local continua funcionando.', true);
    return;
  }

  const cloud = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.balloonCloud = cloud;

  async function loadPublicProfile() {
    publicProfile = null;
    window.balloonProfile = null;
    if (!session) { updateAccountUi(); return; }
    const { data, error } = await cloud.from('profiles').select('username, display_name, avatar_url').eq('user_id', session.user.id).maybeSingle();
    if (error) throw error;
    publicProfile = data;
    window.balloonProfile = data;
    updateAccountUi();
  }

  function cloudRow(project) {
    return {
      id: project.id,
      user_id: session.user.id,
      name: project.name,
      shape: project.shape,
      cols: project.cols,
      rows: project.rows,
      palette: project.palette || [],
      cells: project.cells || [],
      balloon_sizes: project.balloonSizes || [],
      budget: project.budget || {},
      checklist: project.checklist || [],
      updated_at: new Date(project.updatedAt || Date.now()).toISOString()
    };
  }

  function localProject(row) {
    return {
      id: row.id,
      name: row.name,
      shape: row.shape,
      cols: row.cols,
      rows: row.rows,
      palette: row.palette || structuredClone(paletteDefaults),
      selected: row.palette?.[0]?.hex || '#8b5cf6',
      cells: row.cells || [],
      balloonSizes: row.balloon_sizes || [],
      budget: row.budget || {},
      checklist: row.checklist || [],
      zoom: 1,
      rotation: -12,
      updatedAt: new Date(row.updated_at).getTime()
    };
  }

  async function saveToCloud(project) {
    if (!session) return;
    const { error } = await cloud.from('projects').upsert(cloudRow(project), { onConflict: 'id' });
    if (error) throw error;
  }

  async function syncLocalProjects() {
    if (!session || syncing) return;
    syncing = true;
    try {
      const projects = projectStore();
      if (projects.length) {
        const { error } = await cloud.from('projects').upsert(projects.map(cloudRow), { onConflict: 'id' });
        if (error) throw error;
      }
    } finally {
      syncing = false;
    }
  }

  async function loadCloudProjects() {
    if (!session) return;
    const { data, error } = await cloud.from('projects').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    const merged = new Map(projectStore().map(project => [project.id, project]));
    (data || []).map(localProject).forEach(project => {
      const current = merged.get(project.id);
      if (!current || project.updatedAt >= (current.updatedAt || 0)) merged.set(project.id, project);
    });
    localStorage.setItem(storageKey, JSON.stringify([...merged.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))));
    localRenderProjectList();
  }

  saveProject = async () => {
    localSaveProject();
    if (!session) return;
    try {
      await saveToCloud({ ...state, updatedAt: Date.now() });
      toast('Projeto salvo neste dispositivo e na nuvem.');
    } catch (error) {
      console.error('Cloud save failed', error);
      toast('Salvo neste dispositivo. A sincronização será tentada novamente.');
    }
  };

  async function applySession(nextSession) {
    const changedUser = session?.user?.id !== nextSession?.user?.id;
    session = nextSession;
    window.balloonSession = session;
    if (!session) {
      publicProfile = null;
      window.balloonProfile = null;
    }
    updateAccountUi();
    if (!session) {
      window.dispatchEvent(new CustomEvent('balloon-auth-change', { detail: { session } }));
      return;
    }
    try {
      await loadPublicProfile();
      if (changedUser) {
        setMessage('Sincronizando seus projetos…');
        await syncLocalProjects();
        await loadCloudProjects();
        setMessage('Conta conectada e projetos sincronizados.');
        toast('Conta conectada. Projetos sincronizados.');
      }
    } catch (error) {
      console.error('Cloud sync failed', error);
      setMessage('Conta conectada, mas a sincronização precisa ser tentada novamente.', true);
    }
    window.dispatchEvent(new CustomEvent('balloon-auth-change', { detail: { session, profile: publicProfile } }));
  }

  $('#profile-button').addEventListener('click', () => {
    setMessage(session ? 'Sua conta está conectada.' : 'Entre ou crie uma conta gratuita.');
    authDialog.showModal();
  });
  $('#auth-close').addEventListener('click', () => authDialog.close());

  $('#auth-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('#auth-email').value.trim();
    const password = $('#auth-password').value;
    setMessage('Entrando…');
    const { error } = await cloud.auth.signInWithPassword({ email, password });
    if (error) setMessage('Não foi possível entrar. Confira o e-mail e a senha.', true);
    else {
      setMessage('Conta conectada.');
      $('#auth-password').value = '';
    }
  });

  $('#auth-signup').addEventListener('click', async () => {
    const email = $('#auth-email').value.trim();
    const password = $('#auth-password').value;
    if (!email || password.length < 6) {
      setMessage('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.', true);
      return;
    }
    setMessage('Criando sua conta…');
    const { data, error } = await cloud.auth.signUp({ email, password });
    if (error) setMessage('Não foi possível criar a conta. Verifique os dados e tente novamente.', true);
    else if (!data.session) setMessage('Conta criada. Confirme o e-mail recebido para entrar.');
    else setMessage('Conta criada e conectada.');
  });

  $('#auth-reset').addEventListener('click', async () => {
    const email = $('#auth-email').value.trim();
    if (!email) { setMessage('Informe seu e-mail para receber o link de recuperação.', true); return; }
    setMessage('Enviando link de recuperação…');
    const { error } = await cloud.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] });
    setMessage(error ? 'Não foi possível enviar o link agora.' : 'Link de recuperação enviado. Confira sua caixa de entrada.', Boolean(error));
  });

  $('#profile-save').addEventListener('click', async () => {
    if (!session) return;
    const displayName = $('#profile-display-name').value.trim();
    const username = $('#profile-username').value.trim().toLowerCase();
    if (!displayName || !/^[a-z0-9_]{3,20}$/.test(username)) {
      setMessage('Informe um nome público e um usuário válido.', true);
      return;
    }
    setMessage('Salvando perfil público…');
    const { error } = await cloud.from('profiles').upsert({ user_id: session.user.id, display_name: displayName, username, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      setMessage(error.code === '23505' ? 'Este nome de usuário já está em uso.' : 'Não foi possível salvar o perfil agora.', true);
      return;
    }
    await loadPublicProfile();
    window.dispatchEvent(new CustomEvent('balloon-profile-change', { detail: { profile: publicProfile } }));
    setMessage('Perfil público salvo.');
    toast('Perfil público atualizado.');
  });

  $('#auth-logout').addEventListener('click', async () => {
    setMessage('Saindo…');
    const { error } = await cloud.auth.signOut();
    if (error) setMessage('Não foi possível sair agora.', true);
    else {
      authDialog.close();
      toast('Você saiu da conta. Os projetos locais foram preservados.');
    }
  });

  cloud.auth.onAuthStateChange((_event, nextSession) => {
    setTimeout(() => void applySession(nextSession), 0);
  });
  cloud.auth.getSession().then(({ data }) => applySession(data.session));
  window.addEventListener('balloon-project-delete', async event => {
    if (!session || !event.detail?.id) return;
    const { error } = await cloud.from('projects').delete().eq('id', event.detail.id).eq('user_id', session.user.id);
    if (error) console.error('Cloud delete failed', error);
  });
  updateAccountUi();
})();
