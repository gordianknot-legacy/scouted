import { Bars3Icon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, signOut } = useAuth()

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const email = user?.email ?? ''
  const initials = email.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-40 glass-dark text-white shadow-lg shadow-csf-blue/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-csf-yellow rounded-xl flex items-center justify-center shadow-sm shadow-csf-yellow/30">
                <span className="text-csf-blue font-heading font-bold text-sm">SE</span>
              </div>
              <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
                Scout<span className="text-csf-yellow">Ed</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="hidden sm:block font-body text-sm text-white/50">
              CSF Partnerships &middot; Grant Opportunities
            </p>
            {user && (
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-csf-yellow flex items-center justify-center border-2 border-white/20">
                    <span className="text-csf-blue font-heading font-bold text-xs">{initials}</span>
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <ArrowRightStartOnRectangleIcon className="w-5 h-5 text-white/60" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
