import './globals.css'
import { ToastProvider } from '../hooks/useToast'

export const metadata = { 
  title: 'VideoMeet - Modern Video Conferencing',
  description: 'High-quality video conferencing powered by LiveKit and Next.js',
  keywords: 'video conferencing, live streaming, video calls, meeting',
  authors: [{ name: 'VideoMeet Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full m-0 p-0">
        <ToastProvider>
          <div className="min-h-full">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
