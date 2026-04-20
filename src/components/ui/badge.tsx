import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/70 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-white/15 bg-white/12 text-white hover:bg-white/18',
        secondary: 'border-white/10 bg-white/[0.05] text-white/78 hover:bg-white/[0.08]',
        destructive: 'border-rose-300/25 bg-rose-300/12 text-rose-100 hover:bg-rose-300/18',
        outline: 'border-white/12 bg-black/10 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
