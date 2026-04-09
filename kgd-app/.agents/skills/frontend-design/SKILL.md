---
name: frontend-design
description: Frontend design principles and UI/UX best practices for modern web applications
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: design
  stack: react, css
---

# Frontend Design Principles

## Core Design Principles

### 1. Hierarchy
- Most important elements should be visually prominent
- Use size, color, contrast, and whitespace to establish hierarchy
- Primary actions should be immediately obvious

### 2. Contrast
- Ensure text is readable (WCAG AA minimum: 4.5:1 for normal text)
- Use contrast to guide attention
- Dark mode considerations

### 3. Alignment
- Consistent alignment creates visual order
- Use grids for layouts
- Align related elements

### 4. Repetition
- Reuse styles for consistency
- Components should look the same across pages
- Brand colors, fonts, spacing

### 5. Proximity
- Related items should be grouped
- Space communicates relationships
- Don't crowd related elements

## Typography

### Font Sizing Scale
```css
/* Tailwind default scale */
text-xs: 0.75rem   /* 12px */
text-sm: 0.875rem  /* 14px */
text-base: 1rem    /* 16px */
text-lg: 1.125rem  /* 18px */
text-xl: 1.25rem   /* 20px */
text-2xl: 1.5rem   /* 24px */
text-3xl: 1.875rem /* 30px */
text-4xl: 2.25rem  /* 36px */
```

### Line Height
```css
/* Tailwind */
leading-none: 1       /* Headlines */
leading-tight: 1.25    /* Subheadings */
leading-normal: 1.5   /* Body text */
leading-relaxed: 1.75 /* Long-form content */
```

### Best Practices
- Limit to 2-3 font sizes per component
- Use relative units (rem, em) for accessibility
- Ensure sufficient line height for readability

## Color

### Color System
```css
:root {
  /* Primary palette */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  
  /* Neutral palette */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-900: #111827;
  
  /* Semantic colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### Accessibility
- Never rely on color alone (use icons + text)
- Test with color blindness simulators
- Provide high contrast mode

## Spacing

### Spacing Scale
```css
/* Tailwind scale */
space-1: 0.25rem  /* 4px */
space-2: 0.5rem   /* 8px */
space-3: 0.75rem  /* 12px */
space-4: 1rem     /* 16px */
space-6: 1.5rem   /* 24px */
space-8: 2rem     /* 32px */
space-12: 3rem    /* 48px */
space-16: 4rem    /* 64px */
```

### Common Patterns
- **Form spacing**: 16px between fields, 24px between sections
- **Card padding**: 16px mobile, 24px desktop
- **Page margins**: 16px mobile, 32px tablet, 64px desktop

## Components

### Buttons

```tsx
// Primary button
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg 
                   hover:bg-blue-700 active:bg-blue-800 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-150">
  Save Changes
</button>

// Secondary button
<button className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg 
                   hover:bg-gray-200 active:bg-gray-300
                   border border-gray-300">
  Cancel
</button>

// Ghost button
<button className="text-blue-600 px-4 py-2 rounded-lg 
                   hover:bg-blue-50 active:bg-blue-100">
  Learn More
</button>
```

### Form Inputs

```tsx
<input 
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500
             disabled:bg-gray-100 disabled:cursor-not-allowed
             placeholder:text-gray-400"
  placeholder="Enter customer name"
/>

{/* With label */}
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Customer Name
  </label>
  <input className="..." />
</div>

{/* With error */}
<div className="space-y-1">
  <label className="...">Email</label>
  <input className="border-red-500 focus:ring-red-500" />
  <p className="text-sm text-red-600">Email is required</p>
</div>
```

### Cards

```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900">Card Title</h3>
  <p className="mt-2 text-gray-600">Card content goes here.</p>
  <div className="mt-4 flex justify-end gap-3">
    <button>Cancel</button>
    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
      Action
    </button>
  </div>
</div>
```

### Tables

```tsx
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Name
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Status
      </th>
      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
        Actions
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {/* Rows */}
  </tbody>
</table>
```

### Badges/Status

```tsx
// Status badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                 bg-green-100 text-green-800">
  Active
</span>

// With dot indicator
<span className="inline-flex items-center gap-1.5">
  <span className="w-2 h-2 rounded-full bg-green-500"></span>
  <span className="text-sm text-gray-600">Online</span>
</span>
```

## Responsive Design

### Breakpoints
```css
/* Tailwind */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Common Patterns
```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>
```

## Accessibility

### ARIA Labels
```tsx
<button aria-label="Close menu">
  <XIcon />
</button>

<input 
  aria-describedby="email-hint"
  aria-invalid={hasError}
/>

<div role="alert" aria-live="polite">
  {errorMessage}
</div>
```

### Focus States
```css
/* Always style focus for keyboard navigation */
button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 2px solid blue-500;
  outline-offset: 2px;
}
```

### Screen Reader Only
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Design Checklist

- [ ] Consistent spacing throughout
- [ ] Typography hierarchy is clear
- [ ] Colors pass contrast checks
- [ ] Interactive elements have hover/focus states
- [ ] Forms have proper labels and error states
- [ ] Tables are properly aligned
- [ ] Responsive on all breakpoints
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Loading states defined
- [ ] Empty states designed
- [ ] Error states designed
