---
name: tailwind-best-practices
description: Tailwind CSS 4 best practices - class organization, component patterns, and performance optimization
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: css
  stack: tailwindcss
---

# Tailwind CSS Best Practices

## Class Organization

### The Structure
Order classes logically (Tailwind's Prettier plugin handles this):

```html
<!-- 1. Layout -->
<div className="relative flex items-center justify-between">

<!-- 2. Spacing -->
<div className="p-4 m-2 space-y-4">

<!-- 3. Typography -->
<p className="text-lg font-semibold text-gray-900 uppercase tracking-wide">

<!-- 4. Colors & Backgrounds -->
<div className="bg-white border border-gray-200 rounded-xl shadow-sm">

<!-- 5. Interactive (state) -->
<button className="hover:bg-blue-600 focus:ring-2 
                   active:scale-95 disabled:opacity-50">

<!-- 6. Effects & Animation -->
<div className="transition-all duration-200 animate-pulse">
```

### Component Extraction

```tsx
// ❌ Repeated inline classes
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  Save
</button>
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  Submit
</button>

// ✅ Extract to component
function Button({ children, variant = 'primary' }) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  
  return (
    <button className={`${variants[variant]} 
      px-4 py-2 rounded-lg transition-colors duration-150`}>
      {children}
    </button>
  )
}

// Usage
<Button>Save</Button>
<Button variant="secondary">Cancel</Button>
```

### Arbitrary Values (use sparingly)

```tsx
// ✅ Fine for one-off values
<div className="top-[17rem] w-[calc(100%-2rem)]">
  Custom positioning
</div>

// ❌ Avoid overusing - hard to maintain
<div className="text-[15px] leading-[1.6] tracking-[0.02em]">
  Hard to read
</div>

// ✅ Better: add to config
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      fontSize: {
        '15': '15px',
      },
      lineHeight: {
        '17': '1.6',
      }
    }
  }
}
```

## Common Patterns

### Responsive Design

```tsx
// Mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
```

### Cards

```tsx
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 
                     shadow-sm p-6 ${className}`}>
      {children}
    </div>
  )
}

// Variant: hover effect
export function HoverCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 
                     shadow-sm p-6 
                     transition-all duration-200 
                     hover:shadow-md hover:-translate-y-0.5 
                     ${className}`}>
      {children}
    </div>
  )
}
```

### Forms

```tsx
export function Input({ 
  label, 
  error, 
  className = '' 
}: { 
  label: string
  error?: string
  className?: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        className={`w-full px-3 py-2 border rounded-lg 
                     transition-colors duration-150
                     placeholder:text-gray-400
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     ${error 
                       ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                       : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                     }
                     focus:ring-2 focus:outline-none
                     ${className}`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

### Navigation

```tsx
export function NavLink({ href, children }: { href: string, children: ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href
  
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm font-medium 
                  transition-colors duration-150
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
    >
      {children}
    </Link>
  )
}
```

### Tables

```tsx
export function Table({ 
  columns, 
  data 
}: { 
  columns: { key: string, label: string }[]
  data: Record<string, any>[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th 
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium 
                           text-gray-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Badges/Status

```tsx
export function Badge({ 
  variant = 'default', 
  children 
}: { 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: ReactNode
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 
                      rounded-full text-xs font-medium
                      ${variants[variant]}`}>
      {children}
    </span>
  )
}
```

### Modal/Dialog

```tsx
'use client'
import { useEffect } from 'react'

export function Modal({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          {children}
        </div>
      </div>
    </div>
  )
}
```

## Dark Mode

### Class-based Dark Mode

```tsx
// tailwind.config.ts
module.exports = {
  darkMode: 'class',
}

// Component
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content
</div>

// Toggle button
<button 
  onClick={() => document.documentElement.classList.toggle('dark')}
  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
>
  Toggle
</button>
```

### Best Practices

```tsx
// ✅ Semantic colors
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
  <p className="text-gray-500 dark:text-gray-400">Muted</p>
</div>

// ❌ Direct color values
<div className="bg-white dark:bg-[#111827]">
  <p className="text-[#111827] dark:text-white">Not semantic</p>
</div>
```

## Configuration

### Theme Extension

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Custom colors
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },
      
      // Custom spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

## Performance Tips

### Reduce CSS Size

```bash
# Purge unused styles (automatic with content paths)
# tailwind.config.ts
{
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
}

# DON'T use @apply for everything
// ❌ Creates duplicate styles
.button {
  @apply bg-blue-600 text-white px-4 py-2;
}

// ✅ Direct classes are better
<button className="bg-blue-600 text-white px-4 py-2">
  Button
</button>
```

### Using @apply Wisely

```css
/* ✅ Good for repeated utility patterns */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg 
         hover:bg-blue-700 transition-colors duration-150;
}

/* ❌ Overusing @apply defeats Tailwind's purpose */
/* Use direct classes for one-off styling */
```

## Checklist

- [ ] Classes are properly organized (Prettier plugin)
- [ ] Repeated patterns extracted to components
- [ ] Semantic naming (not generic)
- [ ] Dark mode considered
- [ ] Responsive breakpoints consistent
- [ ] Arbitrary values used sparingly
- [ ] Custom values in config when needed
- [ ] Animation classes used correctly
- [ ] Accessibility considered (focus states, etc.)
