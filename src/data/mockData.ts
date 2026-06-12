import type {
  Project,
  Expert,
  EvaluationRoom,
  ExtractionRecord,
  BiddingDocument,
  FailedDocument,
  Enterprise,
} from '../types';

export const mockEnterprises: Enterprise[] = [
  { id: 'ent-001', name: '华为技术有限公司', qualification: '甲级' },
  { id: 'ent-002', name: '中建三局建设工程有限公司', qualification: '特级' },
  { id: 'ent-003', name: '迈瑞医疗国际股份有限公司', qualification: '甲级' },
  { id: 'ent-004', name: '科大讯飞股份有限公司', qualification: '甲级' },
  { id: 'ent-005', name: '中国建筑第五工程局有限公司', qualification: '特级' },
  { id: 'ent-006', name: '碧水源科技股份有限公司', qualification: '甲级' },
  { id: 'ent-007', name: '东软集团股份有限公司', qualification: '乙级' },
  { id: 'ent-008', name: '浪潮软件科技有限公司', qualification: '甲级' },
  { id: 'ent-009', name: '浙江大华技术股份有限公司', qualification: '甲级' },
  { id: 'ent-010', name: '广州博冠信息科技有限公司', qualification: '乙级' },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-001', projectCode: 'ZJCG-2026-001', budgetAmount: 5800000, procurementMethod: '公开招标',
    biddingEnterprises: [mockEnterprises[0], mockEnterprises[1], mockEnterprises[2], mockEnterprises[3]],
    openBidTime: '2026-06-15T09:00:00Z', status: '待开标', industry: '信息技术',
    evaluationRoomId: 'room-001', expertGroupId: 'grp-001', createdAt: '2026-05-20T08:30:00Z',
    stageTimings: [{ stage: '待开标', startTime: '2026-05-20T08:30:00Z' }],
  },
  {
    id: 'proj-002', projectCode: 'ZJCG-2026-002', budgetAmount: 12000000, procurementMethod: '公开招标',
    biddingEnterprises: [mockEnterprises[1], mockEnterprises[4], mockEnterprises[5]],
    openBidTime: '2026-06-10T09:30:00Z', status: '开标中', industry: '建筑工程',
    evaluationRoomId: 'room-004', expertGroupId: 'grp-002', createdAt: '2026-04-15T10:00:00Z',
    stageTimings: [{ stage: '待开标', startTime: '2026-04-15T10:00:00Z', endTime: '2026-06-10T09:30:00Z', duration: 4824600 }, { stage: '开标中', startTime: '2026-06-10T09:30:00Z' }],
  },
  {
    id: 'proj-003', projectCode: 'ZJCG-2026-003', budgetAmount: 3500000, procurementMethod: '竞争性磋商',
    biddingEnterprises: [mockEnterprises[2], mockEnterprises[6], mockEnterprises[7]],
    openBidTime: '2026-06-05T14:00:00Z', status: '评标中', industry: '医疗设备',
    evaluationRoomId: 'room-001', expertGroupId: 'grp-003', createdAt: '2026-04-01T09:00:00Z',
    stageTimings: [{ stage: '待开标', startTime: '2026-04-01T09:00:00Z', endTime: '2026-06-05T14:00:00Z', duration: 5637000 }, { stage: '开标中', startTime: '2026-06-05T14:00:00Z', endTime: '2026-06-05T17:00:00Z', duration: 10800 }, { stage: '评标中', startTime: '2026-06-06T09:00:00Z' }],
  },
  {
    id: 'proj-004', projectCode: 'ZJCG-2026-004', budgetAmount: 8900000, procurementMethod: '邀请招标',
    biddingEnterprises: [mockEnterprises[3], mockEnterprises[8]],
    openBidTime: '2026-06-12T10:00:00Z', status: '开标中', industry: '教育装备',
    evaluationRoomId: 'room-004', expertGroupId: 'grp-004', createdAt: '2026-04-20T11:00:00Z',
    stageTimings: [{ stage: '待开标', startTime: '2026-04-20T11:00:00Z', endTime: '2026-06-12T10:00:00Z', duration: 4576200 }, { stage: '开标中', startTime: '2026-06-12T10:00:00Z' }],
  },
  {
    id: 'proj-005', projectCode: 'ZJCG-2026-005', budgetAmount: 2200000, procurementMethod: '竞争性谈判',
    biddingEnterprises: [mockEnterprises[0], mockEnterprises[5], mockEnterprises[9]],
    openBidTime: '2026-05-28T09:00:00Z', status: '结果公示', industry: '环保工程',
    evaluationRoomId: 'room-005', expertGroupId: 'grp-005', createdAt: '2026-03-10T14:00:00Z',
    stageTimings: [{ stage: '待开标', startTime: '2026-03-10T14:00:00Z', endTime: '2026-05-28T09:00:00Z', duration: 6832200 }, { stage: '开标中', startTime: '2026-05-28T09:00:00Z', endTime: '2026-05-28T12:00:00Z', duration: 10800 }, { stage: '评标中', startTime: '2026-05-29T09:00:00Z', endTime: '2026-05-30T17:00:00Z', duration: 115200 }, { stage: '结果公示', startTime: '2026-05-31T09:00:00Z' }],
  },
  {
    id: 'proj-006', projectCode: 'ZJCG-2026-006', budgetAmount: 7600000, procurementMethod: '单一来源',
    biddingEnterprises: [mockEnterprises[7]],
    openBidTime: '2026-06-18T09:00:00Z', status: '待开标', industry: '软件服务',
    evaluationRoomId: 'room-001', expertGroupId: 'grp-006', createdAt: '2026-05-25T10:30:00Z',
    stageTimings: [{ stage: '待开标', startTime: '2026-05-25T10:30:00Z' }],
  },
  {
    id: 'proj-007', projectCode: 'ZJCG-2026-007', budgetAmount: 1500000, procurementMethod: '询价',
    biddingEnterprises: [mockEnterprises[1], mockEnterprises[4], mockEnterprises[8]],
    openBidTime: '2026-06-20T14:30:00Z', status: '待开标', industry: '办公设备',
    evaluationRoomId: 'room-006', expertGroupId: 'grp-007', createdAt: '2026-06-01T08:00:00Z',
    stageTimings: [{ stage: '待开标', startTime: '2026-06-01T08:00:00Z' }],
  },
  {
    id: 'proj-008', projectCode: 'ZJCG-2026-008', budgetAmount: 15600000, procurementMethod: '公开招标',
    biddingEnterprises: [mockEnterprises[2], mockEnterprises[6], mockEnterprises[9], mockEnterprises[0], mockEnterprises[5]],
    openBidTime: '2026-06-08T09:00:00Z', status: '评标中', industry: '市政工程',
    evaluationRoomId: 'room-002', expertGroupId: 'grp-008', createdAt: '2026-03-01T09:00:00Z',
    stageTimings: [{ stage: '待开标', startTime: '2026-03-01T09:00:00Z', endTime: '2026-06-08T09:00:00Z', duration: 8550000 }, { stage: '开标中', startTime: '2026-06-08T09:00:00Z', endTime: '2026-06-08T17:00:00Z', duration: 28800 }, { stage: '评标中', startTime: '2026-06-09T09:00:00Z' }],
  },
];

export const mockExperts: Expert[] = [
  { id: 'exp-001', name: '王建国', phone: '13800138001', profession: ['计算机', '信息安全'], region: '北京市', unit: '清华大学计算机系', creditRating: 'A+', avoidanceUnits: ['华为技术有限公司'], avoidanceRegions: [], status: '可用' },
  { id: 'exp-002', name: '李明辉', phone: '13800138002', profession: ['建筑', '结构工程'], region: '上海市', unit: '同济大学建筑学院', creditRating: 'A+', avoidanceUnits: [], avoidanceRegions: ['广州市'], status: '已抽取' },
  { id: 'exp-003', name: '张秀英', phone: '13800138003', profession: ['医疗', '医疗器械'], region: '广东省', unit: '中山大学附属第一医院', creditRating: 'A', avoidanceUnits: ['迈瑞医疗国际股份有限公司'], avoidanceRegions: [], status: '可用' },
  { id: 'exp-004', name: '陈志远', phone: '13800138004', profession: ['工程咨询', '造价'], region: '浙江省', unit: '浙江省工程咨询中心', creditRating: 'A', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-005', name: '刘晓燕', phone: '13800138005', profession: ['教育', '教育技术'], region: '江苏省', unit: '南京大学教育学院', creditRating: 'A+', avoidanceUnits: ['科大讯飞股份有限公司'], avoidanceRegions: [], status: '可用' },
  { id: 'exp-006', name: '赵德华', phone: '13800138006', profession: ['计算机', '软件工程'], region: '四川省', unit: '电子科技大学', creditRating: 'B+', avoidanceUnits: [], avoidanceRegions: ['深圳市'], status: '可用' },
  { id: 'exp-007', name: '孙丽萍', phone: '13800138007', profession: ['环保', '环境工程'], region: '湖北省', unit: '武汉大学环境学院', creditRating: 'A', avoidanceUnits: ['碧水源科技股份有限公司'], avoidanceRegions: [], status: '可用' },
  { id: 'exp-008', name: '周伟强', phone: '13800138008', profession: ['建筑', '市政工程'], region: '北京市', unit: '北京市市政设计研究院', creditRating: 'A+', avoidanceUnits: [], avoidanceRegions: [], status: '已抽取' },
  { id: 'exp-009', name: '吴晓峰', phone: '13800138009', profession: ['计算机', '网络工程'], region: '广东省', unit: '华南理工大学', creditRating: 'B+', avoidanceUnits: ['东软集团股份有限公司'], avoidanceRegions: [], status: '可用' },
  { id: 'exp-010', name: '郑海涛', phone: '13800138010', profession: ['医疗', '临床医学'], region: '上海市', unit: '上海交通大学医学院', creditRating: 'A', avoidanceUnits: [], avoidanceRegions: ['武汉市'], status: '可用' },
  { id: 'exp-011', name: '黄美玲', phone: '13800138011', profession: ['教育', '职业教育'], region: '山东省', unit: '山东师范大学', creditRating: 'B+', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-012', name: '林大鹏', phone: '13800138012', profession: ['工程咨询', '项目管理'], region: '福建省', unit: '福建省工程咨询公司', creditRating: 'A', avoidanceUnits: ['中建三局建设工程有限公司'], avoidanceRegions: [], status: '可用' },
  { id: 'exp-013', name: '何志刚', phone: '13800138013', profession: ['环保', '水处理'], region: '湖南省', unit: '中南大学环境学院', creditRating: 'B+', avoidanceUnits: [], avoidanceRegions: ['长沙市'], status: '可用' },
  { id: 'exp-014', name: '马春华', phone: '13800138014', profession: ['计算机', '人工智能'], region: '安徽省', unit: '中国科学技术大学', creditRating: 'A+', avoidanceUnits: ['广州博冠信息科技有限公司'], avoidanceRegions: [], status: '可用' },
  { id: 'exp-015', name: '罗文斌', phone: '13800138015', profession: ['建筑', '暖通空调'], region: '重庆市', unit: '重庆大学建筑城规学院', creditRating: 'A', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-016', name: '谢婷婷', phone: '13800138016', profession: ['医疗', '影像医学'], region: '天津市', unit: '天津医科大学总医院', creditRating: 'B', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-017', name: '韩正阳', phone: '13800138017', profession: ['工程咨询', '监理'], region: '河南省', unit: '河南省建设监理协会', creditRating: 'B+', avoidanceUnits: [], avoidanceRegions: ['郑州市'], status: '已抽取' },
  { id: 'exp-018', name: '唐晓红', phone: '13800138018', profession: ['教育', '基础教育'], region: '陕西省', unit: '陕西师范大学', creditRating: 'A', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-019', name: '冯国庆', phone: '13800138019', profession: ['计算机', '数据库'], region: '辽宁省', unit: '东北大学软件学院', creditRating: 'B', avoidanceUnits: ['东软集团股份有限公司'], avoidanceRegions: [], status: '可用' },
  { id: 'exp-020', name: '曹雪梅', phone: '13800138020', profession: ['环保', '大气治理'], region: '河北省', unit: '河北科技大学环境学院', creditRating: 'B+', avoidanceUnits: [], avoidanceRegions: ['石家庄市'], status: '可用' },
  { id: 'exp-021', name: '许志明', phone: '13800138021', profession: ['建筑', '电气工程'], region: '江苏省', unit: '东南大学电气工程学院', creditRating: 'A', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-022', name: '邓丽华', phone: '13800138022', profession: ['医疗', '护理管理'], region: '江西省', unit: '南昌大学第一附属医院', creditRating: 'B', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-023', name: '傅光明', phone: '13800138023', profession: ['工程咨询', '招标代理'], region: '浙江省', unit: '浙江省招标咨询有限公司', creditRating: 'A+', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-024', name: '蒋慧敏', phone: '13800138024', profession: ['计算机', '网络安全'], region: '四川省', unit: '四川大学网络空间安全学院', creditRating: 'A', avoidanceUnits: [], avoidanceRegions: ['成都市'], status: '可用' },
  { id: 'exp-025', name: '沈国强', phone: '13800138025', profession: ['建筑', '给排水'], region: '广东省', unit: '广州市设计院', creditRating: 'B+', avoidanceUnits: ['广州博冠信息科技有限公司'], avoidanceRegions: [], status: '可用' },
  { id: 'exp-026', name: '彭丽娟', phone: '13800138026', profession: ['教育', '教育信息化'], region: '湖南省', unit: '湖南大学教育学院', creditRating: 'B', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-027', name: '潘永刚', phone: '13800138027', profession: ['环保', '固废处理'], region: '云南省', unit: '昆明理工大学环境学院', creditRating: 'C', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-028', name: '田晓丽', phone: '13800138028', profession: ['医疗', '检验医学'], region: '吉林省', unit: '吉林大学第一医院', creditRating: 'B+', avoidanceUnits: [], avoidanceRegions: [], status: '可用' },
  { id: 'exp-029', name: '余建平', phone: '13800138029', profession: ['工程咨询', '工程设计'], region: '湖北省', unit: '中南建筑设计院', creditRating: 'A', avoidanceUnits: [], avoidanceRegions: ['武汉市'], status: '可用' },
  { id: 'exp-030', name: '苏晓燕', phone: '13800138030', profession: ['计算机', '云计算'], region: '贵州省', unit: '贵州大学计算机学院', creditRating: 'B+', avoidanceUnits: ['浪潮软件科技有限公司'], avoidanceRegions: [], status: '可用' },
];

export const mockEvaluationRooms: EvaluationRoom[] = [
  {
    id: 'room-001', name: '评标室1', floor: 1, capacity: 8, status: '占用', currentProjectId: 'proj-003',
    scheduleSlots: [
      { date: '2026-06-13', startTime: '09:00', endTime: '12:00', projectId: 'proj-003' },
      { date: '2026-06-13', startTime: '14:00', endTime: '17:00', projectId: 'proj-003' },
      { date: '2026-06-14', startTime: '09:00', endTime: '12:00', projectId: 'proj-003' },
    ],
  },
  {
    id: 'room-002', name: '评标室2', floor: 1, capacity: 10, status: '占用', currentProjectId: 'proj-008',
    scheduleSlots: [
      { date: '2026-06-13', startTime: '09:00', endTime: '17:00', projectId: 'proj-008' },
      { date: '2026-06-14', startTime: '09:00', endTime: '17:00', projectId: 'proj-008' },
    ],
  },
  {
    id: 'room-003', name: '评标室3', floor: 1, capacity: 6, status: '空闲',
    scheduleSlots: [],
  },
  {
    id: 'room-004', name: '评标室4', floor: 2, capacity: 12, status: '占用', currentProjectId: 'proj-002',
    scheduleSlots: [
      { date: '2026-06-13', startTime: '09:00', endTime: '12:00', projectId: 'proj-002' },
      { date: '2026-06-13', startTime: '14:00', endTime: '17:00', projectId: 'proj-004' },
    ],
  },
  {
    id: 'room-005', name: '评标室5', floor: 2, capacity: 8, status: '维护',
    scheduleSlots: [],
  },
  {
    id: 'room-006', name: '评标室6', floor: 2, capacity: 6, status: '空闲',
    scheduleSlots: [
      { date: '2026-06-20', startTime: '14:30', endTime: '17:00', projectId: 'proj-007' },
    ],
  },
];

export const mockExtractionRecords: ExtractionRecord[] = [
  {
    id: 'ext-001', projectId: 'proj-001',
    experts: [
      { expertId: 'exp-001', weight: 10, isSelected: true, response: '已确认' },
      { expertId: 'exp-006', weight: 6, isSelected: true, response: '已确认' },
      { expertId: 'exp-014', weight: 10, isSelected: true, response: '已确认' },
      { expertId: 'exp-019', weight: 4, isSelected: true, response: '已确认' },
      { expertId: 'exp-024', weight: 8, isSelected: true, response: '已确认' },
    ],
    approvalStatus: '待审批', createdAt: '2026-06-12T10:00:00Z',
  },
  {
    id: 'ext-002', projectId: 'proj-003',
    experts: [
      { expertId: 'exp-003', weight: 8, isSelected: true, response: '已确认' },
      { expertId: 'exp-010', weight: 8, isSelected: true, response: '已确认' },
      { expertId: 'exp-016', weight: 4, isSelected: true, response: '已确认' },
      { expertId: 'exp-028', weight: 6, isSelected: true, response: '已确认' },
    ],
    approvalStatus: '已通过', approvedBy: '张处长', approvedAt: '2026-06-04T14:30:00Z', createdAt: '2026-06-04T09:00:00Z',
  },
  {
    id: 'ext-003', projectId: 'proj-008',
    experts: [
      { expertId: 'exp-002', weight: 10, isSelected: true, response: '已确认' },
      { expertId: 'exp-008', weight: 10, isSelected: true, response: '已确认' },
      { expertId: 'exp-015', weight: 8, isSelected: true, response: '已确认' },
      { expertId: 'exp-021', weight: 8, isSelected: true, response: '已确认' },
      { expertId: 'exp-025', weight: 6, isSelected: true, response: '已确认' },
      { expertId: 'exp-029', weight: 8, isSelected: true, response: '已确认' },
      { expertId: 'exp-017', weight: 6, isSelected: true, response: '已确认' },
    ],
    approvalStatus: '已通过', approvedBy: '李主任', approvedAt: '2026-06-07T16:00:00Z', createdAt: '2026-06-07T10:00:00Z',
  },
  {
    id: 'ext-004', projectId: 'proj-005',
    experts: [
      { expertId: 'exp-007', weight: 8, isSelected: true, response: '已确认' },
      { expertId: 'exp-013', weight: 6, isSelected: true, response: '已确认' },
      { expertId: 'exp-020', weight: 6, isSelected: true, response: '已确认' },
      { expertId: 'exp-027', weight: 2, isSelected: true, response: '已回避' },
    ],
    approvalStatus: '已驳回', approvedBy: '王副局长', approvedAt: '2026-05-26T11:00:00Z', createdAt: '2026-05-25T15:00:00Z',
  },
  {
    id: 'ext-005', projectId: 'proj-006',
    experts: [
      { expertId: 'exp-001', weight: 10, isSelected: true, response: '已确认' },
      { expertId: 'exp-014', weight: 10, isSelected: true, response: '已确认' },
      { expertId: 'exp-006', weight: 6, isSelected: true, response: '待确认' },
      { expertId: 'exp-030', weight: 6, isSelected: true, response: '待确认' },
    ],
    approvalStatus: '待审批', createdAt: '2026-06-13T08:00:00Z',
  },
];

export const mockDocuments: BiddingDocument[] = [
  { id: 'doc-001', projectId: 'proj-001', fileName: '政务云平台投标文件-华为.pdf', fileType: 'pdf', fileSize: 5242880, uploadTime: '2026-06-10T14:30:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: true },
  { id: 'doc-002', projectId: 'proj-001', fileName: '政务云平台投标文件-中建三局.pdf', fileType: 'pdf', fileSize: 8388608, uploadTime: '2026-06-10T16:00:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: true },
  { id: 'doc-004', projectId: 'proj-002', fileName: '综合楼建设项目投标文件-中建五局.pdf', fileType: 'pdf', fileSize: 6291456, uploadTime: '2026-06-09T10:00:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: true },
  { id: 'doc-006', projectId: 'proj-003', fileName: '医疗设备采购投标文件-东软集团.pdf', fileType: 'pdf', fileSize: 4194304, uploadTime: '2026-06-04T14:00:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: true },
  { id: 'doc-007', projectId: 'proj-004', fileName: '智慧校园设备投标文件-科大讯飞.docx', fileType: 'docx', fileSize: 4194304, uploadTime: '2026-06-11T09:30:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: true },
  { id: 'doc-008', projectId: 'proj-004', fileName: '智慧校园设备投标文件-大华技术.pdf', fileType: 'pdf', fileSize: 3145728, uploadTime: '2026-06-11T11:00:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: false },
  { id: 'doc-009', projectId: 'proj-005', fileName: '环境监测站投标文件-华为.pdf', fileType: 'pdf', fileSize: 2097152, uploadTime: '2026-05-27T09:00:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: true },
  { id: 'doc-010', projectId: 'proj-005', fileName: '评标报告-环保项目.pdf', fileType: 'pdf', fileSize: 524288, uploadTime: '2026-05-30T15:00:00Z', signatureValid: true, encryptionValid: true, type: '评标报告', signed: true, archived: true },
  { id: 'doc-011', projectId: 'proj-005', fileName: '中标通知书-碧水源.pdf', fileType: 'pdf', fileSize: 204800, uploadTime: '2026-06-05T10:00:00Z', signatureValid: true, encryptionValid: true, type: '其他', signed: true, archived: false },
  { id: 'doc-012', projectId: 'proj-006', fileName: '政务系统运维投标文件-浪潮软件.pdf', fileType: 'pdf', fileSize: 786432, uploadTime: '2026-06-12T10:00:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: true },
  { id: 'doc-013', projectId: 'proj-008', fileName: '市政道路改造投标文件-中建三局.pdf', fileType: 'pdf', fileSize: 7340032, uploadTime: '2026-06-07T13:00:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: true },
  { id: 'doc-014', projectId: 'proj-008', fileName: '市政道路改造投标文件-迈瑞医疗.pdf', fileType: 'pdf', fileSize: 5242880, uploadTime: '2026-06-07T15:00:00Z', signatureValid: true, encryptionValid: true, type: '投标文件', signed: true },
];

export const mockFailedDocuments: FailedDocument[] = [
  { id: 'fail-001', projectId: 'proj-002', fileName: '综合楼建设项目投标文件-中建三局.pdf', fileType: 'pdf', fileSize: 8388608, uploadTime: '2026-06-08T16:00:00Z', type: '投标文件', failedStep: 'encryption', failedReason: '文件加密完整性验证不通过，文件可能已被篡改' },
  { id: 'fail-002', projectId: 'proj-003', fileName: '医疗设备采购投标文件-迈瑞医疗.pdf', fileType: 'pdf', fileSize: 6291456, uploadTime: '2026-06-04T11:00:00Z', type: '投标文件', failedStep: 'signature', failedReason: '文件数字签名无效或已损坏，请确认文件来源合法' },
  { id: 'fail-003', projectId: 'proj-007', fileName: '办公设备询价文件.xlsx', fileType: 'xlsx', fileSize: 358400, uploadTime: '2026-06-01T08:00:00Z', type: '投标文件', failedStep: 'signature', failedReason: '文件数字签名无效且加密校验失败，文件不可信' },
];
