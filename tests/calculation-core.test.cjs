const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../calculation-core.js');

test('normaliza nomes de arquivo com acentos', () => {
  assert.equal(core.slugify('Cópia de Arco Pôr do Sol'), 'copia-de-arco-por-do-sol');
  assert.equal(core.slugify('***', 'design'), 'design');
});

test('flexiona a contagem de balões', () => {
  assert.equal(core.balloonLabel(0), '0 balões');
  assert.equal(core.balloonLabel(1), '1 balão');
  assert.equal(core.balloonLabel(95), '95 balões');
});

test('calcula hélio, custo e venda', () => {
  const quote = core.heliumQuote({ size: 9, price: 300, loss: 10, cost: .88, multiplier: 2 });
  assert.equal(Math.round(quote.volume * 1000), 6);
  assert.equal(core.round(quote.helium), 1.86);
  assert.equal(core.round(quote.total), 2.74);
  assert.equal(core.round(quote.sale), 5.48);
});

test('calcula duplet por diâmetro e por quantidade', () => {
  const diameter = core.calculateDuplet({ mode: 'diameter', primary: 100, size: 3.25 });
  assert.deepEqual({ duplets: diameter.duplets, external: diameter.externalBalloons, diameter: core.round(diameter.diameter, 1), inner: core.round(diameter.innerSize, 2) }, { duplets: 24, external: 48, diameter: 100, inner: 2.02 });
  const quantity = core.calculateDuplet({ mode: 'quantity', primary: 20, size: 3.25 });
  assert.equal(core.round(quantity.diameter, 1), 86.7);
});

test('calcula arco orgânico e reconcilia a distribuição', () => {
  const result = core.calculateOrganic({ meters: 8, colors: 4, use260: true });
  assert.equal(result.total, 520);
  assert.equal(result.ties, 16);
  assert.equal(result.rows.reduce((sum, row) => sum + row.quantity, 0), 520);
});

test('rateia custos fixos e depreciação', () => {
  const result = core.calculateFixed({ services: 10, rent: 1200, energy: 300, equipment: 6000, vehicle: 18000 });
  assert.equal(result.monthly, 1700);
  assert.equal(result.perService, 170);
});

test('reconcilia custo, taxas, venda e lucro do orçamento', () => {
  const result = core.calculateBudget({
    entries: [{ size: 9, quantity: 95 }], sizeCosts: { 9: .88 }, reserve: 10,
    labor: 120, supplies: 25, fixedShare: 170,
    extraMaterials: [{ quantity: 2, unitCost: 10 }], team: [{ minutes: 120, hourly: 30 }],
    tax: 6, cardFee: 4, margin: 35
  });
  assert.equal(core.round(result.materialCost), 91.96);
  assert.equal(core.round(result.cost), 486.96);
  assert.equal(core.round(result.sale), 885.38);
  assert.equal(core.round(result.fees), 88.54);
  assert.equal(core.round(result.profit), 309.88);
  assert.equal(core.round(result.cost + result.fees + result.profit), core.round(result.sale));
});
