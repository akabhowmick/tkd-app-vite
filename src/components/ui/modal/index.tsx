import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../button";
import { Label } from "../label";

// ─── Size scale ──────────────────────────────────────────────────────────────

const SIZE_CLASSES = {
  compact: "max-w-sm",
  default: "max-w-lg",
  wide: "max-w-2xl",
} as const;

type ModalSize = keyof typeof SIZE_CLASSES;

// ─── Shared overlay + shell ───────────────────────────────────────────────────

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
ModalOverlay.displayName = "ModalOverlay";

const modalContentBase =
  "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 " +
  "bg-background border border-border rounded-xl " +
  "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.22),0_8px_24px_-6px_rgba(0,0,0,0.10)] " +
  "duration-150 " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 " +
  "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] " +
  "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]";

// ─── ModalField — label + helper/error + input slot ──────────────────────────

interface ModalFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function ModalField({
  label,
  required,
  error,
  helper,
  htmlFor,
  className,
  children,
}: ModalFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {helper && !error && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

// ─── AppModal ─────────────────────────────────────────────────────────────────

interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: ModalSize;
  className?: string;
  children: React.ReactNode;
}

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  size = "default",
  className,
  children,
}: AppModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <ModalOverlay />
        <DialogPrimitive.Content
          className={cn(
            modalContentBase,
            SIZE_CLASSES[size],
            "max-h-[90dvh] flex flex-col",
            className,
          )}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex flex-col gap-1 min-w-0">
              <DialogPrimitive.Title className="text-base font-semibold leading-tight text-foreground font-heading">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─── AppFormModal ─────────────────────────────────────────────────────────────

interface AppFormModalProps extends AppModalProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  /** Render additional footer content to the left of action buttons */
  footerLeft?: React.ReactNode;
}

export function AppFormModal({
  open,
  onOpenChange,
  title,
  description,
  size = "default",
  className,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  error,
  footerLeft,
  children,
}: AppFormModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogPrimitive.Portal>
        <ModalOverlay />
        <DialogPrimitive.Content
          className={cn(
            modalContentBase,
            SIZE_CLASSES[size],
            "max-h-[90dvh] flex flex-col",
            className,
          )}
          onInteractOutside={loading ? (e) => e.preventDefault() : undefined}
          onFocusOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={loading ? (e) => e.preventDefault() : undefined}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex flex-col gap-1 min-w-0">
              <DialogPrimitive.Title className="text-base font-semibold leading-tight text-foreground font-heading">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {!loading && (
              <DialogPrimitive.Close className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </div>

          {/* Form body + footer */}
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <div className="flex flex-col gap-4">{children}</div>
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/30 shrink-0 rounded-b-xl">
              <div className="flex-1">{footerLeft}</div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => onOpenChange(false)}
                >
                  {cancelLabel}
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {loading ? "Saving…" : submitLabel}
                </Button>
              </div>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─── AppConfirmModal ──────────────────────────────────────────────────────────

interface AppConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  variant?: "destructive" | "default";
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function AppConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  variant = "destructive",
  confirmLabel = variant === "destructive" ? "Delete" : "Confirm",
  cancelLabel = "Cancel",
  loading = false,
}: AppConfirmModalProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <AlertDialogPrimitive.Content
          className={cn(modalContentBase, SIZE_CLASSES.compact, "flex flex-col gap-0")}
        >
          {variant === "destructive" && (
            <div className="flex justify-center pt-6 pb-2">
              <div className="h-11 w-11 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          )}

          <div className="px-6 pt-4 pb-6 flex flex-col gap-2 text-center">
            <AlertDialogPrimitive.Title className="text-base font-semibold text-foreground font-heading">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          </div>

          <div className="flex gap-2 px-6 pb-6 justify-center">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button
                variant={variant === "destructive" ? "destructive" : "default"}
                size="sm"
                disabled={loading}
                onClick={onConfirm}
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? "Please wait…" : confirmLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

// ─── InfoBox — info/note banner inside modals ─────────────────────────────────

interface InfoBoxProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function InfoBox({ icon, title, subtitle, className }: InfoBoxProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/15 px-4 py-3",
        className,
      )}
    >
      {icon && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
