import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap transition-all duration-150 ease-out outline-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        secondary:
          "border border-border/70 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:border-border",
        outline:
          "border border-input bg-card text-foreground shadow-2xs hover:bg-muted/80 hover:border-border",
        ghost:
          "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 min-h-[40px] gap-2 px-4 text-sm rounded-lg [&_svg:not([class*='size-'])]:size-4",
        xs: "h-7 gap-1 px-2 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base rounded-lg [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10 rounded-lg min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12 rounded-lg [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  nativeButton,
  children,
  ...props
}: ButtonProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <ButtonPrimitive
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        render={children as React.ReactElement}
        {...props}
      />
    );
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={props.render == null ? true : nativeButton}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  );
}

export { buttonVariants };
