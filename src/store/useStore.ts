import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  Expert,
  EvaluationRoom,
  ExtractionRecord,
  BiddingDocument,
  Enterprise,
  ExtractedExpert,
} from '../types';
import {
  mockProjects,
  mockExperts,
  mockEvaluationRooms,
  mockExtractionRecords,
  mockDocuments,
  mockEnterprises,
} from '../data/mockData';

interface NotificationItem {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  read: boolean;
  createdAt: string;
}

interface AppState {
  projects: Project[];
  experts: Expert[];
  evaluationRooms: EvaluationRoom[];
  extractionRecords: ExtractionRecord[];
  documents: BiddingDocument[];
  enterprises: Enterprise[];
  notifications: NotificationItem[];
  sidebarCollapsed: boolean;
  unreadCount: number;

  addProject: (project: Project) => void;
  updateProjectStatus: (projectId: string, status: Project['status']) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  addExtractionRecord: (record: ExtractionRecord) => void;
  approveExtraction: (recordId: string, approvedBy: string) => void;
  rejectExtraction: (recordId: string) => void;
  expertConfirm: (expertId: string, recordId: string) => void;
  expertAvoid: (expertId: string, recordId: string) => void;
  updateExpertStatus: (expertId: string, status: Expert['status']) => void;
  updateRoomStatus: (roomId: string, status: EvaluationRoom['status'], projectId?: string) => void;
  addDocument: (doc: BiddingDocument) => void;
  signDocument: (docId: string) => void;
  archiveDocument: (docId: string) => void;
  addNotification: (message: string, type: NotificationItem['type']) => void;
  markNotificationRead: (id: string) => void;
  toggleSidebar: () => void;
  weightedRandomExtraction: (
    projectId: string,
    count: number,
    professionFilter?: string,
    regionFilter?: string
  ) => ExtractionRecord | null;
}

const CREDIT_WEIGHT: Record<Expert['creditRating'], number> = {
  'A+': 10,
  'A': 8,
  'B+': 6,
  'B': 4,
  'C': 2,
};

function weightedRandomSelect(candidates: Expert[], count: number): Expert[] {
  const selected: Expert[] = [];
  const remaining = [...candidates];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const weights = remaining.map((e) => CREDIT_WEIGHT[e.creditRating]);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let j = 0; j < remaining.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        selected.push(remaining[j]);
        remaining.splice(j, 1);
        break;
      }
    }
  }

  return selected;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: mockProjects,
      experts: mockExperts,
      evaluationRooms: mockEvaluationRooms,
      extractionRecords: mockExtractionRecords,
      documents: mockDocuments,
      enterprises: mockEnterprises,
      notifications: [],
      sidebarCollapsed: false,
      unreadCount: 0,

      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),

      updateProjectStatus: (projectId, status) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, status } : p
          ),
        })),

      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p
          ),
        })),

      addExtractionRecord: (record) =>
        set((state) => ({
          extractionRecords: [...state.extractionRecords, record],
        })),

      approveExtraction: (recordId, approvedBy) =>
        set((state) => ({
          extractionRecords: state.extractionRecords.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  approvalStatus: '已通过' as const,
                  approvedBy,
                  approvedAt: new Date().toISOString(),
                }
              : r
          ),
        })),

      rejectExtraction: (recordId) =>
        set((state) => ({
          extractionRecords: state.extractionRecords.map((r) =>
            r.id === recordId
              ? { ...r, approvalStatus: '已驳回' as const }
              : r
          ),
        })),

      expertConfirm: (expertId, recordId) =>
        set((state) => ({
          extractionRecords: state.extractionRecords.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  experts: r.experts.map((e) =>
                    e.expertId === expertId
                      ? { ...e, response: '已确认' as const }
                      : e
                  ),
                }
              : r
          ),
          experts: state.experts.map((e) =>
            e.id === expertId
              ? {
                  ...e,
                  status: '已确认' as const,
                  confirmedAt: new Date().toISOString(),
                }
              : e
          ),
        })),

      expertAvoid: (expertId, recordId) =>
        set((state) => {
          const state_ = {
            extractionRecords: state.extractionRecords.map((r) =>
              r.id === recordId
                ? {
                    ...r,
                    experts: r.experts.map((e) =>
                      e.expertId === expertId
                        ? { ...e, response: '已回避' as const }
                        : e
                    ),
                  }
                : r
            ),
            experts: state.experts.map((e) =>
              e.id === expertId ? { ...e, status: '已回避' as const } : e
            ),
          };

          const record = state.extractionRecords.find((r) => r.id === recordId);
          if (record) {
            const avoidedExperts = record.experts.filter(
              (e) => e.response === '已回避' || e.expertId === expertId
            );
            const supplementaryCount = avoidedExperts.length;
            if (supplementaryCount > 0) {
              const supplementary = get().weightedRandomExtraction(
                record.projectId,
                supplementaryCount
              );
              if (supplementary) {
                state_.extractionRecords = [
                  ...state_.extractionRecords,
                  supplementary,
                ];
              }
            }
          }

          return state_;
        }),

      updateExpertStatus: (expertId, status) =>
        set((state) => ({
          experts: state.experts.map((e) =>
            e.id === expertId ? { ...e, status } : e
          ),
        })),

      updateRoomStatus: (roomId, status, projectId) =>
        set((state) => ({
          evaluationRooms: state.evaluationRooms.map((r) =>
            r.id === roomId
              ? { ...r, status, currentProjectId: projectId }
              : r
          ),
        })),

      addDocument: (doc) =>
        set((state) => ({ documents: [...state.documents, doc] })),

      signDocument: (docId) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === docId ? { ...d, signed: true } : d
          ),
        })),

      archiveDocument: (docId) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === docId ? { ...d, archived: true } : d
          ),
        })),

      addNotification: (message, type) =>
        set((state) => ({
          notifications: [
            {
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              message,
              type,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ],
          unreadCount: state.unreadCount + 1,
        })),

      markNotificationRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: state.unreadCount - 1,
          };
        }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      weightedRandomExtraction: (projectId, count, professionFilter, regionFilter) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project) return null;

        const alreadyExtractedIds = new Set<string>();
        state.extractionRecords
          .filter((r) => r.projectId === projectId)
          .forEach((r) => {
            r.experts.forEach((e) => {
              alreadyExtractedIds.add(e.expertId);
            });
          });

        let candidates = state.experts.filter((e) => {
          if (e.status === '已回避' || e.status === '迟到') return false;
          if (alreadyExtractedIds.has(e.id)) return false;
          if (project.biddingEnterprises.some((ent) => e.avoidanceUnits.includes(ent.name)))
            return false;
          if (e.avoidanceRegions.includes(project.industry)) return false;
          return true;
        });

        if (professionFilter) {
          candidates = candidates.filter((e) =>
            e.profession.includes(professionFilter)
          );
        }

        if (regionFilter) {
          candidates = candidates.filter((e) => e.region === regionFilter);
        }

        if (candidates.length === 0) return null;

        const selected = weightedRandomSelect(candidates, count);

        const extractedExperts: ExtractedExpert[] = selected.map((expert) => ({
          expertId: expert.id,
          weight: CREDIT_WEIGHT[expert.creditRating],
          isSelected: true,
          response: '待确认' as const,
        }));

        const record: ExtractionRecord = {
          id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          projectId,
          experts: extractedExperts,
          approvalStatus: '待审批',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          extractionRecords: [...state.extractionRecords, record],
          experts: state.experts.map((e) =>
            selected.some((s) => s.id === e.id)
              ? { ...e, status: '已抽取' as const }
              : e
          ),
        }));

        return record;
      },
    }),
    {
      name: 'bid-evaluation-store',
    }
  )
);
