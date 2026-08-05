import { cn } from '#/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo.png"
      alt=""
      aria-hidden="true"
      width="40"
      height="40"
      className={cn('size-9 rounded-xl', className)}
    />
  )
}
