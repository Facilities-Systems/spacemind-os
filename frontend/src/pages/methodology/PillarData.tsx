import { PillarLayout, type PillarData } from './PillarLayout'

const data: PillarData = {
  number: '3',
  title: 'Data Intelligence',
  tagline: 'The Power of Informed Decisions',
  description:
    'Leveraging data analytics, multi-agent AI, and business intelligence to drive informed decision-making in facility management — five specialist AI agents analyse every dimension, then synthesise into a single authoritative plan.',
  accent: {
    color:  '#a855f7',
    bg:     'rgba(168,85,247,0.15)',
    border: 'rgba(168,85,247,0.5)',
    text:   '#d8b4fe',
  },
  keyBenefits: [
    { emoji: '🔮', label: 'Predictive Insights',  desc: 'AI-powered foresight' },
    { emoji: '⚙️', label: 'Optimised Operations', desc: 'Data-driven efficiency' },
    { emoji: '📊', label: 'Performance Tracking',  desc: 'Real-time KPI monitoring' },
  ],
  processCycle: [
    { action: 'Collect',     desc: 'Gather operational data' },
    { action: 'Process',     desc: 'Clean and validate' },
    { action: 'Analyse',     desc: 'Extract insights' },
    { action: 'Visualise',   desc: 'Create dashboards' },
    { action: 'Interpret',   desc: 'Generate recommendations' },
    { action: 'Act',         desc: 'Implement decisions' },
  ],
  coreComponents: [
    {
      title: 'Data Collection & Integration',
      features: ['Multi-Source Integration', 'Real-Time Data Streams', 'Data Quality Assurance'],
      cta: 'Explore Data Systems',
    },
    {
      title: 'Analytics & Reporting',
      features: ['Statistical Analysis', 'Automated Reporting', 'Interactive Dashboards'],
      cta: 'Explore Analytics Suite',
    },
    {
      title: 'Predictive Insights',
      features: ['Predictive Modelling', 'Trend Forecasting', 'AI Risk Assessment'],
      cta: 'Explore Predictive Tools',
    },
  ],
  phases: [
    {
      title: 'Data Infrastructure Setup',
      duration: 'Weeks 1–3',
      tags: ['Data Architecture', 'IoT Integration', 'Quality Framework'],
    },
    {
      title: 'Analytics Platform Development',
      duration: 'Weeks 4–6',
      tags: ['Dashboard Creation', 'Report Automation', 'KPI Monitoring'],
    },
    {
      title: 'Predictive Model Implementation',
      duration: 'Weeks 7–9',
      tags: ['ML Model Training', 'Predictive Algorithms', 'Validation Testing'],
    },
    {
      title: 'Intelligence Integration & Optimisation',
      duration: 'Weeks 10–12',
      tags: ['Workflow Integration', 'Performance Tuning', 'Continuous Learning'],
    },
  ],
  kpis: [
    { value: '67%',  label: 'Predictive Accuracy',  desc: 'For maintenance forecasting' },
    { value: '54%',  label: 'Cost Reduction',        desc: 'Through optimised operations' },
    { value: '92%',  label: 'Data Quality Score',    desc: 'Reliable information foundation' },
    { value: '4.3×', label: 'Faster Insights',       desc: 'Automated analysis speed' },
  ],
  caseStudy: {
    before: [
      'Reactive maintenance approach with no forecasting',
      'High equipment downtime and unplanned costs',
      'Limited visibility into system health and trends',
      'Manual, time-consuming reporting and analysis',
    ],
    after: [
      'Proactive maintenance scheduling driven by AI predictions',
      '54% reduction in operational costs from optimisation',
      'Real-time system monitoring with automated alerts',
      'Automated insights delivered instantly to decision-makers',
    ],
    quote:
      'Data Intelligence transformed our maintenance strategy from reactive to predictive, achieving 67% accuracy in failure forecasting, reducing unplanned downtime by 78%, and cutting operational costs by 54% through AI-optimised planning.',
  },
  otherPillars: [
    { title: 'Systematic Processes',    route: '/methodology/systematic-processes',    number: '1' },
    { title: 'Stakeholder Integration', route: '/methodology/stakeholder-integration', number: '2' },
    { title: 'Continuous Innovation',   route: '/methodology/continuous-innovation',   number: '4' },
  ],
}

export function PillarDataPage() {
  return <PillarLayout data={data} />
}
