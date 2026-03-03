export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-csf-blue flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-csf-yellow/30 border-t-csf-yellow rounded-full animate-spin" />
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-csf-yellow rounded-xl flex items-center justify-center shadow-sm shadow-csf-yellow/30">
            <span className="text-csf-blue font-heading font-bold text-sm">SE</span>
          </div>
          <span className="font-heading text-lg font-bold text-white tracking-tight">
            Scout<span className="text-csf-yellow">Ed</span>
          </span>
        </div>
      </div>
    </div>
  )
}
