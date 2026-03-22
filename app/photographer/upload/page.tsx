'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { MapPin, Tag, Folder, CheckCircle, AlertCircle, Info, Upload } from 'lucide-react'

interface MediaFile {
  id: string
  file: File
  preview: string
  filename: string
  description: string
  shooting_date: string
  category: string
  location: string
  keywords: string
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
  const [user, setUser] = useState<any>(null)
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

    if (!profile || profile.role !== 'photographer') {
      router.push('/login')
      return
    }

    setProfile(profile)
    setUser(user)
    
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
      category: '',
      location: '',
      keywords: ''
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const updateFile = (id: string, field: keyof MediaFile, value: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ))
  }

  const validateFiles = (): string | null => {
    for (const file of files) {
      if (!file.category) return 'Please select a category for all files'
      if (!file.location || file.location.trim() === '') return 'Please add a location for all files'
      if (!file.keywords || file.keywords.trim() === '') return 'Please add keywords for all files (helps buyers find your work)'
    }
    return null
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

    // Validate required fields
    const validationError = validateFiles()
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let folderIdToUse = folderId

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

      const { count } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })

      const newCount = (count || 0) + 1

      for (let i = 0; i < files.length; i++) {
        const mediaFile = files[i]
        const mediaId = `PPA-MEDIA-${String(newCount + i).padStart(5, '0')}`
        const fileSizeMB = mediaFile.file.size / (1024 * 1024)
        
        // For files >= 4MB, use presigned URL (direct upload to Backblaze)
        // This bypasses Vercel's 4.5MB body size limit
        if (fileSizeMB >= 4) {
          // Step 1: Get presigned PUT URL
          const urlResponse = await fetch('/api/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: mediaFile.file.name,
              contentType: mediaFile.file.type,
              photographerId: user.id,
              folderId: folderIdToUse || '',
              mediaId
            })
          })
          
          const urlData = await urlResponse.json()
          if (urlData.error) throw new Error(urlData.error)
          
          // Step 2: Upload directly to Backblaze using PUT
          const uploadResponse = await fetch(urlData.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': mediaFile.file.type,
            },
            body: mediaFile.file
          })
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`)
          }
          
          // Step 3: Save metadata to database
          const saveResponse = await fetch('/api/save-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filePath: urlData.key,
              photographerId: user.id,
              folderId: folderIdToUse || '',
              mediaId,
              filename: mediaFile.filename || '',
              contentType: mediaFile.file.type,
              description: mediaFile.description || '',
              shootingDate: mediaFile.shooting_date || '',
              category: mediaFile.category || '',
              location: mediaFile.location || '',
              keywords: mediaFile.keywords || ''
            })
          })
          
          const saveResult = await saveResponse.json()
          if (saveResult.error) throw new Error(saveResult.error)
          
        } else {
          // Small files: use direct upload (existing method)
          const formData = new FormData()
          formData.append('file', mediaFile.file)
          formData.append('photographerId', user.id)
          formData.append('folderId', folderIdToUse || '')
          formData.append('mediaId', mediaId)
          formData.append('filename', mediaFile.filename || '')
          formData.append('description', mediaFile.description || '')
          formData.append('shooting_date', mediaFile.shooting_date || '')
          formData.append('category', mediaFile.category || '')
          formData.append('location', mediaFile.location || '')
          formData.append('keywords', mediaFile.keywords || '')

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          const uploadResult = await uploadResponse.json()
          if (uploadResult.error) throw new Error(uploadResult.error)
        }
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

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121212]">
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <img src="/ppa-logo.png" alt="PPA Logo" className="h-10 w-auto" />
              </Link>
              <nav className="flex items-center gap-4">
                <ThemeToggle />
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-blue-500" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-500">
                    <span className="text-white font-medium text-sm">{user?.email?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">Upload Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your media has been uploaded successfully and is now live on the marketplace.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setSuccess(false)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Upload More
            </button>
            <Link
              href="/photographer"
              className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <img src="/ppa-logo.png" alt="PPA Logo" className="h-10 w-auto" />
              </Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <Link href="/photographer" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium">
                Dashboard
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <ThemeToggle />
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-blue-500" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-500">
                  <span className="text-white font-medium text-sm">{user?.email?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Media</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Share your work with the world. Fill in all required fields to publish.</p>

        {/* SOP Guide */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Before Publishing - Required Information</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300">Location *</p>
                    <p className="text-blue-700 dark:text-blue-400">Where was this taken?</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300">Keywords *</p>
                    <p className="text-blue-700 dark:text-blue-400">Comma-separated tags</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300">Category *</p>
                    <p className="text-blue-700 dark:text-blue-400">Select the best fit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center bg-white dark:bg-[#1E1E1E]">
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
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="dark:text-white font-medium text-lg">Click to select files</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or drag and drop</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Photos and videos up to 500MB each</p>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold dark:text-white text-lg">Files ({files.length})</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> * Required fields
                </span>
              </div>
              {files.map((file) => (
                <div key={file.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#1E1E1E]">
                  <div className="flex gap-4">
                    {/* Preview */}
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      {file.preview ? (
                        <img src={file.preview} alt={file.filename} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                      )}
                    </div>
                    
                    {/* Fields */}
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <input
                          type="text"
                          value={file.filename}
                          onChange={(e) => updateFile(file.id, 'filename', e.target.value)}
                          placeholder="Title"
                          className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700 ml-2 p-2"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Required Fields - Location, Keywords, Category */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={file.location}
                            onChange={(e) => updateFile(file.id, 'location', e.target.value)}
                            placeholder="Location *"
                            className={`w-full pl-10 p-2 border rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white text-sm ${!file.location ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                          />
                        </div>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={file.keywords}
                            onChange={(e) => updateFile(file.id, 'keywords', e.target.value)}
                            placeholder="Keywords (comma-separated) *"
                            className={`w-full pl-10 p-2 border rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white text-sm ${!file.keywords ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                          />
                        </div>
                        <div className="relative">
                          <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <select
                            value={file.category}
                            onChange={(e) => updateFile(file.id, 'category', e.target.value)}
                            className={`w-full pl-10 p-2 border rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white text-sm ${!file.category ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                          >
                            <option value="">Category *</option>
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Optional Fields */}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={file.shooting_date}
                          onChange={(e) => updateFile(file.id, 'shooting_date', e.target.value)}
                          className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          value={file.description}
                          onChange={(e) => updateFile(file.id, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Folder Selection */}
          {files.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#1E1E1E]">
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
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white"
                />
              ) : (
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white"
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
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {files.length > 0 && (
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Publish {files.length} File{files.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </form>
      </main>
    </div>
  )
}
