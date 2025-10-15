'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '../../hooks/useToast'

export default function JoinPage() {
  const [name, setName] = useState('')
  const [room, setRoom] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{name?: string, room?: string}>({})
  const router = useRouter()
  const { success, error: showError } = useToast()

  useEffect(() => {
    // Generate a random name if not set
    if (!name) {
      setName('User-' + Math.floor(Math.random()*1000))
    }
  }, [])

  function validateForm() {
    const newErrors: {name?: string, room?: string} = {}
    
    if (!name.trim()) {
      newErrors.name = 'Display name is required'
    } else if (name.trim().length < 2) {
      newErrors.name = 'Display name must be at least 2 characters'
    } else if (name.trim().length > 50) {
      newErrors.name = 'Display name must be less than 50 characters'
    }
    
    if (!room.trim()) {
      newErrors.room = 'Room name is required'
    } else if (room.trim().length < 2) {
      newErrors.room = 'Room name must be at least 2 characters'
    } else if (room.trim().length > 50) {
      newErrors.room = 'Room name must be less than 50 characters'
    } else if (!/^[a-zA-Z0-9-_]+$/.test(room.trim())) {
      newErrors.room = 'Room name can only contain letters, numbers, hyphens, and underscores'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) {
      showError('Please fix the errors above before continuing')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      success('Joining meeting...')
      router.push(`/room?room=${encodeURIComponent(room.trim())}&name=${encodeURIComponent(name.trim())}`)
    } catch (err) {
      showError('Failed to join meeting. Please try again.')
      setIsLoading(false)
    }
  }

  function generateRandomRoom() {
    const adjectives = ['Amazing', 'Brilliant', 'Creative', 'Dynamic', 'Elegant', 'Fantastic', 'Great', 'Happy', 'Incredible', 'Joyful']
    const nouns = ['Meeting', 'Conference', 'Session', 'Gathering', 'Workshop', 'Discussion', 'Chat', 'Call', 'Room', 'Space']
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
    const randomNum = Math.floor(Math.random() * 1000)
    setRoom(`${randomAdj}-${randomNoun}-${randomNum}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-gradient">VideoMeet</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Join a Meeting</h2>
          <p className="text-gray-600">Enter your details to start or join a video conference</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: undefined }))
                  }
                }}
                placeholder="Enter your display name"
                className={`input-field ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
                Room Name
              </label>
              <div className="flex gap-2">
                <input
                  id="room"
                  type="text"
                  value={room}
                  onChange={(e) => {
                    setRoom(e.target.value)
                    if (errors.room) {
                      setErrors(prev => ({ ...prev, room: undefined }))
                    }
                  }}
                  placeholder="Enter room name"
                  className={`input-field flex-1 ${errors.room ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={generateRandomRoom}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors text-sm font-medium"
                  disabled={isLoading}
                >
                  Random
                </button>
              </div>
              {errors.room && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.room}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !name.trim() || !room.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="spinner mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join Meeting
                </>
              )}
            </button>
          </form>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Quick actions</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setName('User-' + Math.floor(Math.random()*1000))
                  generateRandomRoom()
                }}
                className="btn-secondary text-sm py-2"
                disabled={isLoading}
              >
                Generate Both
              </button>
              <Link
                href="/"
                className="btn-secondary text-sm py-2 text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for a great meeting:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a clear, recognizable display name</li>
            <li>• Share the room name with other participants</li>
            <li>• Test your camera and microphone before joining</li>
            <li>• Use a stable internet connection for best quality</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
