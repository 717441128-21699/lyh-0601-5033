import { useState, useEffect } from 'react'
import {
  Upload,
  FileCheck,
  Shield,
  PenTool,
  Archive,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Stamp,
  FolderCheck,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import type { BiddingDocument } from '@/types'

function formatFileSize(bytes: number): string {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(0) + ' KB'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type ValidationStep = 'idle' | 'format' | 'signature' | 'encryption' | 'success' | 'failed'

interface ValidationState {
  step: ValidationStep
  stepText: string
  errorMessage?: string
  failedStep?: string
  progress: number
}

const ALLOWED_FORMATS = ['pdf', 'doc', 'docx', 'xls', 'xlsx']
const FORMAT_NAMES: Record<string, string> = {
  pdf: 'PDF',
  doc: 'Word 97-2003',
  docx: 'Word',
  xls: 'Excel 97-2003',
  xlsx: 'Excel',
}

export default function Documents() {
  const { documents, projects, addDocument, signDocument, archiveDocument, addNotification } = useStore()
  const [activeTab, setActiveTab] = useState<'投标文件' | '评标报告'>('投标文件')
  const [signingDocId, setSigningDocId] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [signAnimDocId, setSignAnimDocId] = useState<string | null>(null)
  const [validationState, setValidationState] = useState<ValidationState>({
    step: 'idle',
    stepText: '',
    progress: 0,
  })
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadingFileInfo, setUploadingFileInfo] = useState<{
    name: string
    type: string
    size: number
    projectId: string
  } | null>(null)
  const [selectedProjectForUpload, setSelectedProjectForUpload] = useState<string>('')

  const biddingDocs = documents.filter((d: BiddingDocument) => d.type === '投标文件')
  const reportDocs = documents.filter((d: BiddingDocument) => d.type === '评标报告')

  const getProjectCode = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.projectCode ?? '-'
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.industry ?? '-'
  }

  const runValidation = async (fileName: string, fileType: string): Promise<{ signatureValid: boolean; encryptionValid: boolean } | null> => {
    const ext = fileName.split('.').pop()?.toLowerCase()

    setValidationState({ step: 'format', stepText: '正在校验文件格式...', progress: 25 })
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (!ext || !ALLOWED_FORMATS.includes(ext)) {
      const validFormats = ALLOWED_FORMATS.map((f) => `.${f.toUpperCase()}`).join('、')
      setValidationState({
        step: 'failed',
        stepText: '格式校验失败',
        errorMessage: `不支持的文件格式 "${ext?.toUpperCase() || '未知'}"，请上传 ${validFormats} 格式文件`,
        failedStep: 'format',
        progress: 25,
      })
      return null
    }

    setValidationState({ step: 'signature', stepText: '正在验证数字签名...', progress: 55 })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const signatureValid = Math.random() > 0.25
    if (!signatureValid) {
      setValidationState({
        step: 'failed',
        stepText: '签名校验失败',
        errorMessage: '文件数字签名无效或已损坏，请确认文件来源合法',
        failedStep: 'signature',
        progress: 55,
      })
      return null
    }

    setValidationState({ step: 'encryption', stepText: '正在验证加密完整性...', progress: 85 })
    await new Promise((resolve) => setTimeout(resolve, 800))

    const encryptionValid = Math.random() > 0.2
    if (!encryptionValid) {
      setValidationState({
        step: 'failed',
        stepText: '加密校验失败',
        errorMessage: '文件加密完整性验证不通过，文件可能已被篡改',
        failedStep: 'encryption',
        progress: 85,
      })
      return null
    }

    setValidationState({ step: 'success', stepText: '校验通过，文件已入库', progress: 100 })
    await new Promise((resolve) => setTimeout(resolve, 500))

    return { signatureValid, encryptionValid }
  }

  const handleUpload = () => {
    if (projects.length === 0) {
      addNotification('暂无项目可关联文件', 'warning')
      return
    }
    setSelectedProjectForUpload(projects[0].id)
    setShowUploadDialog(true)
  }

  const startUpload = () => {
    if (!selectedProjectForUpload) {
      addNotification('请选择关联项目', 'warning')
      return
    }

    const fileTypes = ['pdf', 'docx', 'xlsx']
    const randomFileType = fileTypes[Math.floor(Math.random() * fileTypes.length)]
    const randomSize = Math.floor(Math.random() * 5000000) + 200000
    const project = projects.find((p) => p.id === selectedProjectForUpload)
    const projectCode = project?.projectCode?.replace(/[^\w]/g, '') || 'PROJECT'

    const fileName = `${projectCode}-投标文件-${Date.now().toString().slice(-6)}.${randomFileType}`

    setUploadingFileInfo({
      name: fileName,
      type: randomFileType,
      size: randomSize,
      projectId: selectedProjectForUpload,
    })
    setShowUploadDialog(false)
    setValidationState({ step: 'idle', stepText: '准备上传...', progress: 0 })

    runValidation(fileName, randomFileType).then((result) => {
      if (result && uploadingFileInfo) {
        const newDoc: BiddingDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          projectId: uploadingFileInfo.projectId,
          fileName,
          fileType: randomFileType,
          fileSize: randomSize,
          uploadTime: new Date().toISOString(),
          signatureValid: result.signatureValid,
          encryptionValid: result.encryptionValid,
          type: activeTab,
          signed: false,
          archived: false,
        }
        addDocument(newDoc)
        addNotification(`文件 "${fileName}" 上传成功并已归档`, 'success')
      } else {
        addNotification(validationState.errorMessage || '文件校验失败', 'danger')
      }
    })
  }

  const resetUpload = () => {
    setValidationState({ step: 'idle', stepText: '', progress: 0 })
    setUploadingFileInfo(null)
  }

  const handleDelete = (doc: BiddingDocument) => {
    addNotification(`文件 "${doc.fileName}" 已删除`, 'warning')
  }

  const handleSignConfirm = () => {
    if (!signingDocId) return
    setIsSigning(true)
    setTimeout(() => {
      signDocument(signingDocId)
      setSignAnimDocId(signingDocId)
      addNotification('文档签章成功', 'success')
      setSigningDocId(null)
      setIsSigning(false)
      setTimeout(() => setSignAnimDocId(null), 1500)
    }, 800)
  }

  const handleArchive = (doc: BiddingDocument) => {
    if (window.confirm(`确认归档文件 "${doc.fileName}"？`)) {
      archiveDocument(doc.id)
      addNotification(`文件 "${doc.fileName}" 已归档`, 'success')
    }
  }

  const validationSteps = [
    { key: 'format', label: '格式校验', icon: FileText },
    { key: 'signature', label: '签名校验', icon: Shield },
    { key: 'encryption', label: '加密校验', icon: FileCheck },
    { key: 'success', label: '入库完成', icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">文档管理</h1>
        <div className="mt-4 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
          {(['投标文件', '评标报告'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === '投标文件' && (
        <div className="space-y-6">
          {validationState.step !== 'idle' && uploadingFileInfo && (
            <div className="bg-white rounded-xl shadow-sm p-6 animate-slide-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold font-serif text-gray-800">文件上传校验</h2>
                <button
                  onClick={resetUpload}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 flex items-center justify-center bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{uploadingFileInfo.name}</p>
                  <p className="text-sm text-gray-500">
                    {FORMAT_NAMES[uploadingFileInfo.type] || uploadingFileInfo.type} · {formatFileSize(uploadingFileInfo.size)} · {getProjectCode(uploadingFileInfo.projectId)}
                  </p>
                </div>
              </div>

              <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500 rounded-full',
                    validationState.step === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${validationState.progress}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {validationSteps.map((step, idx) => {
                  const isActive = validationState.step === step.key
                  const isCompleted = (validationState.step !== 'failed' && idx < validationSteps.findIndex((s) => s.key === validationState.step)) ||
                    (validationState.step === 'success') ||
                    (validationState.step === 'encryption' && idx < 3) ||
                    (validationState.step === 'signature' && idx < 2) ||
                    (validationState.step === 'format' && idx < 1)
                  const isFailed = validationState.failedStep === step.key

                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all',
                          isActive && !isFailed && 'ring-2 ring-blue-400 ring-offset-2',
                          isCompleted && !isFailed && 'bg-green-100 text-green-600',
                          isActive && !isFailed && !isCompleted && 'bg-blue-100 text-blue-600',
                          isFailed && 'bg-red-100 text-red-600',
                          !isActive && !isCompleted && !isFailed && 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {isActive && !isCompleted && !isFailed ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isCompleted && !isFailed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isFailed ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs text-center',
                          isCompleted && !isFailed && 'text-green-600 font-medium',
                          isActive && !isFailed && 'text-blue-600 font-medium',
                          isFailed && 'text-red-600 font-medium',
                          !isActive && !isCompleted && !isFailed && 'text-gray-400'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {validationState.step === 'failed' && validationState.errorMessage && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700">{validationState.stepText}</p>
                    <p className="text-sm text-red-600 mt-1">{validationState.errorMessage}</p>
                  </div>
                </div>
              )}

              {(validationState.step === 'success' || validationState.step === 'failed') && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={resetUpload}
                    className="px-5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm"
                  >
                    {validationState.step === 'success' ? '继续上传' : '重新上传'}
                  </button>
                </div>
              )}
            </div>
          )}

          {validationState.step === 'idle' && (
            <div
              onClick={handleUpload}
              className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/30"
            >
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-600">拖拽文件至此处或点击上传</p>
              <p className="mt-1 text-xs text-gray-400">支持 .pdf .doc .docx .xls .xlsx 格式，需加密签名</p>
            </div>
          )}

          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">文件名</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">所属项目</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">文件类型</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">文件大小</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">上传时间</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">签名验证</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">加密验证</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {biddingDocs.map((doc: BiddingDocument) => (
                    <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 truncate max-w-[200px]">{doc.fileName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{getProjectCode(doc.projectId)}</td>
                      <td className="px-4 py-3 text-gray-600">{doc.fileType.toUpperCase()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(doc.uploadTime)}</td>
                      <td className="px-4 py-3 text-center">
                        {doc.signatureValid ? (
                          <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="mx-auto h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc.encryptionValid ? (
                          <Shield className="mx-auto h-5 w-5 text-green-500" />
                        ) : (
                          <Shield className="mx-auto h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-primary-50 hover:text-primary-500 transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {biddingDocs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400">暂无投标文件</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === '评标报告' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportDocs.map((doc: BiddingDocument) => (
            <div
              key={doc.id}
              className={cn(
                'relative rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md',
                signAnimDocId === doc.id && 'ring-2 ring-amber-400'
              )}
            >
              {signAnimDocId === doc.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-amber-50/60 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Stamp className="h-10 w-10 text-amber-500 animate-bounce" />
                    <span className="text-sm font-medium text-amber-600">签章中...</span>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <FileCheck className="h-5 w-5 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{doc.fileName}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{getProjectCode(doc.projectId)} - {getProjectName(doc.projectId)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  {doc.signed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      <Stamp className="h-3.5 w-3.5" />
                      已签章
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                      <PenTool className="h-3.5 w-3.5" />
                      未签章
                    </span>
                  )}
                  {doc.archived ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      <FolderCheck className="h-3.5 w-3.5" />
                      已归档
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                      <Archive className="h-3.5 w-3.5" />
                      未归档
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {!doc.signed && (
                  <button
                    onClick={() => setSigningDocId(doc.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    在线签字
                  </button>
                )}
                {!doc.archived && (
                  <button
                    onClick={() => handleArchive(doc)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    归档
                  </button>
                )}
              </div>
            </div>
          ))}
          {reportDocs.length === 0 && (
            <div className="col-span-full rounded-xl bg-white py-16 text-center text-gray-400 shadow-sm">
              暂无评标报告
            </div>
          )}
        </div>
      )}

      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowUploadDialog(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 font-serif">上传投标文件</h2>
              <button onClick={() => setShowUploadDialog(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">选择文件</label>
                <div
                  onClick={() => {}}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary-300 transition-colors"
                >
                  <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">点击选择文件或拖拽至此</p>
                  <p className="text-xs text-gray-400 mt-0.5">支持 PDF、DOC、DOCX、XLS、XLSX</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">关联项目</label>
                <select
                  value={selectedProjectForUpload}
                  onChange={(e) => setSelectedProjectForUpload(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.projectCode} - {p.industry}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowUploadDialog(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={startUpload}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium transition-colors"
              >
                开始上传校验
              </button>
            </div>
          </div>
        </div>
      )}

      {signingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !isSigning && setSigningDocId(null)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 font-serif">在线签字</h2>
              <button
                onClick={() => !isSigning && setSigningDocId(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex h-48 items-center justify-center rounded-xl bg-gray-100">
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 text-gray-300" />
                <span className="text-sm text-gray-400">文档预览</span>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              文件：{documents.find((d: BiddingDocument) => d.id === signingDocId)?.fileName}
            </p>

            <button
              onClick={handleSignConfirm}
              disabled={isSigning}
              className={cn(
                'mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors',
                isSigning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 hover:bg-primary-600'
              )}
            >
              {isSigning ? '签字中...' : '签字确认'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
