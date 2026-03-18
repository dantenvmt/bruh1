// NextUI Input — drop-in replacement for shadcn Input
import { Input as NextInput } from '@nextui-org/react'
import type { ComponentProps, Ref } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type NextInputProps = ComponentProps<typeof NextInput>

interface InputProps extends Omit<NextInputProps, 'ref'> {
  ref?: Ref<HTMLInputElement>
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, _ref) => {
    return (
      <NextInput
        variant="bordered"
        classNames={{
          input: 'text-foreground text-sm',
          inputWrapper: cn(
            'border-border/60 bg-background/70 hover:border-primary/40 focus-within:!border-primary/60',
            className
          ),
        }}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
