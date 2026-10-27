export const BILLING_MONTHS = Object.freeze({ monthly: 1, annual: 12, oneTime: 1, service: 1 });

export function normalizePrice(price, billing) {
  return Number(price || 0) / (BILLING_MONTHS[billing] || 1);
}

function normalizedFixed(amount, period) {
  const factors = { monthly: 1, annual: 1 / 12, quarterly: 1 / 3, weekly: 52 / 12, oneTime: 0 };
  return Number(amount || 0) * (factors[period] ?? 1);
}

export function computeModel(expenses, products, amountFor = (expense) => expense.amount) {
  const recurring = expenses.filter((expense) => expense.enabled && expense.scope === "operating");
  const startups = expenses.filter((expense) => expense.enabled && expense.scope === "startup");
  const startupCash = startups.reduce((sum, expense) => sum + Number(amountFor(expense) || 0), 0);
  const amortization = startups.reduce((sum, expense) => {
    if (!expense.includeAmortization || !(Number(expense.amortizeMonths) > 0)) return sum;
    return sum + Number(amountFor(expense) || 0) / Number(expense.amortizeMonths);
  }, 0);

  const fixedExpenses = recurring.filter((expense) => expense.kind === "fixed");
  const fixedOperatingCosts = fixedExpenses.reduce((sum, expense) => sum + normalizedFixed(amountFor(expense), expense.period), 0) + amortization;
  const monthlyProducts = products.filter((product) => !product.archived);
  const productRows = monthlyProducts.map((product) => {
    const billingMonths = BILLING_MONTHS[product.billing] || 1;
    const monthlyPrice = normalizePrice(product.price, product.billing);
    const volume = Math.max(0, Number(product.volume) || 0);
    let variableUnitCost = Math.max(0, Number(product.baseVariableCost) || 0);
    const variableRows = [];
    recurring.filter((expense) => expense.kind !== "fixed").forEach((expense) => {
      if (expense.productId && expense.productId !== product.id) return;
      const amount = Number(amountFor(expense)) || 0;
      let cost = 0;
      if (expense.kind === "perUnit") {
        const factor = expense.usageKey === "rendersPerCustomer" ? Number(product.rendersPerCustomer || 0) : Number(expense.usagePerUnit || 1);
        cost = amount * factor;
      } else if (expense.kind === "percentRevenue") {
        cost = monthlyPrice * amount;
      } else if (expense.kind === "perTransaction") {
        cost = amount / billingMonths;
      }
      variableUnitCost += cost;
      if (cost > 0) variableRows.push({ id: expense.id, name: expense.name, category: expense.category, amount: cost });
    });
    const contribution = monthlyPrice - variableUnitCost;
    const revenue = monthlyPrice * volume;
    const totalVariableCost = variableUnitCost * volume;
    return { ...product, billingMonths, monthlyPrice, volume, variableUnitCost, contribution, contributionRate: monthlyPrice > 0 ? contribution / monthlyPrice : null, revenue, totalVariableCost, totalContribution: contribution * volume, variableRows };
  });

  const totalVolume = productRows.reduce((sum, product) => sum + product.volume, 0);
  const revenue = productRows.reduce((sum, product) => sum + product.revenue, 0);
  const variableCosts = productRows.reduce((sum, product) => sum + product.totalVariableCost, 0);
  const contribution = revenue - variableCosts;
  const weightedContribution = totalVolume > 0 ? contribution / totalVolume : (productRows.length ? productRows.reduce((sum, product) => sum + product.contribution, 0) / productRows.length : 0);
  const weightedPrice = totalVolume > 0 ? revenue / totalVolume : (productRows.length ? productRows.reduce((sum, product) => sum + product.monthlyPrice, 0) / productRows.length : 0);
  const breakEvenUnits = weightedContribution > 0 ? fixedOperatingCosts / weightedContribution : null;
  const breakEvenRevenue = breakEvenUnits == null ? null : breakEvenUnits * weightedPrice;
  const profit = contribution - fixedOperatingCosts;
  const marginOfSafety = breakEvenUnits == null || totalVolume <= 0 ? null : (totalVolume - breakEvenUnits) / totalVolume;
  const expectedTotalCosts = fixedOperatingCosts + variableCosts;
  const expenseRows = [];
  recurring.forEach((expense) => {
    const amount = Number(amountFor(expense)) || 0;
    let monthlyCost = 0;
    if (expense.kind === "fixed") monthlyCost = normalizedFixed(amount, expense.period);
    else if (expense.kind === "perUnit") {
      monthlyCost = productRows.filter((product) => !expense.productId || product.id === expense.productId).reduce((sum, product) => sum + amount * (expense.usageKey === "rendersPerCustomer" ? Number(product.rendersPerCustomer || 0) : Number(expense.usagePerUnit || 1)) * product.volume, 0);
    } else if (expense.kind === "percentRevenue") {
      monthlyCost = productRows.filter((product) => !expense.productId || product.id === expense.productId).reduce((sum, product) => sum + product.monthlyPrice * amount * product.volume, 0);
    } else if (expense.kind === "perTransaction") {
      monthlyCost = productRows.filter((product) => !expense.productId || product.id === expense.productId).reduce((sum, product) => sum + (amount / product.billingMonths) * product.volume, 0);
    }
    expenseRows.push({ ...expense, currentAmount: amount, monthlyCost });
  });

  return { fixedOperatingCosts, variableCosts, variablePerUnit: totalVolume > 0 ? variableCosts / totalVolume : 0, startupCash, amortization, revenue, contribution, weightedContribution, weightedPrice, totalVolume, expectedTotalCosts, profit, breakEvenUnits, breakEvenRevenue, marginOfSafety, productRows, expenseRows };
}
