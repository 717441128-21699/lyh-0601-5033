import { useState } from 'react'
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

export default function Documents() {
  const { documents, projects, addDocument, signDocument, archiveDocument, addNotification } = useStore()
  const [activeTab, setActiveTab] = useState<'投标文件' | '评标报告'>('投标文件')
  const [signingDocId, setSigningDocId] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [signAnimDocId, setSignAnimDocId] = useState<string | null>(null)

  const biddingDocs = documents.filter((d: BiddingDocument) => d.type === '投标文件')
  const reportDocs = documents.filter((d: BiddingDocument) => d.type === '评标报告')

  const getProjectCode = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.projectCode ?? '-'
  }

  const handleUpload = () => {
    const projectIds = projects.map((p) => p.id)
    const randomProjectId = projectIds[Math.floor(Math.random() * projectIds.length)]
    const fileTypes = ['pdf', 'docx', 'xlsx']
    const randomFileType = fileTypes[Math.floor(Math.random() * fileTypes.length)]
    const randomSize = Math.floor(Math.random() * 8000000) + 200000

    const newDoc: BiddingDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      projectId: randomProjectId,
      fileName: `上传文件-${Date.now().toString(36)}.${randomFileType}`,
      fileType: randomFileType,
      fileSize: randomSize,
      uploadTime: new Date().toISOString(),
      signatureValid: Math.random() > 0.3,
      encryptionValid: Math.random() > 0.3,
      type: activeTab,
      signed: false,
      archived: false,
    }
    addDocument(newDoc)
    addNotification(`文件 "${newDoc.fileName}" 上传成功`, 'success')
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
          <div
            onClick={handleUpload}
            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/30"
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-600">拖拽文件至此处或点击上传</p>
            <p className="mt-1 text-xs text-gray-400">支持 .pdf .doc .docx .xls .xlsx 格式，需加密签名</p>
          </div>

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
                  <p className="mt-0.5 text-xs text-gray-500">{getProjectCode(doc.projectId)}</p>
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
