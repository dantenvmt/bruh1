// NextUI Button — drop-in replacement for shadcn Button
import type { ComponentProps } from 'react'
import React from 'react'
import { Button as NextButton } from '@nextui-org/react'
import { cn } from '@/lib/utils'

type NextButtonProps = ComponentProps<typeof NextButton>

interface ButtonProps extends Omit<NextButtonProps, 'variant' | 'size' | 'color'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

function mapVariant(variant?: string): { variant: NextButtonProps['variant']; color: NextButtonProps['color'] } {
  switch (variant) {
    case 'outline':    return { variant: 'bordered', color: 'default' }
    case 'ghost':      return { variant: 'light',    color: 'default' }
    case 'secondary':  return { variant: 'flat',     color: 'default' }
    case 'destructive':return { variant: 'solid',    color: 'danger'  }
    case 'link':       return { variant: 'light',    color: 'primary' }
    default:           return { variant: 'solid',    color: 'primary' }
  }
}

function mapSize(size?: string): NextButtonProps['size'] {
  switch (size) {
    case 'sm':   return 'sm'
    case 'lg':   return 'lg'
    case 'icon': return 'sm'
    default:     return 'md'
  }
}

export function Button({ variant, size, className, asChild: _asChild, onClick, children, ...props }: ButtonProps & { onClick?: React.MouseEventHandler<HTMLButtonElement> }) {
  const { variant: nVariant, color } = mapVariant(variant)
  const nSize = mapSize(size)

  return (
    <NextButton
      variant={nVariant}
      color={color}
      size={nSize}
      onPress={onClick ? () => onClick({} as React.MouseEvent<HTMLButtonElement>) : undefined}
      className={cn(
        'font-semibold',
        size === 'icon' && 'min-w-0 w-9 h-9 p-0',
        className
      )}
      {...props}
    >
      {children}
    </NextButton>
  )
}

export { Button as default }
