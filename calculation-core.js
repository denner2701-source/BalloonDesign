(function attachBalloonCalculations(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BalloonCalculations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const number = value => Number(value) || 0;
  const round = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round((number(value) + Number.EPSILON) * factor) / factor;
  };
  const slugify = (value, fallback = 'projeto') => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
  const balloonLabel = count => `${number(count)} ${number(count) === 1 ? 'balão' : 'balões'}`;
  const heliumVolume = size => {
    const radiusMeters = number(size) * .0254 / 2;
    return 4 / 3 * Math.PI * radiusMeters ** 3 * .9;
  };
  const heliumQuote = ({ size, price, loss = 0, cost = 0, extras = 0, multiplier = 1 }) => {
    const volume = heliumVolume(size);
    const helium = volume * number(price) * (1 + Math.max(0, number(loss)) / 100);
    const total = helium + number(cost) + number(extras);
    return { volume, helium, total, sale: total * Math.max(1, number(multiplier) || 1) };
  };
  const calculateDuplet = ({ mode = 'diameter', primary, size }) => {
    const safePrimary = Math.max(1, number(primary) || 1);
    const safeSize = Math.max(2, number(size) || 3.25);
    const balloonCm = safeSize * 2.54;
    const duplets = mode === 'diameter' ? Math.max(3, Math.ceil(Math.PI * safePrimary / (balloonCm * 1.65))) : Math.round(safePrimary);
    const diameter = mode === 'diameter' ? safePrimary : duplets * balloonCm * 1.65 / Math.PI;
    return { duplets, externalBalloons: duplets * 2, diameter, innerSize: safeSize * .62 };
  };
  const calculateOrganic = ({ meters, colors, use260 }) => {
    const safeMeters = Math.max(.5, number(meters) || .5);
    const safeColors = Math.max(1, Math.min(10, Math.round(number(colors) || 1)));
    const total = Math.ceil(safeMeters * 65);
    const mix = [{ size: 5, ratio: .55 }, { size: 9, ratio: .30 }, { size: 11, ratio: .12 }, { size: 16, ratio: .03 }];
    const rows = mix.map((item, index) => ({ ...item, quantity: index === mix.length - 1 ? 0 : Math.round(total * item.ratio) }));
    rows[rows.length - 1].quantity = total - rows.slice(0, -1).reduce((sum, item) => sum + item.quantity, 0);
    return { meters: safeMeters, colors: safeColors, total, ties: use260 ? Math.ceil(safeMeters * 2) : 0, rows };
  };
  const calculateFixed = fixed => {
    const f = fixed || {};
    const monthly = ['rent', 'water', 'energy', 'staff', 'admin', 'insurance'].reduce((sum, item) => sum + number(f[item]), 0)
      + number(f.equipment) / 60 + number(f.vehicle) / 180;
    return { monthly, perService: monthly / Math.max(1, number(f.services) || 1) };
  };
  const calculateBudget = ({ entries = [], sizeCosts = {}, reserve = 0, labor = 0, structure = 0, supplies = 0, transport = 0, cleanup = 0, extraMaterials = [], team = [], fixedShare = 0, tax = 0, cardFee = 0, margin = 0 }) => {
    const baseMaterial = entries.reduce((sum, item) => sum + number(item.quantity) * number(sizeCosts[item.size] ?? .88), 0);
    const materialCost = baseMaterial * (1 + number(reserve) / 100);
    const extras = number(structure) + number(supplies);
    const logistics = number(transport) + number(cleanup);
    const variable = extraMaterials.reduce((sum, item) => sum + number(item.quantity) * number(item.unitCost), 0)
      + team.reduce((sum, item) => sum + number(item.minutes) / 60 * number(item.hourly), 0);
    const fixed = number(fixedShare);
    const cost = materialCost + number(labor) + extras + logistics + variable + fixed;
    const marginRate = Math.min(.90, Math.max(0, number(margin) / 100));
    const feeRate = Math.min(.60, Math.max(0, (number(tax) + number(cardFee)) / 100));
    const sale = cost / Math.max(.05, 1 - marginRate - feeRate);
    const fees = sale * feeRate;
    return { materialCost, labor: number(labor), extras, logistics, variable, fixed, cost, sale, fees, profit: sale - fees - cost };
  };
  return { round, slugify, balloonLabel, heliumVolume, heliumQuote, calculateDuplet, calculateOrganic, calculateFixed, calculateBudget };
});
