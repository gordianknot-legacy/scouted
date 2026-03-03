import { useAuth } from '../../contexts/AuthContext'

export function LoginPage() {
  const { signIn, error } = useAuth()

  return (
    <div className="min-h-screen bg-csf-blue flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-csf-yellow rounded-xl flex items-center justify-center shadow-sm shadow-csf-yellow/30">
              <span className="text-csf-blue font-heading font-bold text-lg">SE</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-csf-blue tracking-tight">
              Scout<span className="text-csf-yellow">Ed</span>
            </h1>
          </div>

          <p className="font-body text-sm text-gray-500 text-center mb-6">
            CSF Partnerships &middot; Grant Opportunities
          </p>

          {/* Error alert */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-body text-sm text-red-700 text-center">{error}</p>
            </div>
          )}

          {/* Sign in button */}
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-xl font-heading text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all"
          >
            {/* Google "G" icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          {/* Domain notice */}
          <p className="font-body text-xs text-gray-400 text-center mt-5">
            Only @centralsquarefoundation.org accounts are permitted.
          </p>
        </div>
      </div>
    </div>
  )
}
