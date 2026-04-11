import { PillarLayout, type PillarData } from './PillarLayout'

const data: PillarData = {
  number: '4',
  title: 'Continuous Innovation',
  tagline: 'The Power of Forward Thinking',
  description:
    'Fostering an innovation culture and implementing emerging technologies to drive continuous improvement in facility management — each completed plan enriches the intelligence layer, as the system learns from every operation across every location.',
  accent: {
    color:  '#f59e0b',
    bg:     'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.5)',
    text:   '#fcd34d',
  },
  keyBenefits: [
    { emoji: '🚀', label: 'Technology Integration',  desc: 'Adopt cutting-edge solutions' },
    { emoji: '🏆', label: 'Operational Excellence',  desc: 'Continuous process improvement' },
    { emoji: '💡', label: 'Innovation Culture',       desc: 'Foster creative problem-solving' },
  ],
  processCycle: [
    { action: 'Explore',     desc: 'Identify opportunities' },
    { action: 'Ideate',      desc: 'Generate solutions' },
    { action: 'Experiment',  desc: 'Test concepts safely' },
    { action: 'Implement',   desc: 'Deploy innovations' },
    { action: 'Measure',     desc: 'Track impact & ROI' },
    { action: 'Scale',       desc: 'Expand successes' },
  ],
  coreComponents: [
    {
      title: 'Innovation Processes',
      features: ['Innovation Framework', 'Idea Management System', 'Pilot Programs'],
      cta: 'Explore Innovation Framework',
    },
    {
      title: 'Technology Adoption',
      features: ['Technology Assessment', 'Implementation Planning', 'ROI Analysis'],
      cta: 'Explore Technology Suite',
    },
    {
      title: 'Improvement Culture',
      features: ['Culture Development', 'Training Programs', 'Recognition Systems'],
      cta: 'Explore Culture Tools',
    },
  ],
  phases: [
    {
      title: 'Innovation Foundation & Culture Building',
      duration: 'Months 1–2',
      tags: ['Innovation Governance', 'Culture Assessment', 'Idea Management System'],
    },
    {
      title: 'Technology Exploration & Assessment',
      duration: 'Months 3–4',
      tags: ['Technology Scouting', 'Feasibility Studies', 'Pilot Design'],
    },
    {
      title: 'Pilot Implementation & Testing',
      duration: 'Months 5–7',
      tags: ['Pilot Execution', 'Performance Monitoring', 'Iterative Refinement'],
    },
    {
      title: 'Scale & Continuous Innovation',
      duration: 'Month 8+',
      tags: ['Scaling Strategy', 'Innovation Cycles', 'Sustainability Framework'],
    },
  ],
  kpis: [
    { value: '78%',  label: 'Innovation Adoption Rate', desc: 'Successful technology integration' },
    { value: '43%',  label: 'Efficiency Improvement',   desc: 'Through innovative solutions' },
    { value: '95%',  label: 'Team Engagement',          desc: 'In improvement initiatives' },
    { value: '5.1×', label: 'Innovation ROI',           desc: 'Return on innovation investment' },
  ],
  caseStudy: {
    before: [
      'Manual monitoring and control systems only',
      'Reactive maintenance with no predictive capability',
      'High energy consumption and uncontrolled operational costs',
      'Limited innovation adoption and change-averse culture',
    ],
    after: [
      'IoT-enabled smart building systems fully deployed',
      'Predictive maintenance implementation across all assets',
      '43% reduction in operational costs through smart systems',
      'Innovation-driven team culture with 95% engagement rate',
    ],
    quote:
      'By embracing Continuous Innovation, we transformed facility management from traditional approaches to cutting-edge smart building operations. This resulted in 78% successful technology adoption and a 5.1× return on innovation investment, while creating an engaged, forward-thinking team.',
  },
  otherPillars: [
    { title: 'Systematic Processes',    route: '/methodology/systematic-processes',    number: '1' },
    { title: 'Stakeholder Integration', route: '/methodology/stakeholder-integration', number: '2' },
    { title: 'Data Intelligence',       route: '/methodology/data-intelligence',       number: '3' },
  ],
}

export function PillarInnovationPage() {
  return <PillarLayout data={data} />
}
