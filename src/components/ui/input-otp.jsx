import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center has-[:disabled]:opacity-60", containerClassName)}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props} />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center gap-2 sm:gap-2.5 lg:gap-3", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef(({ index, className, state = "default", ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]
  const isError = state === "error"
  const isSuccess = state === "success"

  return (
    (<div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center rounded-[14px] bg-white border-[1.5px] border-[#E9E4F5] shadow-sm font-heading font-extrabold text-ink leading-none transition-all duration-150 select-none",
        "w-9 h-11 sm:w-11 sm:h-[54px] lg:w-[52px] lg:h-[60px]",
        "text-[22px] sm:text-[24px] lg:text-[26px]",
        !isError && !isSuccess && isActive && "z-10 border-primary ring-[3px] ring-primary/15",
        !isError && !isSuccess && char && !isActive && "bg-tint border-primary/40",
        isError && "border-destructive",
        isSuccess && "border-success bg-success/10 text-success animate-otp-success",
        className
      )}
      {...props}>
      {isSuccess ? <Check className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} /> : char}
      {hasFakeCaret && !isSuccess && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-[2px] animate-caret-blink bg-primary" />
        </div>
      )}
    </div>)
  );
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("hidden sm:flex items-center self-center px-0.5", className)}
    {...props}>
    <Minus className="w-4 h-1.5 text-faint" />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }