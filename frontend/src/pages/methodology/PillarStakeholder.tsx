import { PillarLayout, type PillarData } from './PillarLayout'

const data: PillarData = {
  number: '2',
  title: 'Stakeholder Integration',
  tagline: 'The Power of Collaboration',
  description:
    'Building collaborative relationships and ensuring stakeholder alignment across all facility management operations — transparent accountability with internal teams, vendors, landlords, and IT, with compliance built in from day one.',
  accent: {
    color:  '#0ea5e9',
    bg:     'rgba(14,165,233,0.15)',
    border: 'rgba(14,165,233,0.5)',
    text:   '#38bdf8',
  },
  keyBenefits: [
    { emoji: '🤝', label: 'Stakeholder Alignment', desc: 'Unified facility goals' },
    { emoji: '🔗', label: 'Relationship Building',  desc: 'Strong partnerships' },
    { emoji: '📡', label: 'Improved Communication', desc: 'Clear information flow' },
  ],
  processCycle: [
    { action: 'Identify',    desc: 'Map all stakeholders' },
    { action: 'Engage',      desc: 'Build relationships' },
    { action: 'Communicate', desc: 'Share information' },
    { action: 'Collaborate', desc: 'Work together' },
    { action: 'Measure',     desc: 'Track satisfaction' },
    { action: 'Evolve',      desc: 'Continuous improvement' },
  ],
  coreComponents: [
    {
      title: 'Stakeholder Mapping',
      features: ['Stakeholder Analysis', 'Interest / Influence Assessment', 'Priority Ranking'],
      cta: 'Explore Stakeholder Tools',
    },
    {
      title: 'Communication Frameworks',
      features: ['Multi-Channel Communication', 'Regular Updates & Reports', 'Feedback Mechanisms'],
      cta: 'Explore Communication Suite',
    },
    {
      title: 'Collaboration Tools',
      features: ['Shared Digital Platforms', 'Joint Planning Sessions', 'Performance Dashboards'],
      cta: 'Explore Collaboration Tools',
    },
  ],
  phases: [
    {
      title: 'Stakeholder Discovery & Assessment',
      duration: 'Months 1–2',
      tags: ['Stakeholder Identification', 'Interest / Impact Analysis', 'Priority Matrix'],
    },
    {
      title: 'Communication Framework Development',
      duration: 'Months 3–4',
      tags: ['Channel Selection', 'Message Planning', 'Feedback Loops'],
    },
    {
      title: 'Collaboration Platform Implementation',
      duration: 'Months 5–6',
      tags: ['Technology Setup', 'Process Design', 'User Training'],
    },
    {
      title: 'Relationship Optimisation & Monitoring',
      duration: 'Month 7+',
      tags: ['Performance Tracking', 'Satisfaction Measurement', 'Continuous Improvement'],
    },
  ],
  kpis: [
    { value: '86%',  label: 'Stakeholder Satisfaction', desc: 'Engagement level achieved' },
    { value: '62%',  label: 'Process Efficiency',        desc: 'Improvement through collaboration' },
    { value: '91%',  label: 'Communication Effectiveness', desc: 'Information flow quality' },
    { value: '3.2×', label: 'Decision-Making Speed',     desc: 'Faster approvals and sign-offs' },
  ],
  caseStudy: {
    before: [
      'Siloed departments with limited communication',
      'Slow, bureaucratic decision-making processes',
      'Conflicting operational priorities between teams',
      'Poor stakeholder alignment on facility goals',
    ],
    after: [
      'Integrated cross-functional teams with shared objectives',
      'Streamlined, data-driven decision-making',
      'Unified operational objectives across all departments',
      'Strong stakeholder partnerships that drive performance',
    ],
    quote:
      'Stakeholder Integration transformed our organisation from disconnected silos to a unified, collaborative entity. We achieved 86% stakeholder satisfaction, improved decision-making speed by 3.2×, and created a culture of partnership that drives continuous improvement.',
  },
  otherPillars: [
    { title: 'Systematic Processes', route: '/methodology/systematic-processes', number: '1' },
    { title: 'Data Intelligence',    route: '/methodology/data-intelligence',    number: '3' },
    { title: 'Continuous Innovation',route: '/methodology/continuous-innovation',number: '4' },
  ],
}

export function PillarStakeholderPage() {
  return <PillarLayout data={data} />
}
