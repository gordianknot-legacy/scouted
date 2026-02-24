import { useState } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import type { Opportunity } from '../../types'

interface DownloadDropdownProps {
  opportunity: Opportunity
  size?: 'sm' | 'md'
}

export function DownloadDropdown({ opportunity, size = 'sm' }: DownloadDropdownProps) {
  const [generating, setGenerating] = useState(false)

  async function handleDownload(format: 'pptx' | 'docx') {
    setGenerating(true)
    try {
      if (format === 'pptx') {
        const { generatePptx } = await import('../../lib/docgen/pptx-generator')
        await generatePptx(opportunity)
      } else {
        const { generateDocx } = await import('../../lib/docgen/docx-generator')
        await generateDocx(opportunity)
      }
    } catch (err) {
      console.error(`Failed to generate ${format}:`, err)
    } finally {
      setGenerating(false)
    }
  }

  const iconSize = size === 'sm' ? 'w-4.5 h-4.5' : 'w-5 h-5'
  const btnPad = size === 'sm' ? 'p-2' : 'p-2.5'
  const btnHover = size === 'sm' ? 'hover:bg-gray-200/60' : 'hover:bg-gray-100'

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={`${btnPad} rounded-lg ${btnHover} transition-colors`}
        aria-label="Download grant draft"
        title="Download grant draft"
        onClick={e => e.stopPropagation()}
      >
        {generating ? (
          <svg className={`${iconSize} animate-spin text-csf-blue`} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <ArrowDownTrayIcon className={`${iconSize} text-gray-400`} />
        )}
      </MenuButton>

      <MenuItems
        anchor="bottom start"
        onClick={e => e.stopPropagation()}
        className="z-50 mt-1 w-52 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-gray-200 focus:outline-none p-1"
      >
        <MenuItem>
          <button
            onClick={e => { e.stopPropagation(); handleDownload('pptx') }}
            disabled={generating}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-heading text-gray-700 data-[focus]:bg-csf-blue/5 data-[focus]:text-csf-blue transition-colors disabled:opacity-50"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold shrink-0">
              PPT
            </span>
            <div className="text-left">
              <p className="font-semibold">PowerPoint</p>
              <p className="text-xs text-gray-400 font-body">.pptx — 5-slide deck</p>
            </div>
          </button>
        </MenuItem>
        <MenuItem>
          <button
            onClick={e => { e.stopPropagation(); handleDownload('docx') }}
            disabled={generating}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-heading text-gray-700 data-[focus]:bg-csf-blue/5 data-[focus]:text-csf-blue transition-colors disabled:opacity-50"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold shrink-0">
              DOC
            </span>
            <div className="text-left">
              <p className="font-semibold">Word</p>
              <p className="text-xs text-gray-400 font-body">.docx — full document</p>
            </div>
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}
