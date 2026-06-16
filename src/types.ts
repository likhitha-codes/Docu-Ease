export interface UserProfile {
  email: string;
  displayName: string;
  trustScore: number;
  isLoggedIn?: boolean;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface HistoryItem {
  id: string;
  originalText: string;
  timestamp: string;
  title: string;
  summary: string;
  simplifiedEnglish: string;
  teluguTranslation: string;
  hindiTranslation: string;
  glossary: GlossaryItem[];
  documentType: string;
  isDocument: boolean;
  isGovernmentRelated: boolean;
  trustScoreImpact?: number;
}
