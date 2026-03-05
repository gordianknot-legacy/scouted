import { useState } from 'react'
import { ArrowLeftIcon, PlusIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useDonors, useCreateDonor, useUpdateDonor, useDeleteDonor, useBulkCreateDonors } from '../../hooks/useDonors'

interface DonorManagerProps {
  onBack: () => void
}

export function DonorManager({ onBack }: DonorManagerProps) {
  const { data: donors = [], isLoading } = useDonors()
  const createDonor = useCreateDonor()
  const updateDonor = useUpdateDonor()
  const deleteDonor = useDeleteDonor()
  const bulkCreate = useBulkCreateDonors()

  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newOrg, setNewOrg] = useState('')
  const [csvText, setCsvText] = useState('')
  const [bulkResult, setBulkResult] = useState<string | null>(null)

  const activeDonors = donors.filter(d => d.is_active)
  const inactiveDonors = donors.filter(d => !d.is_active)

  const filtered = donors.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || (d.organisation || '').toLowerCase().includes(q)
  })

  const handleAddDonor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return
    try {
      await createDonor.mutateAsync({ name: newName.trim(), email: newEmail.trim(), organisation: newOrg.trim() || undefined })
      setNewName('')
      setNewEmail('')
      setNewOrg('')
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to add donor:', err)
    }
  }

  const handleBulkImport = async () => {
    if (!csvText.trim()) return
    const lines = csvText.trim().split('\n').filter(l => l.trim())
    const parsed: { name: string; email: string; organisation?: string }[] = []
    const errors: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim())
      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: needs at least name and email`)
        continue
      }
      if (!parts[1].includes('@')) {
        errors.push(`Line ${i + 1}: invalid email "${parts[1]}"`)
        continue
      }
      parsed.push({ name: parts[0], email: parts[1], organisation: parts[2] || undefined })
    }

    if (parsed.length === 0) {
      setBulkResult(`No valid entries found. ${errors.join('; ')}`)
      return
    }

    try {
      const result = await bulkCreate.mutateAsync(parsed)
      setBulkResult(`Imported ${result.length} donors.${errors.length > 0 ? ` Skipped ${errors.length} invalid lines.` : ''}`)
      setCsvText('')
    } catch (err) {
      setBulkResult(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from donor list?`)) return
    try {
      await deleteDonor.mutateAsync(id)
    } catch (err) {
      console.error('Failed to delete donor:', err)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-200/60 transition-colors" aria-label="Back">
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-heading text-xl font-bold text-gray-900">Manage Donors</h1>
        <div className="flex-1" />
        <button
          onClick={() => { setShowBulkImport(!showBulkImport); setShowAddForm(false) }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-heading text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowUpTrayIcon className="w-4 h-4" />
          Bulk Import
        </button>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setShowBulkImport(false) }}
          className="flex items-center gap-2 px-4 py-2 bg-csf-blue text-white rounded-xl font-heading text-sm font-semibold hover:bg-csf-blue/90 transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add Donor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent p-4">
          <p className="font-body text-xs text-gray-400 uppercase">Total</p>
          <p className="font-heading text-2xl font-bold text-gray-900">{donors.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent p-4">
          <p className="font-body text-xs text-gray-400 uppercase">Active</p>
          <p className="font-heading text-2xl font-bold text-csf-blue">{activeDonors.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent p-4">
          <p className="font-body text-xs text-gray-400 uppercase">Inactive</p>
          <p className="font-heading text-2xl font-bold text-gray-400">{inactiveDonors.length}</p>
        </div>
      </div>

      {/* Add Donor Form */}
      {showAddForm && (
        <form onSubmit={handleAddDonor} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent p-5 mb-6">
          <h3 className="font-heading text-sm font-bold text-gray-900 mb-3">Add Donor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Name *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
              className="px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
            />
            <input
              type="email"
              placeholder="Email *"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
              className="px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
            />
            <input
              type="text"
              placeholder="Organisation"
              value={newOrg}
              onChange={e => setNewOrg(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl font-heading text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createDonor.isPending}
              className="px-4 py-2 bg-csf-blue text-white rounded-xl font-heading text-sm font-semibold hover:bg-csf-blue/90 disabled:opacity-50 transition-colors"
            >
              {createDonor.isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Bulk Import */}
      {showBulkImport && (
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent p-5 mb-6">
          <h3 className="font-heading text-sm font-bold text-gray-900 mb-1">Bulk Import from CSV</h3>
          <p className="font-body text-xs text-gray-400 mb-3">
            Paste one donor per line: <code className="text-csf-blue">name, email, organisation</code>
          </p>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={"Rajesh Kumar, rajesh@example.org, Tata Trusts\nPriya Sharma, priya@example.org, Gates Foundation"}
            rows={5}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30 resize-none font-mono"
          />
          {bulkResult && (
            <p className={`font-body text-xs mt-2 ${bulkResult.includes('failed') ? 'text-csf-orange' : 'text-csf-blue'}`}>
              {bulkResult}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => { setShowBulkImport(false); setBulkResult(null) }}
              className="px-4 py-2 rounded-xl font-heading text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkImport}
              disabled={bulkCreate.isPending || !csvText.trim()}
              className="px-4 py-2 bg-csf-blue text-white rounded-xl font-heading text-sm font-semibold hover:bg-csf-blue/90 disabled:opacity-50 transition-colors"
            >
              {bulkCreate.isPending ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search donors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30 shadow-sm"
        />
      </div>

      {/* Donor Table */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-[3px] border-csf-blue/10 border-t-csf-blue rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-heading font-semibold text-gray-700">
            {search ? 'No donors match your search' : 'No donors yet'}
          </p>
          <p className="font-body text-sm text-gray-400 mt-1">
            {search ? 'Try a different search term.' : 'Add your first donor above.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Email</th>
                  <th className="text-left font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Organisation</th>
                  <th className="text-center font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Active</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-heading text-sm font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-3 font-body text-sm text-gray-600">{d.email}</td>
                    <td className="px-4 py-3 font-body text-sm text-gray-500 hidden sm:table-cell">{d.organisation || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => updateDonor.mutate({ id: d.id, is_active: !d.is_active })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          d.is_active ? 'bg-csf-blue' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                          d.is_active ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => handleDelete(d.id, d.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
