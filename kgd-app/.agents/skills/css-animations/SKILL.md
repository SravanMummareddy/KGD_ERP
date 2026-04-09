---
name: css-animations
description: CSS animations and transitions best practices for smooth, performant web animations
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: design
  stack: css, react
---

# CSS Animations & Transitions

## Performance Principles

### Use Transform and Opacity
Only animate properties that don't trigger layout recalculations:

```css
/* ✅ GPU-accelerated - animate these */
transform: translateX(), translateY(), scale(), rotate()
opacity

/* ⚠️ Composite layers - animate with caution */
filter: blur(), drop-shadow()

/* ❌ Triggers layout - avoid animating */
width, height, margin, padding
top, left, right, bottom
font-size
```

### Enable GPU Acceleration
```css
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force compositing layer */
}
```

### Performance Checklist
- [ ] Use `transform` and `opacity` for animations
- [ ] Avoid animating layout properties
- [ ] Use `will-change` sparingly (adds overhead)
- [ ] Test on low-end devices
- [ ] Reduce motion for accessibility

## Transitions

### Basic Syntax
```css
.element {
  transition: property duration timing-function delay;
  
  /* Or individual */
  transition-property: background-color, transform;
  transition-duration: 200ms;
  transition-timing-function: ease-out;
  transition-delay: 0ms;
}
```

### Common Durations
```css
micro-interactions: 100-150ms
standard transitions: 200-300ms
large/major changes: 300-500ms
page transitions: 400-800ms
```

### Timing Functions
```css
ease          /* Quick start, slow end (default) */
ease-in       /* Slow start, fast end */
ease-out      /* Fast start, slow end */
ease-in-out   /* Slow start and end */
linear        /* Constant speed (avoid - looks unnatural) */

/* Custom cubic-bezier */
ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)
ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1)
spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

### Common Patterns

```css
/* Button hover */
.button {
  transition: background-color 150ms ease, 
              transform 150ms ease,
              box-shadow 150ms ease;
}

.button:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.button:active {
  transform: translateY(0);
}

/* Input focus */
.input {
  transition: border-color 150ms ease, 
              box-shadow 150ms ease;
}

.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Fade in/out */
.fade-enter {
  opacity: 0;
}

.fade-enter-active {
  opacity: 1;
  transition: opacity 200ms ease-out;
}

.fade-exit {
  opacity: 1;
}

.fade-exit-active {
  opacity: 0;
  transition: opacity 150ms ease-in;
}
```

## Keyframe Animations

### Basic Syntax
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.element {
  animation: slideIn 300ms ease-out;
}
```

### Animation Properties
```css
.element {
  animation-name: slideIn;
  animation-duration: 300ms;
  animation-timing-function: ease-out;
  animation-delay: 0ms;
  animation-iteration-count: 1;
  animation-direction: normal;
  animation-fill-mode: both; /* Keeps end state */
  animation-play-state: running;
}
```

### Shorthand
```css
.element {
  animation: slideIn 300ms ease-out 0ms 1 normal both;
}
```

## React Animation Patterns

### Tailwind + Framer Motion

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'

// Simple fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Slide up on mount
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
>
  Card content
</motion.div>

// List stagger
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.div variants={container} initial="hidden" animate="show">
  {[1, 2, 3].map(i => (
    <motion.div key={i} variants={item}>Item {i}</motion.div>
  ))}
</motion.div>

// Exit animation
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### Loading Spinner

```tsx
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  )
}
```

### Skeleton Loader

```tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  )
}

// Usage
<div className="space-y-4">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-32 w-full" />
</div>
```

## Micro-interactions

### Button Press
```css
.button {
  transition: transform 100ms ease;
}

.button:active {
  transform: scale(0.97);
}
```

### Card Hover
```css
.card {
  transition: transform 200ms ease, 
              box-shadow 200ms ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
```

### Toggle Switch
```css
.toggle {
  transition: background-color 200ms ease;
}

.toggle[data-checked="true"] {
  background-color: #3b82f6;
}

.toggle-knob {
  transition: transform 200ms ease;
}

.toggle[data-checked="true"] .toggle-knob {
  transform: translateX(100%);
}
```

### Tooltip
```css
.tooltip {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 150ms ease, 
              transform 150ms ease;
  pointer-events: none;
}

.tooltip-trigger:hover .tooltip {
  opacity: 1;
  transform: translateY(0);
}
```

### Staggered Entrance
```css
.list-item {
  opacity: 0;
  transform: translateY(10px);
  animation: staggerIn 300ms ease forwards;
}

.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
.list-item:nth-child(4) { animation-delay: 150ms; }
.list-item:nth-child(5) { animation-delay: 200ms; }

@keyframes staggerIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Accessibility

### prefers-reduced-motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### React/Framer Motion
```tsx
import { useReducedMotion } from 'framer-motion'

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: shouldReduceMotion ? 0 : 0.3 
      }}
    >
      Content
    </motion.div>
  )
}
```

### Tailwind
```css
@media (prefers-reduced-motion: reduce) {
  .animate-spin,
  .animate-pulse,
  .animate-bounce {
    animation: none;
  }
}
```

## Animation Checklist

- [ ] Animations serve a purpose (feedback, guidance, delight)
- [ ] Duration is appropriate (not too fast/slow)
- [ ] Easing is natural
- [ ] Performance is optimized (transform/opacity only)
- [ ] Respects `prefers-reduced-motion`
- [ ] Works without animation (graceful degradation)
- [ ] Tested on low-end devices
- [ ] No motion sickness triggers (no large movements)
