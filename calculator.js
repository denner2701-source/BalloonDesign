(() => {
  const key = 'balloon-design-calculators-v1';
  const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  const { heliumVolume, heliumQuote, calculateDuplet, calculateOrganic, calculateFixed } = window.BalloonCalculations;
  const sizes = [5, 9, 11, 16, 24, 36];
  const defaults = {
    heliumPrice: 250,
    heliumMargin: 2,
    heliumLoss: 10,
    heliumRows: Object.fromEntries(sizes.map(size => [size, { cost: balloonSizeCosts[size] || 0, extras: 0 }])),
    dupletMode: 'diameter', dupletPrimary: 100, dupletSize: 3.25,
    organicMeters: 5, organicColors: 3, organic260: true,
    fixed: { services: 8, rent: 0, water: 0, energy: 0, staff: 0, admin: 0, insurance: 0, equipment: 0, vehicle: 0 }
  };
  let config;
  try { config = { ...structuredClone(defaults), ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { config = structuredClone(defaults); }
  config.heliumRows = { ...structuredClone(defaults.heliumRows), ...(config.heliumRows || {}) };
  config.fixed = { ...defaults.fixed, ...(config.fixed || {}) };
  const save = () => localStorage.setItem(key, JSON.stringify(config));

  function renderHelium() {
    const price = Number(config.heliumPrice) || 0;
    const multiplier = Math.max(1, Number(config.heliumMargin) || 1);
    const loss = Math.max(0, Number(config.heliumLoss) || 0) / 100;
    $('#helium-table').innerHTML = sizes.map(size => {
      const row = config.heliumRows[size] || { cost: 0, extras: 0 };
      const quote = heliumQuote({ size, price, loss: loss * 100, cost: row.cost, extras: row.extras, multiplier });
      return `<tr><td><strong>${size}&quot;</strong><small>${Math.round(heliumVolume(size) * 1000)} L úteis</small></td><td><label class="table-money">R$ <input type="number" min="0" step="0.01" value="${Number(row.cost) || 0}" data-helium-cost="${size}" aria-label="Custo do balão ${size} polegadas" /></label></td><td><label class="table-money">R$ <input type="number" min="0" step="0.01" value="${Number(row.extras) || 0}" data-helium-extras="${size}" aria-label="Extras do balão ${size} polegadas" /></label></td><td>${money(quote.helium)}</td><td>${money(quote.total)}</td><td><strong>${money(quote.sale)}</strong></td></tr>`;
    }).join('');
  }
  function renderDuplet() {
    const { duplets, diameter, innerSize } = calculateDuplet({ mode: config.dupletMode, primary: config.dupletPrimary, size: config.dupletSize });
    $('#duplet-primary-label').firstChild.textContent = config.dupletMode === 'diameter' ? 'Diâmetro do círculo ' : 'Quantidade de duplets ';
    $('#duplet-primary-label .input-suffix').textContent = config.dupletMode === 'diameter' ? 'cm' : 'un.';
    $('#duplet-results').innerHTML = `<article><small>Duplets necessários</small><strong>${duplets}</strong><span>${duplets * 2} balões externos</span></article><article><small>Diâmetro calculado</small><strong>${diameter.toFixed(1)} cm</strong><span>medida externa aproximada</span></article><article><small>Balão interno sugerido</small><strong>${innerSize.toFixed(2)}&quot;</strong><span>proporção de 62%</span></article>`;
  }
  function renderOrganic() {
    const { meters, colors, total, ties, rows } = calculateOrganic({ meters: config.organicMeters, colors: config.organicColors, use260: config.organic260 });
    $('#organic-results').innerHTML = `<article><small>Total estimado</small><strong>${total} balões</strong><span>${Math.round(total / meters)} por metro</span></article><article><small>Distribuição</small><strong>${colors} ${colors === 1 ? 'cor' : 'cores'}</strong><span>aprox. ${Math.ceil(total / colors)} por cor</span></article><article><small>Amarração</small><strong>${ties || 'Sem 260'}</strong><span>${ties ? 'balões 260 estimados' : 'use nylon ou fita'}</span></article>`;
    $('#organic-table').innerHTML = rows.map(item => `<tr><td><strong>${item.size}&quot;</strong></td><td>${Math.round(item.ratio * 100)}%</td><td>${item.quantity}</td><td>≈ ${Math.ceil(item.quantity / colors)}</td></tr>`).join('');
  }
  function fixedTotals() {
    return calculateFixed(config.fixed);
  }
  function renderFixed() {
    const { monthly, perService } = fixedTotals();
    $('#fixed-monthly').textContent = money(monthly);
    $('#fixed-per-service').textContent = money(perService);
  }
  function render() { renderHelium(); renderDuplet(); renderOrganic(); renderFixed(); save(); }

  $$('.feature-tabs [data-calc-tab]').forEach(button => button.addEventListener('click', () => {
    $$('.feature-tabs [data-calc-tab]').forEach(item => item.classList.toggle('active', item === button));
    $$('.calc-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.calcPanel === button.dataset.calcTab));
  }));
  $$('.segmented [data-duplet-mode]').forEach(button => button.addEventListener('click', () => {
    config.dupletMode = button.dataset.dupletMode;
    $$('.segmented [data-duplet-mode]').forEach(item => item.classList.toggle('active', item === button));
    renderDuplet(); save();
  }));
  const bindNumber = (selector, target, renderFn) => {
    const input = $(selector); input.value = target.get(); input.addEventListener('input', () => { target.set(Number(input.value)); renderFn(); save(); });
  };
  bindNumber('#helium-price', { get: () => config.heliumPrice, set: value => config.heliumPrice = value }, renderHelium);
  bindNumber('#helium-margin', { get: () => config.heliumMargin, set: value => config.heliumMargin = value }, renderHelium);
  bindNumber('#helium-loss', { get: () => config.heliumLoss, set: value => config.heliumLoss = value }, renderHelium);
  bindNumber('#duplet-primary', { get: () => config.dupletPrimary, set: value => config.dupletPrimary = value }, renderDuplet);
  bindNumber('#duplet-size', { get: () => config.dupletSize, set: value => config.dupletSize = value }, renderDuplet);
  bindNumber('#organic-meters', { get: () => config.organicMeters, set: value => config.organicMeters = value }, renderOrganic);
  bindNumber('#organic-colors', { get: () => config.organicColors, set: value => config.organicColors = value }, renderOrganic);
  $('#organic-260').checked = Boolean(config.organic260);
  $('#organic-260').addEventListener('change', event => { config.organic260 = event.target.checked; renderOrganic(); save(); });
  const fixedFields = { services: '#fixed-services', rent: '#fixed-rent', water: '#fixed-water', energy: '#fixed-energy', staff: '#fixed-staff', admin: '#fixed-admin', insurance: '#fixed-insurance', equipment: '#fixed-equipment', vehicle: '#fixed-vehicle' };
  Object.entries(fixedFields).forEach(([field, selector]) => bindNumber(selector, { get: () => config.fixed[field], set: value => config.fixed[field] = value }, renderFixed));
  $('#helium-table').addEventListener('input', event => {
    const size = event.target.dataset.heliumCost || event.target.dataset.heliumExtras;
    if (!size) return;
    const field = event.target.dataset.heliumCost ? 'cost' : 'extras';
    config.heliumRows[size][field] = Number(event.target.value) || 0;
    renderHelium(); save();
  });
  $('#apply-fixed-cost').addEventListener('click', () => {
    state.budget ||= {};
    state.budget.fixedShare = Number(fixedTotals().perService.toFixed(2));
    persistDraft(); renderAll(); activateView('budget'); toast('Rateio aplicado ao orçamento atual.');
  });
  render();
})();
