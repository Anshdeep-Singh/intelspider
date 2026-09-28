export type VerificationLevel =
  | 'CRYPTOGRAPHIC_DNS'
  | 'HTTP_HEADER_VERIFIED'
  | 'DOM_SIGNATURE_VERIFIED'
  | 'ATS_API_VERIFIED'
  | 'INFERRED_ANALYSIS';

export type FactCategory =
  | 'INFRASTRUCTURE'
  | 'SECURITY'
  | 'TECH_STACK'
  | 'HIRING_SIGNALS'
  | 'BUSINESS_MODEL';

export interface FactEntry {
  id: string;
  category: FactCategory;
  label: string;
  verificationLevel: VerificationLevel;
  rawProof: string;
  source: string;
  sha256: string;
  timestamp: string;
  confidence: number;
}

export interface DnsAuditResult {
  domain: string;
  mailProvider: 'Google Workspace' | 'Microsoft 365' | 'Mimecast' | 'Proofpoint' | 'Custom' | 'Unknown';
  mxRecords: Array<{ priority: number; exchange: string }>;
  hasSpf: boolean;
  spfRecord: string | null;
  hasDmarc: boolean;
  dmarcRecord: string | null;
  dmarcPolicy: 'reject' | 'quarantine' | 'none' | 'missing';
  nameservers: string[];
  cdnDnsProvider: 'Cloudflare' | 'AWS Route 53' | 'Akamai' | 'Google Cloud DNS' | 'Azure DNS' | 'Other';
  emailSecurityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  domainVerifications: string[];
  rawRecords: Record<string, string[]>;
}

export interface DetectedTechnology {
  name: string;
  category: 'Frontend' | 'Analytics' | 'TagManager' | 'Observability' | 'Chat' | 'CDN' | 'CRM' | 'Security';
  matchedPattern: string;
  confidence: number;
  proofSnippet: string;
}

export interface HttpTechAuditResult {
  domain: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  securityHeaders: {
    hsts: boolean;
    csp: boolean;
    xFrameOptions: string | null;
    xContentTypeOptions: boolean;
  };
  serverHeader: string | null;
  detectedTechnologies: DetectedTechnology[];
}

export interface EngineeringRole {
  id: string;
  title: string;
  location: string;
  url: string;
  department: string;
  keyTechKeywords: string[];
}

export interface AtsAuditResult {
  provider: 'greenhouse' | 'lever' | 'ashby' | 'none';
  slug: string | null;
  totalOpenRoles: number;
  engineeringRoles: EngineeringRole[];
  topEngineeringKeywords: Array<{ keyword: string; count: number }>;
  hiringVelocityIndex: 'Aggressive Expansion' | 'Steady Engineering Growth' | 'Selective Replacement' | 'No Public Postings';
}

export interface AuditLedger {
  facts: FactEntry[];
  totalFacts: number;
  deterministicCount: number;
  inferredCount: number;
  verificationRatio: number;
  auditIntegrityHash: string;
}

export interface PersonaHook {
  thesis: string;
  hook: string;
  citedFactIds: string[];
}

export interface DiscoveryQuestion {
  question: string;
  rationale: string;
  targetPersona: 'CTO' | 'VP_ENG' | 'CRO';
  citedFactIds: string[];
}

export interface CompetitiveLandmine {
  landmine: string;
  counterStrategy: string;
  citedFactIds: string[];
}

export interface ExecutiveBattlecard {
  targetDomain: string;
  companyName: string;
  targetProfile: {
    summary: string;
    primaryOffering: string;
    cloudFootprint: string;
    estimatedEngMaturity: 'Enterprise Tier 1' | 'High-Growth Scaleup' | 'Mid-Market Modern' | 'Legacy Hybrid';
  };
  personaHooks: {
    cto: PersonaHook;
    vpEngineering: PersonaHook;
    cro: PersonaHook;
  };
  highStakesDiscoveryQuestions: DiscoveryQuestion[];
  competitiveLandmines: CompetitiveLandmine[];
  auditSummary: {
    groundingScore: number;
    verifiedCitationCount: number;
    unverifiedClaimsCount: number;
    hallucinationAlerts: string[];
  };
}

export interface ReconReport {
  id: string;
  domain: string;
  timestamp: string;
  dnsAudit: DnsAuditResult;
  httpAudit: HttpTechAuditResult;
  atsAudit: AtsAuditResult;
  auditLedger: AuditLedger;
  battlecard: ExecutiveBattlecard;
}

export type ReconStreamEvent =
  | { type: 'STEP_START'; step: string; message: string; timestamp: number }
  | { type: 'STEP_PROGRESS'; step: string; message: string; progress: number }
  | { type: 'FACT_DISCOVERED'; fact: FactEntry }
  | { type: 'AUDIT_STAGE_COMPLETE'; stage: 'DNS' | 'HTTP' | 'ATS' | 'REASONING' | 'AUDIT'; data: any }
  | { type: 'VERIFICATION_ALERT'; alertType: 'PASSED' | 'WARNING' | 'FAILED'; message: string }
  | { type: 'COMPLETE'; report: ReconReport }
  | { type: 'ERROR'; message: string };
