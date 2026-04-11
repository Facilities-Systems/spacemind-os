import { PillarLayout, type PillarData } from './PillarLayout'

const data: PillarData = {
  number: '1',
  title: 'Systematic Processes',
  tagline: 'The Power of Standardisation',
  description:
    'Establishing standardised, documented processes and workflows that ensure consistency, compliance, and operational excellence across every facilities operation — from reactive maintenance to 90-day full fit-outs.',
  accent: {
    color:  '#6366f1',
    bg:     'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.5)',
    text:   '#a5b4fc',
  },
  keyBenefits: [
    { emoji: '⚙️', label: 'Consistency',  desc: 'Standardised operations' },
    { emoji: '📋', label: 'Compliance',   desc: 'Regulatory alignment' },
    { emoji: '⚡', label: 'Efficiency',   desc: 'Optimised workflows' },
  ],
  processCycle: [
    { action: 'Analyse',   desc: 'Current state assessment' },
    { action: 'Design',    desc: 'Process redesign' },
    { action: 'Document',  desc: 'Create SOPs' },
    { action: 'Implement', desc: 'Rollout & training' },
    { action: 'Monitor',   desc: 'Track performance' },
    { action: 'Improve',   desc: 'Continuous optimisation' },
  ],
  coreComponents: [
    {
      title: 'Standard Operating Procedures',
      features: ['Process Documentation', 'Workflow Clarity', 'Compliance Standards'],
      cta: 'Explore SOP Framework',
    },
    {
      title: 'Workflow Optimisation',
      features: ['Efficiency Improvement', 'Bottleneck Elimination', 'Performance Metrics'],
      cta: 'Explore Workflow Tools',
    },
    {
      title: 'Quality Control Systems',
      features: ['Quality Assurance', 'Performance Monitoring', 'Continuous Improvement'],
      cta: 'Explore QC Systems',
    },
  ],
  phases: [
    {
      title: 'Process Analysis & Documentation',
      duration: 'Months 1–2',
      tags: ['Current State Mapping', 'Process Analysis', 'Documentation Preparation'],
    },
    {
      title: 'SOP Development',
      duration: 'Months 3–4',
      tags: ['SOP Creation', 'Standard Templates', 'Training Materials'],
    },
    {
      title: 'Workflow Optimisation',
      duration: 'Months 5–6',
      tags: ['Workflow Redesign', 'Technology Integration', 'Performance Metrics'],
    },
    {
      title: 'Quality Control Implementation',
      duration: 'Month 7+',
      tags: ['Quality Frameworks', 'Compliance Monitoring', 'Continuous Improvement'],
    },
  ],
  kpis: [
    { value: '73%',  label: 'Process Efficiency',  desc: 'Improvement from baseline' },
    { value: '45%',  label: 'Error Reduction',      desc: 'Quality improvement achieved' },
    { value: '89%',  label: 'Compliance Score',     desc: 'Regulatory adherence' },
    { value: '2.5×', label: 'Training Effectiveness', desc: 'Knowledge retention improvement' },
  ],
  caseStudy: {
    before: [
      'Inconsistent processes across departments',
      'High error rates and rework',
      'Unclear responsibilities and accountability',
      'Low process documentation coverage',
    ],
    after: [
      'Standardised, documented processes across all departments',
      '45% reduction in errors and rework',
      'Clear accountability and responsibilities at every level',
      'Comprehensive process documentation with version control',
    ],
    quote:
      'Systematic Processes standardised our operations, reducing errors by 45%, achieving an 89% compliance score, and improving process efficiency by 73%. This created a culture of operational excellence and enabled consistent, high-quality facility management.',
  },
  otherPillars: [
    { title: 'Stakeholder Integration', route: '/methodology/stakeholder-integration', number: '2' },
    { title: 'Data Intelligence',       route: '/methodology/data-intelligence',       number: '3' },
    { title: 'Continuous Innovation',   route: '/methodology/continuous-innovation',   number: '4' },
  ],
}

export function PillarSystematicPage() {
  return <PillarLayout data={data} />
}
