import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeEditor } from './code-editor'

export interface Field<T> {
  key: keyof T & string
  label: string
  placeholder: string
  required?: boolean
  options?: string[]
  // checkbox: nilai 'yes'/'no'. code: editor script berwarna. rate: input RX/TX yang digabung jadi "rx/tx".
  type?: 'checkbox' | 'code' | 'rate'
  // Field tetap tampil tetapi tidak bisa diisi bila fungsi ini true (mis. bergantung pada checkbox lain).
  disabled?: (data: Partial<T>) => boolean
}

export interface FormTab {
  value: string
  label: string
  keys: string[]
}

export function FormDialog<T extends object>({
  open,
  onOpenChange,
  title,
  idPrefix,
  fields,
  data,
  onChange,
  onSubmit,
  submitLabel,
  passwordOptional = false,
  basicKeys,
  tabs,
  wide = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  idPrefix: string
  fields: Field<T>[]
  data: Partial<T>
  onChange: (data: Partial<T>) => void
  onSubmit: (event: React.FormEvent) => void
  submitLabel: string
  passwordOptional?: boolean
  // When set, fields are split into Basic (these keys) and Advanced (all) tabs.
  basicKeys?: string[]
  // Custom tabs, each showing only its own keys. Takes precedence over basicKeys.
  tabs?: FormTab[]
  // Dialog lebih lebar, untuk field berisi script.
  wide?: boolean
}) {
  const renderField = (field: Field<T>) => {
    const id = `${idPrefix}-${field.key}`
    const value = String(data[field.key] ?? '')
    const required =
      field.required || (field.key === 'password' && !passwordOptional)
    const setValue = (next: string) =>
      onChange({ ...data, [field.key]: next } as Partial<T>)
    const isDisabled = field.disabled?.(data) ?? false

    if (field.type === 'checkbox') {
      return (
        <div key={field.key} className='flex items-center gap-2'>
          <Checkbox
            id={id}
            checked={value === 'yes'}
            onCheckedChange={(checked) => setValue(checked ? 'yes' : 'no')}
          />
          <Label htmlFor={id}>{field.label}</Label>
        </div>
      )
    }

    if (field.type === 'rate') {
      // Format RouterOS: "rx/tx" lalu opsi burst dipisah spasi; opsi tambahan dipertahankan.
      const [rates = '', ...extras] = value.split(' ')
      const [rx = '', tx = ''] = rates.split('/')
      const setRate = (nextRx: string, nextTx: string) => {
        const base = nextTx ? `${nextRx}/${nextTx}` : nextRx
        setValue(base ? [base, ...extras].join(' ') : '')
      }
      const clean = (text: string) => text.replace(/\s/g, '')
      return (
        <div key={field.key} className='space-y-2'>
          <Label htmlFor={id}>{field.label}</Label>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <span className='text-xs text-muted-foreground'>RX (upload)</span>
              <Input
                id={id}
                value={rx}
                onChange={(event) => setRate(clean(event.target.value), tx)}
                placeholder='5M'
                autoComplete='off'
              />
            </div>
            <div className='space-y-1'>
              <span className='text-xs text-muted-foreground'>
                TX (download)
              </span>
              <Input
                aria-label={`${field.label} TX`}
                value={tx}
                onChange={(event) => setRate(rx, clean(event.target.value))}
                placeholder='5M'
                autoComplete='off'
              />
            </div>
          </div>
        </div>
      )
    }

    if (field.type === 'code') {
      return (
        <div key={field.key} className='space-y-2'>
          <Label htmlFor={id}>{field.label}</Label>
          <CodeEditor
            id={id}
            value={value}
            onChange={setValue}
            placeholder={field.placeholder}
          />
        </div>
      )
    }

    return (
      <div key={field.key} className='space-y-2'>
        <Label htmlFor={id}>
          {field.label}
          {required && <span className='text-destructive'> *</span>}
        </Label>
        {field.options ? (
          <Select
            value={value}
            disabled={isDisabled}
            onValueChange={(next) =>
              onChange({ ...data, [field.key]: next } as Partial<T>)
            }
          >
            <SelectTrigger id={id} className='w-full'>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {(value && !field.options.includes(value)
                ? [value, ...field.options]
                : field.options
              ).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={id}
            value={value}
            onChange={(event) =>
              onChange({
                ...data,
                [field.key]: event.target.value,
              } as Partial<T>)
            }
            placeholder={field.placeholder}
            required={required}
            disabled={isDisabled}
            autoComplete={field.key === 'password' ? 'new-password' : 'off'}
            type='text'
          />
        )}
      </div>
    )
  }

  const renderFields = (list: Field<T>[]) => (
    <div className='flex flex-col gap-4'>{list.map(renderField)}</div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Dikunci di atas (bukan di tengah) agar tab list tidak bergeser saat tinggi dialog berubah.
        className={`top-[8vh] max-h-[84vh] translate-y-0 overflow-y-auto p-0 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
        showCloseButton={false}
      >
        <DialogHeader className='border-b px-6 py-3'>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className='sr-only'>
            {title} form
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={onSubmit}
          className='space-y-4 px-6 pt-2.5 pb-6'
          autoComplete='off'
        >
          {tabs ? (
            <Tabs defaultValue={tabs[0]?.value}>
              <TabsList className='w-full'>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className='pt-2'>
                  {renderFields(
                    fields.filter((field) => tab.keys.includes(field.key))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : basicKeys ? (
            <Tabs defaultValue='basic'>
              <TabsList className='w-full'>
                <TabsTrigger value='basic'>Basic</TabsTrigger>
                <TabsTrigger value='advanced'>Advanced</TabsTrigger>
              </TabsList>
              <TabsContent value='basic' className='pt-2'>
                {renderFields(
                  fields.filter((field) => basicKeys.includes(field.key))
                )}
              </TabsContent>
              <TabsContent value='advanced' className='pt-2'>
                {renderFields(fields)}
              </TabsContent>
            </Tabs>
          ) : (
            renderFields(fields)
          )}
          <DialogFooter className='pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit'>{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
