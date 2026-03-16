'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface MediaFile {
  id: string
  file: File
  preview: string
  filename: string
  description: string
  shooting_date: string
  category: string
}

const CATEGORIES = [
  'News',
  'Sports',
  'Entertainment',
  'Politics',
  'Business',
  'Technology',
  'Nature',
  'Travel',
  'Fashion',
  'Food',
  'Architecture',
  'Portrait',
  'Stock',
  'Other'
]

export default function UploadPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [files, setFiles] = useState<MediaFile[]>([])
  const [eventName, setEventName] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<any[]>([])
  const [createNewFolder, setCreateNewFolder] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'photographer' || !profile.is_approved) {
      router.push('/login')
      return
    }

    setProfile(profile)
    
    // Load existing folders
    const { data: folderData } = await supabase
      .from('media_folders')
      .select('*')
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })

    if (folderData) setFolders(folderData)
    setLoading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const newFiles: MediaFile[] = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      filename: file.name.replace(/\.[^/.]+$/, ''),
      description: '',
      shooting_date: new Date().toISOString().split('T')[0],
      category: 'Stock'
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const updateFile = (id: string, field: string, value: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    if (!eventName && createNewFolder) {
      setError('Please enter an event name')
      return
    }

    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let folderIdToUse = folderId

      // Create new folder if needed
      if (createNewFolder && eventName) {
        const { data: folder, error: folderError } = await supabase
          .from('media_folders')
          .insert({
            photographer_id: user.id,
            event_name: eventName,
          })
          .select()
          .single()

        if (folderError) throw folderError
        folderIdToUse = folder.id
      }

      if (!folderIdToUse && files.length > 0) {
        // Create default folder
        const { data: folder, error: folderError } = await supabase
          .from('media_folders')
          .insert({
            photographer_id: user.id,
            event_name: eventName || 'Uncategorized',
          })
          .select()
          .single()

        if (folderError) throw folderError
        folderIdToUse = folder.id
      }

      // Get count for media ID generation
      const { count } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })

      const newCount = (count || 0) + 1

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const mediaFile = files[i]
        const mediaId = `PPA-MEDIA-${String(newCount + i).padStart(5, '0')}`
        
        // Upload to Backblaze B2 via API
        const formData = new FormData()
        formData.append('file', mediaFile.file)
        formData.append('photographerId', user.id)
        formData.append('folderId', folderIdToUse)
        formData.append('mediaId', mediaId)
        formData.append('filename', mediaFile.filename)
        formData.append('description', mediaFile.description)
        formData.append('shooting_date', mediaFile.shooting_date)
        formData.append('category', mediaFile.category)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const uploadResult = await uploadResponse.json()
        if (uploadResult.error) throw new Error(uploadResult.error)
      }

      setSuccess(true)
      setFiles([])
      setEventName('')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="p-8">Loading...</div>

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-black border-b dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-blue-600">PPA</Link>
              <nav className="flex items-center gap-4">
                <Link href="/photographer" className="text-gray-600 dark:text-gray-300">Dashboard</Link>
                <ThemeToggle />
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">Upload Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your media has been uploaded and is pending admin approval.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Upload More
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">PPA</Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <Link href="/photographer" className="text-gray-600 dark:text-gray-300">← Back to Dashboard</Link>
            </div>
            <nav className="flex items-center gap-4">
              <ThemeToggle />
              <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300">Logout</button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold dark:text-white mb-6">Upload Media</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📁</div>
              <p className="dark:text-white font-medium">Click to select files</p>
              <p className="text-sm text-gray-500">or drag and drop</p>
              <p className="text-xs text-gray-400 mt-2">Photos and videos up to 500MB each</p>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold dark:text-white">Files ({files.length})</h2>
              {files.map((file) => (
                <div key={file.id} className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex gap-4">
                    {/* Preview */}
                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      {file.preview ? (
                        <img src={file.preview} alt={file.filename} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                      )}
                    </div>
                    
                    {/* Fields */}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <input
                          type="text"
                          value={file.filename}
                          onChange={(e) => updateFile(file.id, 'filename', e.target.value)}
                          placeholder="Filename"
                          className="flex-1 p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={file.shooting_date}
                          onChange={(e) => updateFile(file.id, 'shooting_date', e.target.value)}
                          className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <select
                          value={file.category}
                          onChange={(e) => updateFile(file.id, 'category', e.target.value)}
                          className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      
                      <input
                        type="text"
                        value={file.description}
                        onChange={(e) => updateFile(file.id, 'description', e.target.value)}
                        placeholder="Description / Keywords (comma separated)"
                        className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Folder Selection */}
          {files.length > 0 && (
            <div className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
              <h3 className="font-semibold dark:text-white mb-3">Event / Folder</h3>
              
              <div className="flex gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="folderType"
                    checked={createNewFolder}
                    onChange={() => setCreateNewFolder(true)}
                    className="mr-2"
                  />
                  <span className="dark:text-gray-300">Create new folder</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="folderType"
                    checked={!createNewFolder}
                    onChange={() => setCreateNewFolder(false)}
                    className="mr-2"
                  />
                  <span className="dark:text-gray-300">Use existing</span>
                </label>
              </div>

              {createNewFolder ? (
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Event name (e.g., Wedding, Concert, Sports Event)"
                  className="w-full p-3 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full p-3 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a folder</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.event_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {files.length > 0 && (
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
            </button>
          )}
        </form>
      </main>
    </div>
  )
}
