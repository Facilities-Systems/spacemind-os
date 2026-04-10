import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BrainCircuit, ChevronDown, Send } from 'lucide-react'
import { clsx } from 'clsx'
import { useLocations } from '../../hooks/useDecompose'
import type { DecompositionRequest, Priority } from '../../types'

const schema = z.object({
  request_text: z
    .string()
    .min(10, 'Please describe your request in at least 10 characters')
    .max(2000, 'Request is too long — please be more concise'),
  location_id: z.string().min(1, 'Please select a location'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  requester_name: z.string().optional(),
  additional_context: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const EXAMPLES = [
  'Move 40 staff from FP1 to FP2 within the next 6 weeks',
  'Set up a new canteen area on the 3rd floor of our Nairobi office',
  'Full fit-out of the vacant 2nd floor at FP2 — 60 workstations, 4 meeting rooms',
  'The HVAC on the 5th floor has been intermittently failing — arrange repair',
  'Renovate the open-plan floor at London UK office — phased approach',
]

interface RequestFormProps {
  onSubmit: (req: DecompositionRequest) => void
  isLoading: boolean
}

export function RequestForm({ onSubmit, isLoading }: RequestFormProps) {
  const { data: locations = [] } = useLocations()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      request_text: '',
      location_id: 'FP1_HQ_SouthAfrica',
      priority: 'normal',
    },
  })

  const priority = watch('priority')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFormSubmit = (values: FormValues) => {
    onSubmit({
      request_text: values.request_text,
      location_id: values.location_id,
      priority: values.priority,
      requester_name: values.requester_name || undefined,
      additional_context: values.additional_context || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Main request input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Facilities Request
        </label>
        <textarea
          {...register('request_text')}
          disabled={isLoading}
          rows={5}
          placeholder="Describe the facilities operation in plain language..."
          className={clsx(
            'w-full bg-surface border rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:ring-1 transition-all disabled:opacity-50',
            errors.request_text
              ? 'border-red-700/60 focus:border-red-600 focus:ring-red-600/30'
              : 'border-surface-border focus:border-brand-600 focus:ring-brand-600/50',
          )}
        />
        {errors.request_text && (
          <p className="mt-1.5 text-xs text-red-400">{errors.request_text.message}</p>
        )}
        {/* Example chips */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setValue('request_text', ex, { shouldValidate: true })}
              className="text-xs text-gray-500 hover:text-brand-300 bg-surface-muted hover:bg-brand-900/30 border border-surface-border hover:border-brand-700/50 rounded-lg px-2.5 py-1 transition-all"
            >
              {ex.length > 45 ? ex.slice(0, 45) + '…' : ex}
            </button>
          ))}
        </div>
      </div>

      {/* Location + Priority row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
          <select
            {...register('location_id')}
            disabled={isLoading}
            className={clsx(
              'w-full bg-surface border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-600 transition-all disabled:opacity-50 appearance-none cursor-pointer',
              errors.location_id ? 'border-red-700/60' : 'border-surface-border',
            )}
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.id} — {loc.country} ({loc.tenure})
              </option>
            ))}
            {locations.length === 0 && (
              <option value="FP1_HQ_SouthAfrica">FP1_HQ_SouthAfrica — South Africa (owned)</option>
            )}
          </select>
          {errors.location_id && (
            <p className="mt-1 text-xs text-red-400">{errors.location_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-4 gap-1.5">
                {(['low', 'normal', 'high', 'urgent'] as Priority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => field.onChange(p)}
                    className={clsx(
                      'py-2 rounded-lg text-xs font-medium capitalize transition-all',
                      field.value === p
                        ? p === 'urgent' ? 'bg-red-600 text-white'
                          : p === 'high' ? 'bg-amber-600 text-white'
                          : p === 'normal' ? 'bg-brand-600 text-white'
                          : 'bg-surface-muted text-gray-300 border border-brand-700/50'
                        : 'bg-surface border border-surface-border text-gray-500 hover:text-gray-300',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-all"
      >
        <ChevronDown className={clsx('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
        Advanced options
      </button>

      {showAdvanced && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Requester Name</label>
            <input
              {...register('requester_name')}
              placeholder="e.g. Sifiso Sibiya, Facilities Director"
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-600 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Additional Context</label>
            <textarea
              {...register('additional_context')}
              rows={3}
              placeholder="Budget constraints, special conditions, previous attempts, relevant history..."
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-brand-600 transition-all"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-surface-muted disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition-all text-sm"
      >
        <BrainCircuit className="h-4 w-4" />
        {isLoading ? 'Generating Plan...' : 'Generate Execution Plan'}
        {!isLoading && <Send className="h-3.5 w-3.5" />}
      </button>
    </form>
  )
}

