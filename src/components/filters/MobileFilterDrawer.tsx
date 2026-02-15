import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react'
import { FilterSidebar } from './FilterSidebar'
import type { Filters } from '../../types'

interface MobileFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  filters: Filters
  onChange: (filters: Filters) => void
}

export function MobileFilterDrawer({ isOpen, onClose, filters, onChange }: MobileFilterDrawerProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50 lg:hidden">
      <DialogBackdrop className="fixed inset-0 bg-black/30 animate-fade-in" />
      <div className="fixed inset-0 flex items-end">
        <DialogPanel className="w-full max-h-[80vh] overflow-y-auto custom-scrollbar bg-white rounded-t-3xl p-5 shadow-2xl animate-slide-in-up">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          <FilterSidebar
            filters={filters}
            onChange={onChange}
            onClose={onClose}
            isMobile
          />
        </DialogPanel>
      </div>
    </Dialog>
  )
}
