'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'cyan' | 'red' | 'green' | 'none'
  noPadding?: boolean
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, glow = 'none', noPadding, ...props }, ref) => {
    const glowMap = {
      cyan: 'shadow-[0_0_20px_rgba(0,240,255,0.12)]',
      red: 'shadow-[0_0_20px_rgba(255,59,59,0.2)]',
      green: 'shadow-[0_0_20px_rgba(0,230,118,0.12)]',
      none: '',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'glass-panel rounded-lg',
          !noPadding && 'p-4',
          glowMap[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'
export default GlassCard
