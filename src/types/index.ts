export interface StageTiming {
  stage: '待开标' | '开标中' | '评标中' | '结果公示';
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface Enterprise {
  id: string;
  name: string;
  qualification: string;
}

export interface Project {
  id: string;
  projectCode: string;
  budgetAmount: number;
  procurementMethod: '公开招标' | '邀请招标' | '竞争性谈判' | '竞争性磋商' | '单一来源' | '询价';
  biddingEnterprises: Enterprise[];
  openBidTime: string;
  status: '待开标' | '开标中' | '评标中' | '结果公示';
  industry: string;
  evaluationRoomId?: string;
  expertGroupId?: string;
  createdAt: string;
  stageTimings: StageTiming[];
}

export interface ScheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
  projectId: string;
}

export interface EvaluationRoom {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  status: '空闲' | '占用' | '维护';
  currentProjectId?: string;
  scheduleSlots: ScheduleSlot[];
}

export interface Expert {
  id: string;
  name: string;
  phone: string;
  profession: string[];
  region: string;
  unit: string;
  creditRating: 'A+' | 'A' | 'B+' | 'B' | 'C';
  avoidanceUnits: string[];
  avoidanceRegions: string[];
  status: '可用' | '已抽取' | '已确认' | '已回避' | '迟到';
  confirmedAt?: string;
}

export interface ExtractedExpert {
  expertId: string;
  weight: number;
  isSelected: boolean;
  response: '待确认' | '已确认' | '已回避';
}

export interface ExtractionRecord {
  id: string;
  projectId: string;
  experts: ExtractedExpert[];
  approvalStatus: '待审批' | '已通过' | '已驳回';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface ValidationRecord {
  step: 'format' | 'signature' | 'encryption';
  passed: boolean;
  message: string;
  timestamp: string;
}

export interface BiddingDocument {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadTime: string;
  signatureValid: boolean;
  encryptionValid: boolean;
  type: '投标文件' | '评标报告' | '其他';
  signed?: boolean;
  archived?: boolean;
  validationHistory: ValidationRecord[];
  originalFailedDocId?: string;
}

export interface FailedDocument {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadTime: string;
  type: '投标文件' | '评标报告' | '其他';
  failedStep: 'format' | 'signature' | 'encryption';
  failedReason: string;
  reuploadedToDocId?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  read: boolean;
  createdAt: string;
}
