import React from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';

/**
 * Accessible Navigation Menu Component using Radix UI
 * Provides navigation menus with proper keyboard navigation and accessibility
 */

export const NavigationMenu = React.forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <NavigationMenuPrimitive.Root
      ref={ref}
      className={`navigation-menu relative z-10 flex max-w-max flex-1 items-center justify-center ${className}`}
      {...props}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  );
});

export const NavigationMenuList = React.forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <NavigationMenuPrimitive.List
      ref={ref}
      className={`navigation-menu-list group flex flex-1 list-none items-center justify-center space-x-1 ${className}`}
      {...props}
    >
      {children}
    </NavigationMenuPrimitive.List>
  );
});

export const NavigationMenuItem = NavigationMenuPrimitive.Item;

export const NavigationMenuTrigger = React.forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={`
        navigation-menu-trigger group inline-flex h-10 w-max items-center justify-center rounded-md
        bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900
        focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50
        data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 ${className}
      `}
      {...props}
    >
      {children}
      <svg
        className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </NavigationMenuPrimitive.Trigger>
  );
});

export const NavigationMenuContent = React.forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <NavigationMenuPrimitive.Content
      ref={ref}
      className={`
        navigation-menu-content left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out
        data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52
        data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52
        data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ${className}
      `}
      {...props}
    >
      {children}
    </NavigationMenuPrimitive.Content>
  );
});

export const NavigationMenuLink = React.forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <NavigationMenuPrimitive.Link
      ref={ref}
      className={`
        navigation-menu-link group inline-flex h-10 w-max items-center justify-center rounded-md
        bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900
        focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50
        data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 ${className}
      `}
      {...props}
    >
      {children}
    </NavigationMenuPrimitive.Link>
  );
});

export const NavigationMenuViewport = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="absolute left-0 top-full flex justify-center">
      <NavigationMenuPrimitive.Viewport
        ref={ref}
        className={`
          navigation-menu-viewport origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)]
          w-full overflow-hidden rounded-md border bg-white text-gray-950 shadow-lg
          data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95
          data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)] ${className}
        `}
        {...props}
      />
    </div>
  );
});

export const NavigationMenuIndicator = React.forwardRef(({ 
  className = '',
  ...props 
}, ref) => {
  return (
    <NavigationMenuPrimitive.Indicator
      ref={ref}
      className={`
        navigation-menu-indicator top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden
        data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out
        data-[state=visible]:fade-in ${className}
      `}
      {...props}
    >
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-gray-200 shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
});

// Convenience component for list items
export const NavigationMenuListItem = React.forwardRef(({ 
  className = '',
  title,
  children,
  href,
  ...props 
}, ref) => {
  return (
    <li>
      <NavigationMenuPrimitive.Link asChild>
        <a
          ref={ref}
          className={`
            block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none
            transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 ${className}
          `}
          href={href}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-600">
            {children}
          </p>
        </a>
      </NavigationMenuPrimitive.Link>
    </li>
  );
});

// Main navigation component for e-commerce
export const MainNavigation = ({ 
  categories = [],
  onCategoryClick,
  currentPath = '',
}) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* Home */}
        <NavigationMenuItem>
          <NavigationMenuLink 
            href="/"
            className={currentPath === '/' ? 'bg-gray-100' : ''}
          >
            Home
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Products with categories */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <div className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-blue-500/50 to-blue-700 p-6 no-underline outline-none focus:shadow-md"
                    href="/products"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium text-white">
                      All Products
                    </div>
                    <p className="text-sm leading-tight text-blue-100">
                      Browse our complete collection of products
                    </p>
                  </a>
                </NavigationMenuLink>
              </div>
              
              <ul className="grid gap-3">
                {categories.slice(0, 6).map((category) => (
                  <NavigationMenuListItem
                    key={category.id}
                    title={category.name}
                    href={`/products?category=${category.slug}`}
                    onClick={() => onCategoryClick?.(category)}
                  >
                    {category.description}
                  </NavigationMenuListItem>
                ))}
              </ul>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* About */}
        <NavigationMenuItem>
          <NavigationMenuLink 
            href="/about"
            className={currentPath === '/about' ? 'bg-gray-100' : ''}
          >
            About
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Contact */}
        <NavigationMenuItem>
          <NavigationMenuLink 
            href="/contact"
            className={currentPath === '/contact' ? 'bg-gray-100' : ''}
          >
            Contact
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default NavigationMenu;