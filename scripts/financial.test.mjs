import test from "node:test";
import assert from "node:assert/strict";
import { computeModel, normalizePrice } from "../core.js";

const product=(overrides={})=>({id:"p1",name:"Plan",billing:"monthly",price:10,volume:20,baseVariableCost:2,rendersPerCustomer:0,...overrides});
const fixed=(amount,overrides={})=>({id:"fixed",name:"Fixed",scope:"operating",kind:"fixed",period:"monthly",amount,enabled:true,...overrides});

test("single-product contribution, break-even and profit use the stated formulas",()=>{
  const m=computeModel([fixed(100)],[product()]);
  assert.equal(m.revenue,200);
  assert.equal(m.variableCosts,40);
  assert.equal(m.fixedOperatingCosts,100);
  assert.equal(m.weightedContribution,8);
  assert.equal(m.breakEvenUnits,12.5);
  assert.equal(m.breakEvenRevenue,125);
  assert.equal(m.profit,60);
  assert.equal(m.marginOfSafety,.375);
});

test("zero contribution does not show a finite break-even",()=>{
  const m=computeModel([fixed(100)],[product({price:10,baseVariableCost:10,volume:5})]);
  assert.equal(m.weightedContribution,0);
  assert.equal(m.breakEvenUnits,null);
  assert.equal(m.breakEvenRevenue,null);
  assert.equal(m.profit,-100);
  assert.equal(m.marginOfSafety,null);
});

test("negative contribution does not show a finite break-even",()=>{
  const m=computeModel([fixed(100)],[product({price:5,baseVariableCost:6,volume:10})]);
  assert.equal(m.weightedContribution,-1);
  assert.equal(m.breakEvenUnits,null);
  assert.equal(m.profit,-110);
});

test("annual recurring fixed costs normalize monthly and startup cash stays separate",()=>{
  const costs=[fixed(120,{period:"annual"}),{id:"start",name:"Build",scope:"startup",kind:"fixed",period:"oneTime",amount:1200,enabled:true,includeAmortization:false,amortizeMonths:12}];
  const m=computeModel(costs,[product({volume:0})]);
  assert.equal(m.fixedOperatingCosts,10);
  assert.equal(m.startupCash,1200);
  assert.equal(m.amortization,0);
  costs[1].includeAmortization=true;
  const withAmort=computeModel(costs,[product({volume:0})]);
  assert.equal(withAmort.fixedOperatingCosts,110);
  assert.equal(withAmort.amortization,100);
  assert.equal(normalizePrice(120,"annual"),10);
});

test("multiple products use the entered sales mix without double-counting shared fixed cost",()=>{
  const products=[product({id:"a",price:10,volume:3,baseVariableCost:2}),product({id:"b",price:20,volume:1,baseVariableCost:5})];
  const m=computeModel([fixed(39)],products);
  assert.equal(m.revenue,50);
  assert.equal(m.variableCosts,11);
  assert.equal(m.contribution,39);
  assert.equal(m.weightedContribution,9.75);
  assert.equal(m.breakEvenUnits,4);
  assert.equal(m.profit,0);
});

test("annual subscription processor fees and image usage are monthly-normalized",()=>{
  const costs=[
    {id:"api",name:"AI output",scope:"operating",kind:"perUnit",period:"per unit",amount:.04,enabled:true,usageKey:"rendersPerCustomer"},
    {id:"pct",name:"Card percentage",scope:"operating",kind:"percentRevenue",period:"%",amount:.029,enabled:true},
    {id:"txn",name:"Transaction fee",scope:"operating",kind:"perTransaction",period:"per transaction",amount:.30,enabled:true}
  ];
  const m=computeModel(costs,[product({billing:"annual",price:120,volume:1,rendersPerCustomer:10,baseVariableCost:0})]);
  assert.equal(m.productRows[0].monthlyPrice,10);
  assert.ok(Math.abs(m.productRows[0].variableUnitCost-(.4+.29+.025))<1e-12);
});

test("disabled costs are excluded from operating totals",()=>{
  const m=computeModel([fixed(999,{enabled:false})],[product({volume:0})]);
  assert.equal(m.fixedOperatingCosts,0);
  assert.equal(m.profit,0);
});
