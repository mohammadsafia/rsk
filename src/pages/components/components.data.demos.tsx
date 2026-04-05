import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { type DateRange } from 'react-day-picker';
import { CalendarIcon, Check, CheckSquare, CircleCheck, ChevronsUpDown, Circle, Square, Star, StarOffIcon, Trash2, X } from 'lucide-react';
import { Button, Calendar, CheckboxGroup, Command, Popover, RadioGroup, TimePicker } from '@components/ui';
import { Dialog } from '@components/ui';
import {
  FormCheckbox,
  FormCheckboxGroup,
  FormCombobox,
  FormContainer,
  FormDatePicker,
  FormDateRange,
  FormFileUploader,
  FormInput,
  FormMultiCombobox,
  FormNumber,
  FormRadioGroup,
  FormSelect,
  FormTextarea,
  FormTimePicker,
} from '@components/forms';
import { ConfirmDialog, DateNavigation, FacetedFilter, PrimeDialog, TooltipButton } from '@components/shared';

import { useToast } from '@hooks/shared';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LookupHandler } from '@api/handlers';

// ---------- Demo components (hooks must be used inside components) ----------
export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="secondary">Open Dialog</Button>
      </Dialog.Trigger>

      <Dialog.Panel>
        <Dialog.Close
          aria-label="Close"
          className="absolute inset-e-4 top-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
        >
          <X size={18} />
        </Dialog.Close>

        <Dialog.Header>
          <Dialog.Title>Dialog Title</Dialog.Title>

          <Dialog.Description>This is a dialog description.</Dialog.Description>
        </Dialog.Header>

        <Dialog.Content>Dialog content goes here.</Dialog.Content>

        <Dialog.Footer>Dialog footer goes here.</Dialog.Footer>
      </Dialog.Panel>
    </Dialog>
  );
}

export function PopoverDemo() {
  return (
    <Popover>
      <Popover.Trigger asChild>
        <Button variant="secondary">Open Popover</Button>
      </Popover.Trigger>
      <Popover.Content>
        <div className="space-y-2">
          <h4 className="font-medium">Popover Title</h4>
          <p className="text-muted text-sm">Popover content here.</p>
        </div>
      </Popover.Content>
    </Popover>
  );
}

export function CommandAutocompleteDemo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const frameworks = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'next', label: 'Next.js' },
    { value: 'nuxt', label: 'Nuxt' },
  ];

  const selectedFramework = frameworks.find((f) => f.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-50 justify-between">
          {selectedFramework ? selectedFramework.label : 'Select framework...'}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </Popover.Trigger>
      <Popover.Content className="w-50 p-0">
        <Command>
          <Command.Input placeholder="Search framework..." />
          <Command.List>
            <Command.Empty>No framework found.</Command.Empty>
            <Command.Group>
              {frameworks.map((framework) => (
                <Command.Item
                  key={framework.value}
                  data-checked={framework.value === value}
                  value={framework.label}
                  onSelect={() => {
                    setValue(framework.value === value ? '' : framework.value);
                    setOpen(false);
                  }}
                >
                  <Check className={`me-2 h-4 w-4 ${value === framework.value ? 'opacity-100' : 'opacity-0'}`} />
                  {framework.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </Popover.Content>
    </Popover>
  );
}

export function FormBasicDemo() {
  const [disabled, setDisabled] = useState(false);
  const form = useForm<{ email: string; fruit: string }>({
    defaultValues: {
      email: 'test@example.com',
      fruit: 'apple',
    },
    resolver: zodResolver(
      z.object({
        email: z.string(),
        fruit: z.string(),
      }),
    ),
  });
  return (
    <FormContainer formContext={form} onSuccess={() => {}} className="w-96 space-y-3">
      <FormInput name="email" label="Email" required disabled={disabled} />
      <FormSelect
        name="fruit"
        label="Fruit"
        control={form.control}
        options={[
          { id: 'apple', name: 'Apple' },
          { id: 'orange', name: 'Orange' },
          { id: 'banana', name: 'Banana' },
        ]}
        getOptionLabel={(o: { id: string; name: string }) => o.name}
        getOptionValue={(o: { id: string; name: string }) => o.id}
        placeholder="Pick a fruit"
        required
        disabled={disabled}
      />
      <div className="flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle Disabled
        </Button>
      </div>
    </FormContainer>
  );
}

export function FormCheckboxDemo() {
  const form = useForm<{ agree: boolean }>();
  return (
    <FormContainer formContext={form} onSuccess={() => {}}>
      <FormCheckbox name="agree" control={form.control} label="I agree to the terms" />
    </FormContainer>
  );
}

export function FormDatePickerDemo() {
  const [disabled, setDisabled] = useState(false);
  const form = useForm<{ date?: Date; dateRequired?: Date; dateWithDefault?: Date; dateDisabled?: Date }>({
    defaultValues: {
      dateWithDefault: new Date(),
    },
  });
  return (
    <div className="w-96 space-y-6">
      <FormContainer formContext={form} onSuccess={() => {}} className="space-y-4">
        <FormDatePicker name="date" control={form.control} label="Basic Date Picker" placeholder="Select a date" />
        <FormDatePicker name="dateRequired" control={form.control} label="Required Date" required placeholder="Select a date (required)" />
        <FormDatePicker name="dateWithDefault" control={form.control} label="Date with Default Value" placeholder="Select a date" />
        <FormDatePicker
          name="dateDisabled"
          control={form.control}
          label="Disabled Date Picker"
          disabled={disabled}
          placeholder="Select a date"
        />
        <div className="flex gap-2">
          <Button type="submit">Submit</Button>
          <Button type="button" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="button" onClick={() => setDisabled(!disabled)}>
            Toggle Disabled
          </Button>
        </div>
      </FormContainer>
    </div>
  );
}

export function FormDateRangeDemo() {
  const [disabled, setDisabled] = useState(false);
  const form = useForm<{
    range?: { from?: Date; to?: Date };
    rangeRequired?: { from?: Date; to?: Date };
    rangeDisabled?: { from?: Date; to?: Date };
  }>();
  return (
    <div className="w-96 space-y-6">
      <FormContainer formContext={form} onSuccess={() => {}} className="space-y-4">
        <FormDateRange name="range" control={form.control} label="Date Range" placeholder="Select date range" />
        <FormDateRange
          name="rangeRequired"
          control={form.control}
          label="Required Date Range"
          required
          placeholder="Select date range (required)"
        />
        <FormDateRange
          name="rangeDisabled"
          control={form.control}
          label="Disabled Date Range"
          disabled={disabled}
          placeholder="Select date range"
        />
        <div className="flex gap-2">
          <Button type="submit">Submit</Button>
          <Button type="button" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="button" onClick={() => setDisabled(!disabled)}>
            Toggle Disabled
          </Button>
        </div>
      </FormContainer>
    </div>
  );
}

export function FormNumberTextareaDemo() {
  const form = useForm<{ qty: number; qty2: number; notes: string }>();
  return (
    <FormContainer formContext={form} onSuccess={() => {}} className="w-96 space-y-3">
      <FormNumber name="qty" control={form.control} label="Quantity" required placeholder="Enter quantity " />
      <FormNumber
        name="qty2"
        control={form.control}
        min={-10}
        max={10}
        label="Quantity allow negative"
        required
        placeholder="Enter quantity allow negative"
      />

      <FormTextarea name="notes" label="Notes" />
    </FormContainer>
  );
}

export function FormWithValidationDemo() {
  const [disabled, setDisabled] = useState(false);
  const schema = z.object({
    email: z.string(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    age: z.string().transform(Number).pipe(z.number().min(18, 'Must be at least 18 years old').transform(Number)),
    notes: z.string().optional(),
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    defaultValues: { email: '', password: '', age: 18, notes: 'Test notes' },
  });

  return (
    <FormContainer formContext={form} onSuccess={() => {}} className="w-96 space-y-3">
      <FormInput name="email" label="Email" required disabled={disabled} />
      <FormInput name="password" label="Password" type="password" required disabled={disabled} />
      <FormNumber name="age" control={form.control} label="Age" disabled={disabled} />
      <FormTextarea name="notes" label="Notes" disabled={disabled} rows={4} />
      <div className="flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle Disabled
        </Button>
      </div>
      <p className="text-muted text-xs">Try submitting with invalid data to see validation</p>
    </FormContainer>
  );
}

export function FormComboboxDemo() {
  const form = useForm<{ country: string }>();
  const [disabled, setDisabled] = useState(false);
  const countries: { id: string; name: string }[] = [
    { id: 'us', name: 'United States' },
    { id: 'uk', name: 'United Kingdom' },
    { id: 'ca', name: 'Canada' },
    { id: 'au', name: 'Australia' },
    { id: 'de', name: 'Germany' },
  ];

  return (
    <FormContainer formContext={form} onSuccess={() => {}} className="w-96">
      <FormCombobox
        name="country"
        control={form.control}
        label="Country"
        options={countries}
        getOptionLabel={(o) => o.name}
        getOptionValue={(o) => o.id}
        placeholder="Search country..."
        disabled={disabled}
      />
      <div className="mt-4 flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle Disabled
        </Button>
      </div>
    </FormContainer>
  );
}

export function FormMultiComboboxDemo() {
  const [disabled, setDisabled] = useState(false);
  const form = useForm<{ skills: string[] }>({ defaultValues: { skills: [] } });
  const skills = [
    { id: 'js', name: 'JavaScript' },
    { id: 'ts', name: 'TypeScript' },
    { id: 'react', name: 'React' },
    { id: 'vue', name: 'Vue' },
    { id: 'angular', name: 'Angular' },
    { id: 'node', name: 'Node.js' },
  ];

  return (
    <FormContainer formContext={form} onSuccess={() => {}} className="w-96">
      <FormMultiCombobox
        name="skills"
        control={form.control}
        label="Skills (Multi-select)"
        options={skills}
        getOptionLabel={(o) => o.name}
        getOptionValue={(o) => o.id}
        placeholder="Select skills..."
        disabled={disabled}
      />
      <div className="mt-4 flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle Disabled
        </Button>
      </div>
    </FormContainer>
  );
}

export function FormComboboxAsyncDemo() {
  const form = useForm<{ userId: string }>();
  const [disabled, setDisabled] = useState(false);
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.append('userTypes', 'DoctorUser');
  return (
    <FormContainer formContext={form} onSuccess={() => {}} className="w-96">
      <FormCombobox
        name="userId"
        control={form.control}
        label="User (Async with Infinite Scroll)"
        options={LookupHandler.users.request}
        getOptionLabel={(o) => o?.name ?? ''}
        getOptionValue={(o) => o?.id ?? ''}
        placeholder="Search users..."
        disabled={disabled}
        urlSearchParams={urlSearchParams}
      />
      <div className="mt-4 flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle Disabled
        </Button>
      </div>
    </FormContainer>
  );
}

export function FormMultiComboboxAsyncDemo() {
  const form = useForm<{ userIds: string[] }>({ defaultValues: { userIds: [] } });
  const [disabled, setDisabled] = useState(false);
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.append('userTypes', 'DoctorUser');
  return (
    <FormContainer formContext={form} onSuccess={() => {}} className="w-96">
      <FormMultiCombobox
        name="userIds"
        control={form.control}
        label="Users (Async Multi-select with Infinite Scroll)"
        options={LookupHandler.users.request}
        getOptionLabel={(o) => o?.name ?? ''}
        getOptionValue={(o) => o?.id ?? ''}
        placeholder="Search and select users..."
        disabled={disabled}
        urlSearchParams={urlSearchParams}
        valueType="flat"
      />
      <div className="mt-4 flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle Disabled
        </Button>
      </div>
    </FormContainer>
  );
}

export function FormFileUploaderDemo() {
  const singleForm = useForm<{ document: File | null }>();
  const singleDownloadForm = useForm<{ contract: File | null }>();
  const multiListForm = useForm<{ attachments: File[] }>({ defaultValues: { attachments: [] } });
  const multiChipsForm = useForm<{ tags: File[] }>({ defaultValues: { tags: [] } });
  const previewForm = useForm<{ avatar: File | null }>();
  const previewListForm = useForm<{ avatars: File | null }>();
  const disabledForm = useForm<{ locked: File | null }>();
  const [isUploading, setIsUploading] = useState(false);
  const uploadingForm = useForm<{ uploading: File | null }>();

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Single file upload */}
      <FormContainer formContext={singleForm} onSuccess={() => {}} className="w-96">
        <FormFileUploader
          name="document"
          control={singleForm.control}
          label="Single File"
          accept=".pdf,.doc,.docx"
          placeholder="Pick a document"
        />
        <Button type="submit" className="mt-2">
          Submit
        </Button>
      </FormContainer>

      {/* Single file + download action */}
      <FormContainer formContext={singleDownloadForm} onSuccess={() => {}} className="w-96">
        <FormFileUploader
          name="contract"
          control={singleDownloadForm.control}
          label="Single File + Download"
          accept=".pdf"
          placeholder="Pick a contract"
          onDownload={() => alert('Download clicked')}
        />
        <Button type="submit" className="mt-2">
          Submit
        </Button>
      </FormContainer>

      {/* Multi file upload — list variant */}
      <FormContainer formContext={multiListForm} onSuccess={() => {}} className="w-96">
        <FormFileUploader
          name="attachments"
          control={multiListForm.control}
          label="Multi File (List)"
          accept=".pdf,.doc,.docx,.txt"
          multiple
          listVariant="list"
          placeholder="Add attachments"
        />
        <Button type="submit" className="mt-2">
          Submit
        </Button>
      </FormContainer>

      {/* Multi file upload — chips variant */}
      <FormContainer formContext={multiChipsForm} onSuccess={() => {}} className="w-96">
        <FormFileUploader
          name="tags"
          control={multiChipsForm.control}
          label="Multi File (Chips)"
          accept="*"
          multiple
          listVariant="chips"
          placeholder="Add files"
        />
        <Button type="submit" className="mt-2">
          Submit
        </Button>
      </FormContainer>

      {/* Image preview */}
      <FormContainer formContext={previewForm} onSuccess={() => {}} className="w-96">
        <FormFileUploader
          name="avatar"
          control={previewForm.control}
          label="Image with Preview"
          accept="image/*"
          showPreview
          placeholder="Pick an image"
        />
        <Button type="submit" className="mt-2">
          Submit
        </Button>
      </FormContainer>

      {/* Image list preview */}
      <FormContainer formContext={previewListForm} onSuccess={() => {}} className="w-96">
        <FormFileUploader
          name="avatars"
          control={previewListForm.control}
          label="Images with Preview"
          accept="image/*"
          showPreview
          multiple
          placeholder="Pick image(s)"
        />
        <Button type="submit" className="mt-2">
          Submit
        </Button>
      </FormContainer>

      {/* Disabled state */}
      <FormContainer formContext={disabledForm} onSuccess={() => {}} className="w-96">
        <FormFileUploader
          name="locked"
          control={disabledForm.control}
          label="Disabled"
          accept=".pdf"
          disabled
          placeholder="Cannot upload"
        />
      </FormContainer>

      {/* Uploading state */}
      <FormContainer formContext={uploadingForm} onSuccess={() => {}} className="w-96">
        <FormFileUploader
          name="uploading"
          control={uploadingForm.control}
          label="Uploading State"
          accept=".*"
          isUploading={isUploading}
          placeholder="Pick a file then simulate"
        />
        <Button type="button" className="mt-2" onClick={simulateUpload}>
          Simulate Upload
        </Button>
      </FormContainer>
    </div>
  );
}

export { FormFileUploaderDemo as FormUploadFileDemo };

export function ConfirmDialogDemo() {
  const [open, setOpen] = useState(false);

  // Emulate programmatic trigger for the dual mode Confirm-Dialog
  const onSubmit = () => {
    setTimeout(() => setOpen(true), 1000);
  };

  // Async onConfirm — auto-shows spinner, Doesn't auto-close on reject (Must return a Promise for the auto-spinner and auto-close to work)
  const onConfirm = () => new Promise<void>((_resolve, reject) => setTimeout(reject, 2000));

  // Async onConfirm — auto-shows spinner, auto-closes on resolve (Must return a Promise for the auto-spinner and auto-close to work)
  const onDelete = () => new Promise<void>((resolve) => setTimeout(resolve, 2000));

  return (
    <div className="flex flex-wrap gap-2">
      {/* Uncontrolled + async onConfirm */}
      <ConfirmDialog
        variant="success"
        title="Confirm Change"
        description="Are you sure you want to make this change? This action cannot be undone."
        onConfirm={onConfirm}
      >
        <TooltipButton title="Confirm" variant="outline-success" size="icon">
          <Check size={18} />
        </TooltipButton>
      </ConfirmDialog>

      {/* Uncontrolled + async onConfirm */}
      <ConfirmDialog
        variant="destructive"
        title="Delete Admin"
        description="Are you sure you want to delete this admin? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={onDelete}
      >
        <TooltipButton title="Delete" variant="outline-destructive" size="icon">
          <Trash2 size={18} />
        </TooltipButton>
      </ConfirmDialog>

      <TooltipButton onClick={onSubmit}>Submit Form</TooltipButton>

      {/* Controlled + custom actions */}
      <ConfirmDialog
        className="md:min-w-112.5"
        open={open}
        onOpenChange={setOpen}
        variant="warning"
        title="Warning: Forbidden CIF Detected"
        description={
          <>
            <span className="block">Forbidden CIF</span>

            <span>Please review before you confirm</span>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <span className="text-foreground leading-none">Exceptional?</span>
          </label>
        </div>
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button onClick={() => console.info('Register emitted')} disabled={false}>
            Register
          </Button>
        </>
      </ConfirmDialog>

      {/* Success variant */}
      <ConfirmDialog variant="success" title="Operation Successful" description="Your changes have been saved." confirmLabel="OK">
        <Button variant="success">Success</Button>
      </ConfirmDialog>

      {/* Info variant */}
      <ConfirmDialog variant="info" title="Information" description="This is an informational message." confirmLabel="Got it">
        <Button variant="outline">Info</Button>
      </ConfirmDialog>

      {/* Not Auto Closes on Confirm */}
      <ConfirmDialog
        variant="info"
        title="Not Auto Closes on Confirm"
        description="Don't Close on Confirm by passing loading prop as well as not returning a Promise from the onConfirm which indicate this is sync operation"
        confirmLabel="Keep Open"
        loading={false}
        onConfirm={() => console.info('OK')}
      >
        <Button variant="outline">Don't Close on Confirm</Button>
      </ConfirmDialog>

      {/* Auto Closes on Confirm */}
      <ConfirmDialog
        variant="info"
        title="Auto Close on Confirm"
        description="Close on Confirm don't pass loading prop"
        confirmLabel="Close on Confirm"
        onConfirm={() => console.info('OK')}
      >
        <Button variant="outline">Close on Confirm</Button>
      </ConfirmDialog>

      {/* Loading variant */}
      <ConfirmDialog variant="warning" title="External Loading" description="This is an async external loading action." loading>
        <Button variant="secondary">External Loading</Button>
      </ConfirmDialog>

      {/* Dismissable variant by default (false) */}
      <ConfirmDialog
        variant="warning"
        title="Dismissable"
        description="This is a dismissable via espace-key or backdrop example."
        dismissible={true}
      >
        <Button variant="muted">Dismissable</Button>
      </ConfirmDialog>
    </div>
  );
}

export function DateNavigationDemo() {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const handlePrevious = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    setCurrentDate(date.toISOString().split('T')[0]);
  };
  const handleNext = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    setCurrentDate(date.toISOString().split('T')[0]);
  };
  return <DateNavigation date={currentDate} onSetDate={setCurrentDate} handlePrevious={handlePrevious} handleNext={handleNext} />;
}

export function FacetedFilterDemo() {
  const form = useForm({ defaultValues: { status: [], search: '', date: null, dateRange: null } });
  return (
    <FormContainer formContext={form} onSuccess={() => {}}>
      <div className="space-y-4">
        <FacetedFilter name="search" title="Text Search" control={form.control} filterVariant="text" />
        <FacetedFilter
          name="status"
          title="Select"
          control={form.control}
          filterVariant="select"
          filterOptions={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]}
        />
        <FacetedFilter
          name="status"
          title="Multi-Select"
          control={form.control}
          filterVariant="multi-select"
          filterOptions={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Pending', value: 'pending' },
          ]}
        />
        <FacetedFilter name="date" title="Date" control={form.control} filterVariant="date" />
        <FacetedFilter name="dateRange" title="Date Range" control={form.control} filterVariant="date-range" />
      </div>
    </FormContainer>
  );
}

export function PrimeDialogDemo() {
  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openView, setOpenView] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <PrimeDialog dialogMode="Create" open={openCreate} onOpenChange={setOpenCreate}>
        <PrimeDialog.Trigger asChild>
          <Button variant="secondary">Create Mode</Button>
        </PrimeDialog.Trigger>

        <PrimeDialog.Panel>
          <PrimeDialog.Header>
            <PrimeDialog.Title>User</PrimeDialog.Title>

            <PrimeDialog.Description>User Description</PrimeDialog.Description>
          </PrimeDialog.Header>

          <PrimeDialog.Content>Create mode dialog content</PrimeDialog.Content>

          <PrimeDialog.Actions />
        </PrimeDialog.Panel>
      </PrimeDialog>

      <PrimeDialog dialogMode="Update" open={openUpdate} onOpenChange={setOpenUpdate}>
        <PrimeDialog.Trigger asChild>
          <Button variant="secondary">Update Mode</Button>
        </PrimeDialog.Trigger>

        <PrimeDialog.Panel>
          <PrimeDialog.Header>
            <PrimeDialog.Title>User</PrimeDialog.Title>
          </PrimeDialog.Header>

          <PrimeDialog.Content>Update mode dialog content</PrimeDialog.Content>

          <PrimeDialog.Actions />
        </PrimeDialog.Panel>
      </PrimeDialog>

      <PrimeDialog dialogMode="View" open={openView} onOpenChange={setOpenView}>
        <PrimeDialog.Trigger asChild>
          <Button variant="secondary">View Mode</Button>
        </PrimeDialog.Trigger>

        <PrimeDialog.Panel>
          <PrimeDialog.Header>
            <PrimeDialog.Title>User</PrimeDialog.Title>
          </PrimeDialog.Header>

          <PrimeDialog.Content>View mode dialog content (submit button hidden)</PrimeDialog.Content>

          <PrimeDialog.Actions />
        </PrimeDialog.Panel>
      </PrimeDialog>

      <PrimeDialog>
        <PrimeDialog.Trigger asChild>
          <Button variant="secondary">Dismissable Dialog</Button>
        </PrimeDialog.Trigger>

        <PrimeDialog.Panel dismissible>
          <PrimeDialog.Header>
            <PrimeDialog.Title>Dialog can be dismissed</PrimeDialog.Title>
          </PrimeDialog.Header>

          <PrimeDialog.Content>
            Click on the backdrop Or press Escape-Key to close the Dialog (Default is not dismissable)
          </PrimeDialog.Content>

          <PrimeDialog.Actions />
        </PrimeDialog.Panel>
      </PrimeDialog>

      <PrimeDialog>
        <PrimeDialog.Trigger asChild>
          <Button variant="secondary">Prime Dialog With no Actions</Button>
        </PrimeDialog.Trigger>

        <PrimeDialog.Panel dismissible>
          <PrimeDialog.Header>
            <PrimeDialog.Title>Dialog with no Actions</PrimeDialog.Title>
          </PrimeDialog.Header>

          <PrimeDialog.Content>This Dialog doesn't contain the actions/footer</PrimeDialog.Content>
        </PrimeDialog.Panel>
      </PrimeDialog>
    </div>
  );
}

export function ToastDemo() {
  const { toast } = useToast();

  const showDefaultToast = () => {
    toast({
      title: 'Default Toast',
      description: 'This is a default toast notification.',
      variant: 'default',
    });
  };

  const showSuccessToast = () => {
    toast({
      title: 'Toast Info',
      description: 'Operation completed successfully.',
      variant: 'success',
    });
  };

  const showErrorToast = () => {
    toast({
      title: 'Toast Error',
      description: 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  };

  const showWarningToast = () => {
    toast({
      title: 'Toast Warning',
      description: 'This action is irreversible. Please proceed with caution.',
      variant: 'warning',
    });
  };

  const showInfoToast = () => {
    toast({
      title: 'Toast Info',
      description: 'Your session is about to expire. Please save your work.',
      variant: 'info',
    });
  };

  const showToastWithAction = () => {
    toast({
      title: 'Toast with Action & position variant',
      description: 'Your session is about to expire. Please save your work.',
      variant: 'info',
      action: (
        <Button variant="outline" size="sm" onClick={() => alert('Retrying...')}>
          Retry
        </Button>
      ),
      position: 'top-center',
    });
  };

  const showToastWithBottomPosition = () => {
    toast({
      title: 'Toast bottom position',
      description: 'Something went wrong. Please try again.',
      variant: 'destructive',
      action: <h1>Retry again!</h1>,
      position: 'bottom-end',
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={showDefaultToast}>Default</Button>
      <Button variant="success" onClick={showSuccessToast}>
        Success
      </Button>
      <Button variant="destructive" onClick={showErrorToast}>
        Destructive
      </Button>
      <Button variant="ghost" onClick={showWarningToast}>
        Warning
      </Button>
      <Button variant="outline" onClick={showInfoToast}>
        Info
      </Button>
      <Button variant="muted" onClick={showToastWithAction}>
        Action & top-center
      </Button>
      <Button variant="outline-destructive" onClick={showToastWithBottomPosition}>
        bottom-end
      </Button>
    </div>
  );
}

export function TimePickerDemo() {
  const [time, setTime] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <TimePicker step={5} name="time" value={time} onChange={(value) => setTime(value || null)} />
      <Button variant="outline" onClick={() => setTime(null)}>
        Clear
      </Button>
    </div>
  );
}

export function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Single Date Selection</p>
        <Popover>
          <Popover.Trigger asChild>
            <Button variant="outline" className="w-70 justify-start text-left font-normal">
              <CalendarIcon className="me-2 h-4 w-4" />
              {date ? date.toLocaleDateString() : 'Pick a date'}
            </Button>
          </Popover.Trigger>
          <Popover.Content className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </Popover.Content>
        </Popover>
        <Button variant="outline" size="sm" className="ms-2" onClick={() => setDate(undefined)}>
          Clear
        </Button>
      </div>
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Date Range Selection</p>
        <Popover>
          <Popover.Trigger asChild>
            <Button variant="outline" className="w-70 justify-start text-left font-normal">
              <CalendarIcon className="me-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </>
                ) : (
                  dateRange.from.toLocaleDateString()
                )
              ) : (
                'Pick a date range'
              )}
            </Button>
          </Popover.Trigger>
          <Popover.Content className="w-auto p-0">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              initialFocus
            />
          </Popover.Content>
        </Popover>
        <Button variant="outline" size="sm" className="ms-2" onClick={() => setDateRange(undefined)}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export function FormTimePickerDemo() {
  const form = useForm<{ time: string }>();
  const [disabled, setDisabled] = useState(false);
  return (
    <FormContainer formContext={form} onSuccess={() => {}}>
      <FormTimePicker name="time" step={5} control={form.control} label="Time" disabled={disabled} />
      <div className="mt-4 flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle Disabled
        </Button>
      </div>
    </FormContainer>
  );
}

export function RadioGroupDemo() {
  const [value, setValue] = useState('option1');
  return (
    <div className="w-80 space-y-4">
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Default</p>
        <RadioGroup value={value} onValueChange={setValue}>
          <RadioGroup.Item value="option1">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 1
            </span>
            <RadioGroup.Indicator>
              <CircleCheck className="text-secondary hidden group-data-[state=checked]/radio-item:block" />
              <Circle size={24} strokeWidth={1.5} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
          <RadioGroup.Item value="option2">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 2
            </span>
            <RadioGroup.Indicator>
              <CircleCheck className="text-secondary hidden group-data-[state=checked]/radio-item:block" />
              <Circle size={24} strokeWidth={1.5} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
        </RadioGroup>
      </div>
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Default Row</p>
        <RadioGroup className="grid-cols-2" value={value} onValueChange={setValue}>
          <RadioGroup.Item value="option1">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 1
            </span>
            <RadioGroup.Indicator>
              <CircleCheck className="text-secondary hidden group-data-[state=checked]/radio-item:block" />
              <Circle size={24} strokeWidth={1.5} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
          <RadioGroup.Item value="option2">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 2
            </span>
            <RadioGroup.Indicator>
              <CircleCheck className="text-secondary hidden group-data-[state=checked]/radio-item:block" />
              <Circle size={24} strokeWidth={1.5} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
        </RadioGroup>
      </div>
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Disabled</p>
        <RadioGroup defaultValue="disabled1" disabled>
          <RadioGroup.Item value="disabled1">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 group-disabled/radio-item:text-muted-300 flex flex-1 items-center text-sm font-normal">
              Checked Disabled
            </span>
            <RadioGroup.Indicator>
              <CircleCheck className="text-secondary group-disabled/radio-item:text-muted-400 hidden group-data-[state=checked]/radio-item:block" />
              <Circle size={24} strokeWidth={1.5} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
          <RadioGroup.Item value="disabled2">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 group-disabled/radio-item:text-muted-300 flex flex-1 items-center text-sm font-normal">
              Unchecked Disabled
            </span>
            <RadioGroup.Indicator>
              <CircleCheck className="text-secondary group-disabled/radio-item:text-muted-400 hidden group-data-[state=checked]/radio-item:block" />
              <Circle size={24} strokeWidth={1.5} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
        </RadioGroup>
      </div>
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Disabled Row</p>
        <RadioGroup className="grid-cols-2" defaultValue="disabled1" disabled>
          <RadioGroup.Item value="disabled1">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 group-disabled/radio-item:text-muted-300 flex flex-1 items-center text-sm font-normal">
              Checked Disabled
            </span>
            <RadioGroup.Indicator>
              <CircleCheck className="text-secondary group-disabled/radio-item:text-muted-400 hidden group-data-[state=checked]/radio-item:block" />
              <Circle size={24} strokeWidth={1.5} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
          <RadioGroup.Item value="disabled2">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 group-disabled/radio-item:text-muted-300 flex flex-1 items-center text-sm font-normal">
              Unchecked Disabled
            </span>
            <RadioGroup.Indicator>
              <CircleCheck className="text-secondary group-disabled/radio-item:text-muted-400 hidden group-data-[state=checked]/radio-item:block" />
              <Circle size={24} strokeWidth={1.5} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
        </RadioGroup>
      </div>
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Custom Icons</p>
        <RadioGroup value={value} onValueChange={setValue}>
          <RadioGroup.Item value="option1">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 1
            </span>
            <RadioGroup.Indicator>
              <Star size={20} className="hidden fill-yellow-500 text-yellow-500 group-data-[state=checked]/radio-item:block" />
              <StarOffIcon size={20} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
          <RadioGroup.Item value="option2">
            <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 2
            </span>
            <RadioGroup.Indicator>
              <Star size={20} className="hidden fill-yellow-500 text-yellow-500 group-data-[state=checked]/radio-item:block" />
              <StarOffIcon size={20} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
        </RadioGroup>
      </div>
    </div>
  );
}

export function FormRadioGroupDemo() {
  const form = useForm<{ plan: string }>({ defaultValues: { plan: 'basic' } });
  const [disabled, setDisabled] = useState(false);
  const plans = [
    { id: 'basic', name: 'Basic Plan' },
    { id: 'pro', name: 'Pro Plan' },
    { id: 'enterprise', name: 'Enterprise Plan' },
  ];

  return (
    <FormContainer formContext={form} onSuccess={() => {}} className="w-96 space-y-3">
      <FormRadioGroup
        name="plan"
        control={form.control}
        label="Select Plan"
        required
        options={plans}
        getOptionLabel={(o) => o.name}
        getOptionValue={(o) => o.id}
        disabled={disabled}
      />
      <p className="text-muted mb-2 text-xs font-medium">Default Row</p>
      <FormRadioGroup
        name="plan"
        control={form.control}
        label="Select Plan"
        required
        className="grid-cols-2"
        options={plans}
        getOptionLabel={(o) => o.name}
        getOptionValue={(o) => o.id}
        disabled={disabled}
      />
      <div className="flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle Disabled
        </Button>
      </div>
    </FormContainer>
  );
}

export function CheckboxGroupDemo() {
  const [checked1, setChecked1] = useState(true);
  const [checked2, setChecked2] = useState(false);
  return (
    <div className="w-80 space-y-4">
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Default</p>
        <CheckboxGroup>
          <CheckboxGroup.Item checked={checked1} onCheckedChange={(v) => setChecked1(!!v)}>
            <span className="text-muted group-data-[state=checked]/checkbox-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 1
            </span>
            <CheckboxGroup.Indicator>
              <CheckSquare className="text-secondary hidden group-data-[state=checked]/checkbox-item:block" />
              <Square
                size={24}
                strokeWidth={1.5}
                className="text-muted-300 block rounded group-data-[state=checked]/checkbox-item:hidden"
              />
            </CheckboxGroup.Indicator>
          </CheckboxGroup.Item>
          <CheckboxGroup.Item checked={checked2} onCheckedChange={(v) => setChecked2(!!v)}>
            <span className="text-muted group-data-[state=checked]/checkbox-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 2
            </span>
            <CheckboxGroup.Indicator>
              <CheckSquare className="text-secondary hidden group-data-[state=checked]/checkbox-item:block" />
              <Square
                size={24}
                strokeWidth={1.5}
                className="text-muted-300 block rounded group-data-[state=checked]/checkbox-item:hidden"
              />
            </CheckboxGroup.Indicator>
          </CheckboxGroup.Item>
        </CheckboxGroup>
      </div>
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Disabled</p>
        <CheckboxGroup>
          <CheckboxGroup.Item checked disabled>
            <span className="text-muted group-data-[state=checked]/checkbox-item:text-primary-900 group-disabled/checkbox-item:text-muted-300 flex flex-1 items-center text-sm font-normal">
              Checked Disabled
            </span>
            <CheckboxGroup.Indicator>
              <CheckSquare className="text-secondary group-disabled/checkbox-item:text-muted-400 hidden group-data-[state=checked]/checkbox-item:block" />
              <Square
                size={24}
                strokeWidth={1.5}
                className="text-muted-300 block rounded group-data-[state=checked]/checkbox-item:hidden"
              />
            </CheckboxGroup.Indicator>
          </CheckboxGroup.Item>
          <CheckboxGroup.Item disabled>
            <span className="text-muted group-disabled/checkbox-item:text-muted-300 flex flex-1 items-center text-sm font-normal">
              Unchecked Disabled
            </span>
            <CheckboxGroup.Indicator>
              <CheckSquare className="text-secondary group-disabled/checkbox-item:text-muted-400 hidden group-data-[state=checked]/checkbox-item:block" />
              <Square
                size={24}
                strokeWidth={1.5}
                className="text-muted-300 block rounded group-data-[state=checked]/checkbox-item:hidden"
              />
            </CheckboxGroup.Indicator>
          </CheckboxGroup.Item>
        </CheckboxGroup>
      </div>
      <div>
        <p className="text-muted mb-2 text-xs font-medium">Custom Icons</p>
        <CheckboxGroup>
          <CheckboxGroup.Item checked={checked1} onCheckedChange={(v) => setChecked1(!!v)}>
            <span className="text-muted group-data-[state=checked]/checkbox-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 1
            </span>
            <CheckboxGroup.Indicator>
              <Star size={20} className="hidden fill-yellow-500 text-yellow-500 group-data-[state=checked]/checkbox-item:block" />
              <Star size={20} className="text-muted-300 block group-data-[state=checked]/checkbox-item:hidden" />
            </CheckboxGroup.Indicator>
          </CheckboxGroup.Item>
          <CheckboxGroup.Item checked={checked2} onCheckedChange={(v) => setChecked2(!!v)}>
            <span className="text-muted group-data-[state=checked]/checkbox-item:text-primary-900 flex flex-1 items-center text-sm font-normal">
              Option 2
            </span>
            <CheckboxGroup.Indicator>
              <Star size={20} className="hidden fill-yellow-500 text-yellow-500 group-data-[state=checked]/checkbox-item:block" />
              <Star size={20} className="text-muted-300 block group-data-[state=checked]/checkbox-item:hidden" />
            </CheckboxGroup.Indicator>
          </CheckboxGroup.Item>
        </CheckboxGroup>
      </div>
    </div>
  );
}

export function FormCheckboxGroupDemo() {
  const form = useForm<{ features: string[] }>({ defaultValues: { features: ['dark-mode'] } });
  const [disabled, setDisabled] = useState(false);
  const features = [
    { id: 'dark-mode', name: 'Dark Mode' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'analytics', name: 'Analytics' },
  ];

  return (
    <FormContainer formContext={form} onSuccess={() => {}} className="w-96 space-y-3">
      <FormCheckboxGroup
        name="features"
        control={form.control}
        label="Select Features"
        required
        options={features}
        getOptionLabel={(o) => o.name}
        getOptionValue={(o) => o.id}
        disabled={disabled}
      />
      <div className="flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle Disabled
        </Button>
      </div>
    </FormContainer>
  );
}
