'use client';
import { useState } from 'react';
import { Demo, Range } from './Demo';
import { baseSessions, productPrices, revenueModel, money, number } from './demo-data';
import type { ModuleProps } from './types';
const initialMix = [50, 35, 15];
const baseline = revenueModel(baseSessions, 2.4, initialMix);
const labels = ['Revenue', 'Three drivers', 'Channel & mix', 'Explain change'];
const descriptions = [
  'Start with revenue: the outcome the whole tree explains.',
  'Sessions × conversion rate × average order value = revenue.',
  'Traffic is the sum of channels. Order value is weighted by the product mix.',
  'Adjust a driver and compare the result with the baseline. Reset to try another scenario.',
];
export default function KpiTree(props: ModuleProps) {
  const [sessions, setSessions] = useState([...baseSessions]);
  const [conversion, setConversion] = useState(2.4);
  const [mix, setMix] = useState([...initialMix]);
  const model = revenueModel(sessions, conversion, mix);
  const delta = model.revenue - baseline.revenue;
  const totalWeight = mix.reduce((a, b) => a + b, 0);
  return (
    <Demo
      {...props}
      title="The KPI tree"
      subtitle="Trace the headline back to its drivers."
      labels={labels}
      onReset={() => {
        setSessions([...baseSessions]);
        setConversion(2.4);
        setMix([...initialMix]);
      }}
    >
      <p className="demo-note">{descriptions[props.step]}</p>
      <div className="demo-tree-root">
        <span>Modelled revenue</span>
        <strong>{money(model.revenue)}</strong>
        <p role="status">
          {delta >= 0 ? '+' : '−'}
          {money(Math.abs(delta))} ({((delta / baseline.revenue) * 100).toFixed(1)}%) vs baseline
        </p>
      </div>
      <div className="demo-tree-branches">
        <div>
          Sessions<strong>{number(model.sessions)}</strong>Sum of channel traffic
        </div>
        <div>
          × Conversion rate<strong>{conversion.toFixed(1)}%</strong>
          {number(model.orders)} modelled orders
        </div>
        <div>
          × Order value<strong>£{model.aov.toFixed(2)}</strong>Weighted product mix
        </div>
      </div>
      <div className="demo-grid">
        <section className="demo-panel">
          <h3>Channel traffic</h3>
          {['Search sessions', 'Social sessions', 'Email sessions'].map((label, i) => (
            <Range
              key={label}
              label={label}
              min={0}
              max={25000}
              step={500}
              value={sessions[i]!}
              display={number(sessions[i]!)}
              onChange={(v) => setSessions(sessions.map((s, j) => (j === i ? v : s)))}
            />
          ))}
          <Range
            label="Conversion rate"
            value={conversion}
            min={0}
            max={8}
            step={0.1}
            display={`${conversion.toFixed(1)}%`}
            onChange={setConversion}
          />
        </section>
        <section className="demo-panel">
          <h3>Product mix</h3>
          <p className="demo-note">Relative order weights are normalised to 100%. Prices stay fixed.</p>
          {['Essentials', 'Signature', 'Premium'].map((name, i) => (
            <Range
              key={name}
              label={`${name} · £${productPrices[i]}`}
              value={mix[i]!}
              min={0}
              max={100}
              display={`${totalWeight ? Math.round((mix[i]! / totalWeight) * 100) : 0}% share`}
              onChange={(v) => setMix(mix.map((s, j) => (j === i ? v : s)))}
            />
          ))}
          {totalWeight === 0 && (
            <p className="demo-status">
              No product mix selected. Increase a weight to calculate order value.
            </p>
          )}
        </section>
      </div>
      <p className="demo-note">
        Baseline: {number(baseline.sessions)} sessions × 2.4% × £{baseline.aov.toFixed(2)} ={' '}
        {money(baseline.revenue)}. This is a scenario model, not a forecast.
      </p>
    </Demo>
  );
}
