import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon;
  iconClassName?: string;
}

export function IconButton({
  icon: Icon,
  iconClassName,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button className={cn('p-0 h-9 w-9', className)} {...props}>
      <Icon className={cn('h-4 w-4', iconClassName)} />
    </Button>
  );
} 