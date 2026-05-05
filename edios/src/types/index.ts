export interface Client {
  id: string
  name: string
  sourceCountry: string
  sourceFlag: string
  destinationCountry: string
  destinationFlag: string
  visaType: string
  university: string
  course: string
  qualityScore: number
  approvalProbability: number
  status: 'In Progress' | 'Ready to Submit' | 'Submitted' | 'At Risk' | 'High Risk' | 'Approved' | 'Refused'
  submissionDate: string
  factors: {
    financialStrength: number
    genuineTemporaryEntrant: number
    academicFit: number
    englishProficiency: number
    immigrationHistory: number
    tiesHomeCountry: number
  }
  documents: Array<{
    name: string
    status: 'complete' | 'pending' | 'in_review'
  }>
  notes: string
  timeline: Array<{
    date: string
    event: string
    type: 'info' | 'success' | 'warning'
  }>
}

export interface VisaSignal {
  id: string
  country: string
  flag: string
  visaSubclass: string
  currentApprovalRate: number
  previousApprovalRate: number
  trend: 'rising' | 'declining' | 'stable'
  avgProcessingDays: number
  processingTrend: 'improving' | 'worsening' | 'stable'
  riskLevel: 'low' | 'medium' | 'high'
  lastUpdated: string
  recentChanges: Array<{
    date: string
    type: 'policy' | 'processing' | 'statistics' | 'positive_change'
    title: string
    impact: 'high' | 'medium' | 'low' | 'positive'
    description: string
  }>
  monthlyTrend: Array<{
    month: string
    rate: number
    volume: number
  }>
  topSourceCountries: Array<{
    country: string
    share: number
  }>
}

export interface SourceMarket {
  id: string
  country: string
  flag: string
  region: string
  studentVolume: number
  yoyGrowth: number
  topDestination: string
  topDestinationShare: number
  sentimentTrend: 'growing' | 'stable' | 'declining'
  avgAgentFee: number
  destinations: Array<{ country: string; share: number }>
  primaryMotivations: string[]
  topCourses: string[]
  avgIELTS: number
  challengeFactors: string[]
  insight: string
}

export interface Alert {
  id: string
  timestamp: string
  country: string
  countryFlag: string
  severity: 'high' | 'medium' | 'info'
  type: string
  title: string
  body: string
  read: boolean
  affectedVisaType: string
  actionRequired: boolean
}
