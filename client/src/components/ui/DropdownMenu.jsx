import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

/**
 * Accessible Dropdown Menu Component using Radix UI
 * Provides dropdown menus with proper keyboard navigation and accessibility
 */

export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = React.forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      className={`
        dropdown-trigger inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium
        ring-offset-white transition-colors hover:bg-gray-100 hover:text-gray-900
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50 ${className}
      `}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Trigger>
  );
});

export const DropdownMenuContent = React.forwardRef(({ 
  children,
  className = '',
  sideOffset = 4,
  align = 'center',
  ...props 
}, ref) => {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={`
          dropdown-content z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-lg
          animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2
          data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2
          data-[side=top]:slide-in-from-bottom-2 ${className}
        `}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
});

export const DropdownMenuItem = React.forwardRef(({ 
  children,
  className = '',
  inset = false,
  ...props 
}, ref) => {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={`
        dropdown-item relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm
        outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
        ${inset ? 'pl-8' : ''} ${className}
      `}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
});

export const DropdownMenuCheckboxItem = React.forwardRef(({ 
  children,
  className = '',
  checked,
  ...props 
}, ref) => {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={`
        dropdown-checkbox-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm
        outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}
      `}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

export const DropdownMenuRadioItem = React.forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={`
        dropdown-radio-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm
        outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}
      `}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="h-2 w-2 rounded-full bg-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

export const DropdownMenuLabel = React.forwardRef(({ 
  children,
  className = '',
  inset = false,
  ...props 
}, ref) => {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={`
        dropdown-label px-2 py-1.5 text-sm font-semibold text-gray-900
        ${inset ? 'pl-8' : ''} ${className}
      `}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Label>
  );
});

export const DropdownMenuSeparator = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={`dropdown-separator -mx-1 my-1 h-px bg-gray-200 ${className}`}
      {...props}
    />
  );
});

export const DropdownMenuShortcut = ({ 
  children,
  className = '',
  ...props 
}) => {
  return (
    <span
      className={`dropdown-shortcut ml-auto text-xs tracking-widest text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuSubContent = DropdownMenuPrimitive.SubContent;
export const DropdownMenuSubTrigger = DropdownMenuPrimitive.SubTrigger;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// Convenience component for user menu
export const UserMenu = ({ 
  user, 
  onProfile, 
  onSettings, 
  onLogout,
  children 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <button className="flex items-center space-x-2 rounded-full bg-gray-100 p-2 hover:bg-gray-200">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </button>
        )}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onProfile}>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onSettings}>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownMenu;