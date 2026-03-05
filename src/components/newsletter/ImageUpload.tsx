import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { uploadNewsletterImage, deleteNewsletterImage } from '../../lib/newsletter/image-upload'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }

    setUploading(true)
    try {
      const url = await uploadNewsletterImage(file)
      onChange(url)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = async () => {
    if (value) {
      await deleteNewsletterImage(value)
      onChange(null)
    }
  }

  if (value) {
    return (
      <div className="relative group">
        {label && <p className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>}
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={value} alt="Upload" className="w-full h-40 object-cover" />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove image"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {label && <p className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          dragOver ? 'border-csf-blue bg-csf-blue/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        {uploading ? (
          <div className="w-6 h-6 border-2 border-csf-blue/20 border-t-csf-blue rounded-full animate-spin" />
        ) : (
          <>
            <PhotoIcon className="w-8 h-8 text-gray-300 mb-2" />
            <p className="font-body text-xs text-gray-400">
              Drop image or click to browse
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
