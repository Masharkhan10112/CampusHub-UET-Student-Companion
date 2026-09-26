import { Download, FileText, FolderOpen, Search, Trash2, Upload } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatFileSize } from '@/lib/format'
import { listCourses } from '@/services/courses'
import {
  deleteMaterial,
  getMaterialDownloadUrl,
  listMaterials,
  uploadMaterial,
} from '@/services/materials'
import type { MaterialWithCourse } from '@/types/models'

const MAX_BYTES = 50 * 1024 * 1024

async function loadMaterials() {
  const [materials, courses] = await Promise.all([listMaterials(), listCourses()])
  return { materials, courses }
}

export function MaterialsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(loadMaterials)

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ title: '', description: '', courseId: '' })
  const [fileError, setFileError] = useState<string | undefined>()
  const [pendingDelete, setPendingDelete] = useState<MaterialWithCourse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const materials = useMemo(() => data?.materials ?? [], [data])
  const courses = useMemo(() => data?.courses ?? [], [data])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return materials.filter((material) => {
      const matchesTerm =
        term.length === 0 ||
        material.title.toLowerCase().includes(term) ||
        material.file_name.toLowerCase().includes(term) ||
        (material.description ?? '').toLowerCase().includes(term)
      const matchesCourse =
        courseFilter === 'all' ||
        (courseFilter === 'none'
          ? material.course_id === null
          : material.course_id === courseFilter)
      return matchesTerm && matchesCourse
    })
  }, [materials, search, courseFilter])

  async function handleUpload(event: FormEvent) {
    event.preventDefault()
    if (!user) return

    if (!file) {
      setFileError('Choose a file to upload.')
      return
    }
    if (file.size > MAX_BYTES) {
      setFileError('Files must be 50 MB or smaller.')
      return
    }
    setFileError(undefined)

    setUploading(true)
    try {
      await uploadMaterial(
        {
          file,
          title: form.title.trim() || file.name,
          description: form.description.trim() || null,
          courseId: form.courseId || null,
        },
        user.id,
      )
      toast.success('Material uploaded')
      setUploadOpen(false)
      setFile(null)
      setForm({ title: '', description: '', courseId: '' })
      await reload()
    } catch (caught) {
      toast.error('Upload failed', getErrorMessage(caught))
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(material: MaterialWithCourse) {
    setDownloadingId(material.id)
    try {
      const url = await getMaterialDownloadUrl(material.file_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (caught) {
      toast.error('Could not prepare the download', getErrorMessage(caught))
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteMaterial(pendingDelete.id, pendingDelete.file_path)
      toast.success('Material deleted')
      setPendingDelete(null)
      await reload()
    } catch (caught) {
      toast.error('Could not delete material', getErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Study materials"
        description="Slides, PDFs and notes, stored privately in your account."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Search materials"
            placeholder="Search by title or file name"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by course"
          className="sm:w-56"
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
        >
          <option value="all">All courses</option>
          <option value="none">No course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.course_code}
            </option>
          ))}
        </Select>
      </div>

      <div className="card">
        {loading && <ListSkeleton />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={<FolderOpen className="h-6 w-6" />}
            title={materials.length === 0 ? 'No materials yet' : 'No matching materials'}
            message={
              materials.length === 0
                ? 'Upload lecture slides, past papers and notes so they are always with you.'
                : 'Try a different search term or course filter.'
            }
            action={
              materials.length === 0 ? (
                <Button onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" /> Upload material
                </Button>
              ) : undefined
            }
          />
        )}
        {!loading && !error && visible.length > 0 && (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {visible.map((material) => (
              <li key={material.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {material.title}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {material.file_name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {material.course && (
                      <Badge>
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: material.course.color }}
                          aria-hidden="true"
                        />
                        {material.course.course_code}
                      </Badge>
                    )}
                    <span>{formatFileSize(material.file_size)}</span>
                    <span>{formatDate(material.created_at)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Download ${material.title}`}
                    loading={downloadingId === material.id}
                    onClick={() => handleDownload(material)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${material.title}`}
                    onClick={() => setPendingDelete(material)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload material"
        description="PDF, Office documents, images, text and ZIP files up to 50 MB."
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" form="material-form" loading={uploading}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          </>
        }
      >
        <form id="material-form" onSubmit={handleUpload} className="space-y-4">
          <Input
            label="File"
            type="file"
            error={fileError}
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null
              setFile(selected)
              setFileError(undefined)
              if (selected && !form.title)
                setForm((current) => ({ ...current, title: selected.name }))
            }}
          />
          <Input
            label="Title"
            placeholder="Lecture 7 - Graph traversal"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <Select
            label="Course (optional)"
            value={form.courseId}
            onChange={(event) => setForm({ ...form, courseId: event.target.value })}
          >
            <option value="">No course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_code} - {course.course_name}
              </option>
            ))}
          </Select>
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete material"
        message={`"${pendingDelete?.title ?? ''}" and its stored file will be permanently deleted.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
