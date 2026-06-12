import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  Expert,
  EvaluationRoom,
  ExtractionRecord,
  BiddingDocument,
  FailedDocument,
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

interface WeightedExtractionResult {
  record: ExtractionRecord;
  selectedExperts: Expert[];
}

interface AppState {
  projects: Project[];
  experts: Expert[];
  evaluationRooms: EvaluationRoom[];
  extractionRecords: ExtractionRecord[];
  documents: BiddingDocument[];
  failedDocuments: FailedDocument[];
  enterprises: Enterprise[];
  notifications: NotificationItem[];
  sidebarCollapsed: boolean;
  unreadCount: number;

  addProject: (project: Project) => void;
  updateProjectStatus: (projectId: string, status: Project['status']) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  addExtractionRecord: (record: ExtractionRecord, selectedExpertIds?: string[]) => void;
  approveExtraction: (recordId: string, approvedBy: string) => void;
  rejectExtraction: (recordId: string) => void;
  expertConfirm: (expertId: string, recordId: string) => void;
  expertAvoid: (expertId: string, recordId: string) => void;
  updateExpertStatus: (expertId: string, status: Expert['status']) => void;
  updateRoomStatus: (roomId: string, status: EvaluationRoom['status'], projectId?: string) => void;
  updateRoomScheduleSlot: (roomId: string, slot: { date: string; startTime: string; endTime: string; projectId: string }) => void;
  addDocument: (doc: BiddingDocument) => void;
  addFailedDocument: (doc: FailedDocument) => void;
  clearFailedDocuments: () => void;
  signDocument: (docId: string) => void;
  archiveDocument: (docId: string) => void;
  addNotification: (message: string, type: NotificationItem['type']) => void;
  markNotificationRead: (id: string) => void;
  toggleSidebar: () => void;
  weightedRandomExtraction: (
    projectId: string,
    count: number,
    professionFilter?: string,
    regionFilter?: string,
    autoAdd?: boolean
  ) => WeightedExtractionResult | null;
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
      failedDocuments: [],
      enterprises: mockEnterprises,
      notifications: [],
      sidebarCollapsed: false,
      unreadCount: 0,

      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),

      updateProjectStatus: (projectId, status) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            projects: state.projects.map((p) => {
              if (p.id !== projectId) return p;

              const updatedTimings = p.stageTimings.map((t) => {
                if (t.stage === p.status && !t.endTime) {
                  const startTime = new Date(t.startTime).getTime();
                  const endTime = new Date(now).getTime();
                  const duration = Math.floor((endTime - startTime) / 1000);
                  return { ...t, endTime: now, duration };
                }
                return t;
              });

              const existingStage = updatedTimings.find((t) => t.stage === status);
              if (!existingStage) {
                updatedTimings.push({
                  stage: status,
                  startTime: now,
                });
              } else if (existingStage.endTime) {
                const idx = updatedTimings.indexOf(existingStage);
                updatedTimings[idx] = {
                  ...existingStage,
                  endTime: undefined,
                  duration: undefined,
                  startTime: now,
                };
              }

              return { ...p, status, stageTimings: updatedTimings };
            }),
          };
        }),

      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p
          ),
        })),

      addExtractionRecord: (record, selectedExpertIds) =>
        set((state) => {
          const newState: Partial<AppState> = {
            extractionRecords: [...state.extractionRecords, record],
          };
          if (selectedExpertIds) {
            newState.experts = state.experts.map((e) =>
              selectedExpertIds.includes(e.id)
                ? { ...e, status: '已抽取' as const }
                : e
            );
          }
          return newState;
        }),

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
          experts: state.experts.map((e) => {
            const relatedRecord = state.extractionRecords.find((r) => r.id === recordId);
            if (relatedRecord?.experts.some((ee) => ee.expertId === e.id)) {
              return { ...e, status: '已抽取' as const };
            }
            return e;
          }),
          notifications: [
            {
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              message: `抽取方案已通过审批，已推送通知至 ${state.extractionRecords.find((r) => r.id === recordId)?.experts.length || 0} 位专家`,
              type: 'success',
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ],
          unreadCount: state.unreadCount + 1,
        })),

      rejectExtraction: (recordId) =>
        set((state) => {
          const record = state.extractionRecords.find((r) => r.id === recordId);
          return {
            extractionRecords: state.extractionRecords.map((r) =>
              r.id === recordId
                ? { ...r, approvalStatus: '已驳回' as const }
                : r
            ),
            experts: state.experts.map((e) => {
              if (record?.experts.some((ee) => ee.expertId === e.id) && e.status === '已抽取') {
                return { ...e, status: '可用' as const };
              }
              return e;
            }),
          };
        }),

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
          const record = state.extractionRecords.find((r) => r.id === recordId);
          const project = state.projects.find((p) => p.id === record?.projectId);

          const state_: Partial<AppState> = {
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

          if (record && project) {
            const result = get().weightedRandomExtraction(record.projectId, 1);
            if (result) {
              state_.extractionRecords = [
                ...(state_.extractionRecords || state.extractionRecords),
                {
                  ...result.record,
                  approvalStatus: '待审批' as const,
                },
              ];
              const supplementaryExpertIds = result.selectedExperts.map((e) => e.id);
              state_.experts = (state_.experts || state.experts).map((e) =>
                supplementaryExpertIds.includes(e.id)
                  ? { ...e, status: '已抽取' as const }
                  : e
              );
              state_.notifications = [
                {
                  id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                  message: `专家回避，已自动补抽1位专家，请审批`,
                  type: 'warning',
                  read: false,
                  createdAt: new Date().toISOString(),
                },
                ...state.notifications,
              ];
              state_.unreadCount = state.unreadCount + 1;
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

      updateRoomScheduleSlot: (roomId, slot) =>
        set((state) => ({
          evaluationRooms: state.evaluationRooms.map((r) =>
            r.id === roomId
              ? { ...r, scheduleSlots: [...r.scheduleSlots, slot] }
              : r
          ),
        })),

      addDocument: (doc) =>
        set((state) => ({ documents: [...state.documents, doc] })),

      addFailedDocument: (doc) =>
        set((state) => ({ failedDocuments: [...state.failedDocuments, doc] })),

      clearFailedDocuments: () =>
        set(() => ({ failedDocuments: [] })),

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

      weightedRandomExtraction: (projectId, count, professionFilter, regionFilter, autoAdd = false) => {
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

        if (autoAdd) {
          set((state) => ({
            extractionRecords: [...state.extractionRecords, record],
            experts: state.experts.map((e) =>
              selected.some((s) => s.id === e.id)
                ? { ...e, status: '已抽取' as const }
                : e
            ),
          }));
        }

        return { record, selectedExperts: selected };
      },
    }),
    {
      name: 'bid-evaluation-store',
    }
  )
);
