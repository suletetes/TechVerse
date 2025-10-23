import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SelectPrimitive from '@radix-ui/react-select';

/**
 * Accessible Form Control Components using Radix UI
 * Provides form controls with proper accessibility and keyboard navigation
 */

// Checkbox Component
export const Checkbox = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={`
        checkbox peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white
        data-[state=checked]:border-blue-600 ${className}
      `}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

// Radio Group Components
export const RadioGroup = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={`radio-group grid gap-2 ${className}`}
      {...props}
    />
  );
});

export const RadioGroupItem = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={`
        radio-item aspect-square h-4 w-4 rounded-full border border-gray-300 text-blue-600
        ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}
      `}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

// Switch Component
export const Switch = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={`
        switch peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50
        data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200 ${className}
      `}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className="
          pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform
          data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0
        "
      />
    </SwitchPrimitive.Root>
  );
});

// Slider Component
export const Slider = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={`
        slider relative flex w-full touch-none select-none items-center ${className}
      `}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
        <SliderPrimitive.Range className="absolute h-full bg-blue-600" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="
          block h-5 w-5 rounded-full border-2 border-blue-600 bg-white ring-offset-white transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          disabled:pointer-events-none disabled:opacity-50
        "
      />
    </SliderPrimitive.Root>
  );
});

// Select Components
export const Select = SelectPrimitive.Root;

export const SelectTrigger = React.forwardRef(({ 
  className = '',
  children,
  ...props 
}, ref) => {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={`
        select-trigger flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2
        text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
        focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}
      `}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectValue = SelectPrimitive.Value;

export const SelectContent = React.forwardRef(({ 
  className = '',
  children,
  position = 'popper',
  ...props 
}, ref) => {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={`
          select-content relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md
          data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
          data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
          data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
          ${position === 'popper' ? 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1' : ''}
          ${className}
        `}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={`
            p-1 ${position === 'popper' ? 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]' : ''}
          `}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = React.forwardRef(({ 
  className = '',
  children,
  ...props 
}, ref) => {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={`
        select-item relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm
        outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}
      `}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export const SelectLabel = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={`select-label py-1.5 pl-8 pr-2 text-sm font-semibold ${className}`}
      {...props}
    />
  );
});

export const SelectSeparator = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={`select-separator -mx-1 my-1 h-px bg-gray-200 ${className}`}
      {...props}
    />
  );
});

// Convenience components for common patterns
export const FormCheckbox = ({ 
  id,
  label,
  description,
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className={`form-checkbox-group ${className}`}>
      <div className="flex items-center space-x-2">
        <Checkbox id={id} {...props} />
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      </div>
      {description && (
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export const FormRadioGroup = ({ 
  label,
  description,
  error,
  options = [],
  className = '',
  ...props 
}) => {
  return (
    <div className={`form-radio-group ${className}`}>
      {label && (
        <label className="text-sm font-medium leading-none mb-3 block">
          {label}
        </label>
      )}
      <RadioGroup {...props}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={option.value} />
            <label
              htmlFor={option.value}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option.label}
            </label>
          </div>
        ))}
      </RadioGroup>
      {description && (
        <p className="text-sm text-gray-600 mt-2">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
};

export const FormSwitch = ({ 
  id,
  label,
  description,
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className={`form-switch-group ${className}`}>
      <div className="flex items-center space-x-2">
        <Switch id={id} {...props} />
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      </div>
      {description && (
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default {
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Slider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  FormCheckbox,
  FormRadioGroup,
  FormSwitch,
};