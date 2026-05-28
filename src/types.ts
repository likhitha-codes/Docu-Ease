export interface CitizenUser {
  uid?: string;
  email: string;
  fullName: string;
  aadhaarId?: string;
  role: string;
  stateOfResidence: string;
}

export interface SimplifyResult {
  isGovernmentRelated: boolean;
  detectedType: string;
  simplifiedEnglish: string;
  teluguTranslation: string;
  hindiTranslation: string;
  rejectionReason?: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  userEmail: string;
  fileName: string;
  detectedType: string;
  isGovernmentRelated: boolean;
  simplifiedEnglish: string;
  teluguTranslation: string;
  hindiTranslation: string;
}

export interface RecentTaskItem {
  id: string;
  timestamp: string;
  fileName: string;
  detectedType: string;
  result: SimplifyResult;
}

