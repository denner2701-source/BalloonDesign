(() => {
  const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  const { calculateBudget, round, slugify, balloonLabel } = window.BalloonCalculations;
  const defaults = {
    client: '', phone: '', date: '', time: '', location: '',
    labor: 120, structure: 0, supplies: 25, transport: 0, cleanup: 0,
    fixedShare: 0, tax: 6, cardFee: 4, reserve: 10, margin: 35,
    extraMaterials: [], team: []
  };
  const fields = ['client', 'phone', 'date', 'time', 'location', 'labor', 'structure', 'supplies', 'transport', 'cleanup', 'fixedShare', 'tax', 'cardFee', 'reserve', 'margin'];
  const ensureBudget = () => {
    state.budget = { ...defaults, ...(state.budget || {}) };
    state.budget.extraMaterials = Array.isArray(state.budget.extraMaterials) ? state.budget.extraMaterials : [];
    state.budget.team = Array.isArray(state.budget.team) ? state.budget.team : [];
    state.budget.extraMaterials = state.budget.extraMaterials.slice(0, 100).map(item => ({ ...item, id: /^[a-z0-9-]{1,80}$/i.test(String(item?.id || '')) ? String(item.id) : rowId(), name: String(item?.name || '').slice(0, 120) }));
    state.budget.team = state.budget.team.slice(0, 100).map(item => ({ ...item, id: /^[a-z0-9-]{1,80}$/i.test(String(item?.id || '')) ? String(item.id) : rowId(), role: String(item?.role || '').slice(0, 120) }));
    return state.budget;
  };
  const rowId = () => crypto.randomUUID();
  function totals() {
    const budget = ensureBudget();
    const entries = materialCounts();
    return { budget, entries, ...calculateBudget({ entries, sizeCosts: balloonSizeCosts, ...budget }) };
  }
  function renderRows(budget) {
    $('#budget-extra-materials').innerHTML = budget.extraMaterials.length ? budget.extraMaterials.map(item => `<div class="editable-row" data-material-row="${item.id}"><input aria-label="Material" data-field="name" value="${escapeHtml(String(item.name || ''))}" placeholder="Material" /><input aria-label="Quantidade" data-field="quantity" type="number" min="0" step="1" value="${Number(item.quantity) || 0}" /><input aria-label="Custo unitário" data-field="unitCost" type="number" min="0" step="0.01" value="${Number(item.unitCost) || 0}" /><strong>${money((Number(item.quantity) || 0) * (Number(item.unitCost) || 0))}</strong><button type="button" data-remove-material="${item.id}" aria-label="Remover material">×</button></div>`).join('') : '<p class="muted small">Adicione estruturas, nylon, fitilho, fixadores ou outros insumos.</p>';
    $('#budget-team').innerHTML = budget.team.length ? budget.team.map(item => `<div class="editable-row" data-team-row="${item.id}"><input aria-label="Função" data-field="role" value="${escapeHtml(String(item.role || ''))}" placeholder="Função" /><input aria-label="Minutos" data-field="minutes" type="number" min="0" step="5" value="${Number(item.minutes) || 0}" /><input aria-label="Valor por hora" data-field="hourly" type="number" min="0" step="1" value="${Number(item.hourly) || 0}" /><strong>${money((Number(item.minutes) || 0) / 60 * (Number(item.hourly) || 0))}</strong><button type="button" data-remove-team="${item.id}" aria-label="Remover função">×</button></div>`).join('') : '<p class="muted small">Adicione ajudantes, montadores, motoristas ou desmontagem.</p>';
  }
  function renderBudget(renderStructure = true) {
    const result = totals();
    const { budget, entries } = result;
    const totalBalloons = entries.reduce((sum, item) => sum + item.quantity, 0);
    const list = entries.map(item => `<div class="material-row"><i style="background:${item.hex}"></i><span>${colorName(item.hex)} · ${item.size}&quot;</span><small>${item.quantity} un.</small></div>`).join('') || '<p class="muted small">Pinte o design para calcular os materiais.</p>';
    fields.forEach(key => {
      const input = $(`#budget-${key}`);
      if (input && document.activeElement !== input) input.value = budget[key] ?? '';
    });
    if (renderStructure) renderRows(budget);
    $('#reserve-value').textContent = `${Number(budget.reserve) || 0}%`;
    $('#margin-value').textContent = `${Number(budget.margin) || 0}%`;
    $('#budget-project-title').textContent = state.name;
    $('#budget-count').textContent = balloonLabel(totalBalloons);
    $('#budget-material-list').innerHTML = list;
    $('#budget-material-cost').textContent = money(result.materialCost);
    $('#budget-labor-cost').textContent = money(result.labor);
    $('#budget-extras-cost').textContent = money(result.extras);
    $('#budget-logistics-cost').textContent = money(result.logistics);
    $('#budget-variable-cost').textContent = money(result.variable);
    $('#budget-fixed-cost').textContent = money(result.fixed);
    $('#budget-cost-total').textContent = money(result.cost);
    $('#budget-fees').textContent = money(result.fees);
    $('#budget-price').textContent = money(result.sale);
    $('#budget-profit').textContent = money(result.profit);
  }

  const previousRender = renderAll;
  renderAll = () => { previousRender(); renderBudget(); };
  const previousActivate = activateView;
  activateView = view => { previousActivate(view); if (view === 'budget') renderBudget(); };
  fields.forEach(key => $(`#budget-${key}`).addEventListener('input', event => {
    ensureBudget()[key] = ['number', 'range'].includes(event.target.type) ? Number(event.target.value) : event.target.value;
    renderBudget(false); persistDraft();
  }));
  $('#add-budget-material').addEventListener('click', () => { ensureBudget().extraMaterials.push({ id: rowId(), name: '', quantity: 1, unitCost: 0 }); renderBudget(); persistDraft(); });
  $('#add-budget-team').addEventListener('click', () => { ensureBudget().team.push({ id: rowId(), role: '', minutes: 60, hourly: 0 }); renderBudget(); persistDraft(); });
  const bindEditable = (selector, collectionName, rowAttribute, removeAttribute) => {
    $(selector).addEventListener('input', event => {
      const row = event.target.closest(`[${rowAttribute}]`); if (!row || !event.target.dataset.field) return;
      const item = ensureBudget()[collectionName].find(entry => entry.id === row.getAttribute(rowAttribute)); if (!item) return;
      item[event.target.dataset.field] = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
      renderBudget(false); const strong = row.querySelector('strong');
      if (strong) strong.textContent = collectionName === 'team' ? money((Number(item.minutes) || 0) / 60 * (Number(item.hourly) || 0)) : money((Number(item.quantity) || 0) * (Number(item.unitCost) || 0));
      persistDraft();
    });
    $(selector).addEventListener('click', event => {
      const id = event.target.getAttribute(removeAttribute); if (!id) return;
      ensureBudget()[collectionName] = ensureBudget()[collectionName].filter(item => item.id !== id); renderBudget(); persistDraft();
    });
  };
  bindEditable('#budget-extra-materials', 'extraMaterials', 'data-material-row', 'data-remove-material');
  bindEditable('#budget-team', 'team', 'data-team-row', 'data-remove-team');
  $('#save-budget').addEventListener('click', () => { void saveProject(); toast('Orçamento salvo com o projeto.'); });
  $('#print-budget').addEventListener('click', () => window.print());
  $('#export-budget').addEventListener('click', () => {
    const result = totals();
    const rows = [['Categoria', 'Item', 'Quantidade', 'Valor unitário', 'Total'], ...result.entries.map(item => ['Balões', `${colorName(item.hex)} ${item.size}"`, item.quantity, balloonSizeCosts[item.size] || .88, round(item.quantity * (balloonSizeCosts[item.size] || .88))]), ...result.budget.extraMaterials.map(item => ['Material extra', item.name, item.quantity, item.unitCost, round((Number(item.quantity) || 0) * (Number(item.unitCost) || 0))]), ...result.budget.team.map(item => ['Equipe', item.role, `${item.minutes} min`, item.hourly, round((Number(item.minutes) || 0) / 60 * (Number(item.hourly) || 0))]), ['Resumo', 'Custo total', '', '', round(result.cost)], ['Resumo', 'Impostos e taxas', '', '', round(result.fees)], ['Resumo', 'Preço de venda', '', '', round(result.sale)], ['Resumo', 'Lucro estimado', '', '', round(result.profit)]];
    const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
    const link = document.createElement('a'); link.download = `orcamento-${slugify(state.name)}.csv`; link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.click(); URL.revokeObjectURL(link.href); toast('Relatório de custos exportado.');
  });
  renderBudget();
})();
