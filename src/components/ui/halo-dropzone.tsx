"use client"

/**
 * File dropzone: dashed animated rim + rim blobs, frosted fill, moving border trail,
 * file-type SVG glyphs, and placeholder inference — all inlined (no `halo-card`,
 * `file-icons`, or `file-type-placeholder` imports).
 */
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useMotionValue, useTransform, useReducedMotion, motion, AnimatePresence } from "framer-motion"
import { Check, File, Upload } from "lucide-react"
import type { ChangeEvent, DragEvent, ReactNode } from "react"
import { cn } from "@/lib/utils"

/* ─── File type glyphs + helpers (inlined; no file-icons / file-type-placeholder imports) ─── */



export function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

const BORDER_TRAIL_LOOP_MS = 5250

type RimVariant = "default" | "success" | "destructive"

const RIM_BORDER_TRAIL: Record<RimVariant, { ambientGradient: string; coreGradient: string }> = {
  default: {
    ambientGradient:
      "linear-gradient(90deg, transparent 0%, rgba(255,0,128,0) 6%, rgba(255,0,128,0.38) 24%, rgba(121,40,202,0.5) 50%, rgba(0,212,255,0.42) 76%, rgba(0,212,255,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(255,0,128,0.72) 20%, rgba(200,140,255,0.92) 50%, rgba(0,212,255,0.78) 80%, transparent 100%)",
  },
  success: {
    ambientGradient:
      "linear-gradient(90deg, transparent 0%, rgba(5,150,105,0) 6%, rgba(16,185,129,0.36) 24%, rgba(20,184,166,0.48) 50%, rgba(13,148,136,0.4) 76%, rgba(13,148,136,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(5,150,105,0.68) 20%, rgba(52,211,153,0.88) 50%, rgba(20,184,166,0.8) 80%, transparent 100%)",
  },
  destructive: {
    ambientGradient:
      "linear-gradient(90deg, transparent 0%, rgba(220,38,38,0) 6%, rgba(220,38,38,0.4) 24%, rgba(244,63,94,0.52) 50%, rgba(190,18,60,0.44) 76%, rgba(190,18,60,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.75) 20%, rgba(251,113,133,0.9) 50%, rgba(244,63,94,0.82) 80%, transparent 100%)",
  },
}

function DropzoneCardBorderTrail({
  active,
}: {
  active: boolean
}) {
  const progress = useMotionValue(0)
  const offsetDistance = useTransform(progress, (v: number) => {
    const wrapped = ((v % 100) + 100) % 100
    return `${wrapped}%`
  })

  useEffect(() => {
    if (!active) {
      return
    }
    let rafId = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      const next = progress.get() + (dt / BORDER_TRAIL_LOOP_MS) * 100
      progress.set(((next % 100) + 100) % 100)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [active, progress])

  const trailBox = {
    height: 32,
    offsetPath: "rect(0 auto auto 0 round 16px)",
    width: 184,
  } as const

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
        active ? "visible opacity-100" : "invisible opacity-0"
      )}
    >
      <motion.div
        className="absolute opacity-95 dark:opacity-[0.98]"
        style={{
          ...trailBox,
          filter: "blur(12px)",
          offsetDistance,
        }}
      >
        <div
          className="size-full rounded-[999px]"
          style={{
            background: RIM_BORDER_TRAIL.default.ambientGradient,
          }}
        />
      </motion.div>
    </div>
  )
}

export interface HaloDropzoneProps {
  className?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  translucent?: boolean
  onFiles?: (files: File[]) => void
  successResetMs?: number
  emptyLabel?: string
  successLabel?: string
  idleIcon?: ReactNode
  formatHint?: string | null
  showSuccessThumbnails?: boolean
}

export function HaloDropzone({
  className,
  accept,
  multiple = false,
  disabled = false,
  translucent = true,
  onFiles,
  successResetMs = 2400,
  emptyLabel = "Drop files here or browse",
  successLabel = "Upload complete",
  idleIcon,
  formatHint = "PNG, JPG, PDF up to 10MB",
  showSuccessThumbnails = true,
}: HaloDropzoneProps) {
  const reduceMotion = useReducedMotion() ?? false
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const successTimerRef = useRef<number | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const interactive = !disabled
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  const emitFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || disabled) {
        return
      }
      const files = Array.from(list)
      if (files.length === 0) {
        return
      }
      onFiles?.(files)
      setUploadedFiles(files)
      setShowSuccess(true)
      if (successResetMs > 0) {
        if (successTimerRef.current) {
          window.clearTimeout(successTimerRef.current)
        }
        successTimerRef.current = window.setTimeout(() => {
          setShowSuccess(false)
          setUploadedFiles([])
          successTimerRef.current = null
        }, successResetMs)
      }
    },
    [disabled, onFiles, successResetMs]
  )

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    emitFiles(e.target.files)
    e.target.value = ""
  }

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) {
      return
    }
    dragDepth.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      e.dataTransfer.dropEffect = "copy"
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = 0
    setIsDragging(false)
    if (disabled) {
      return
    }
    emitFiles(e.dataTransfer.files)
  }

  const openPicker = () => {
    if (disabled) {
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <input
        accept={accept}
        className="sr-only"
        disabled={disabled}
        id={inputId}
        multiple={multiple}
        onChange={handleInputChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <label
        aria-disabled={disabled || undefined}
        aria-label={
          showSuccess
            ? `${successLabel}: ${uploadedFiles.map((f) => f.name).join(", ")}`
            : emptyLabel
        }
        className={cn(
          "relative block cursor-pointer rounded-2xl outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          disabled && "pointer-events-none cursor-not-allowed opacity-60"
        )}
        htmlFor={inputId}
        onBlur={() => setIsFocused(false)}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onFocus={() => setIsFocused(true)}
        onKeyDown={(e) => {
          if (disabled) {
            return
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openPicker()
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={disabled ? -1 : 0}
      >
        <div className="relative rounded-2xl p-px">
          <div
            className={cn(
              "relative rounded-2xl border border-border/90 px-6 min-h-44 py-8 flex flex-col items-center justify-center gap-3",
              "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
              "shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_rgba(0,0,0,0.05)]",
              "dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_1px_2px_rgba(0,0,0,0.35),0_4px_20px_rgba(0,0,0,0.35)]",
              "outline-none",
              translucent && "backdrop-blur-xl backdrop-saturate-150",
              isDragging && "shadow-md"
            )}
            style={{
              background: translucent
                ? "linear-gradient(to bottom, color-mix(in oklch, var(--card) 88%, transparent) 0%, color-mix(in oklch, var(--card) 74%, transparent) 100%)"
                : "linear-gradient(to bottom, var(--card) 0%, color-mix(in oklch, var(--card) 94%, var(--muted)) 100%)",
            }}
          >
            <AnimatePresence initial={false} mode="wait">
              {showSuccess ? (
                <motion.div
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="flex w-full max-w-full flex-col items-center gap-4 text-center min-h-0"
                  exit={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 2 }}
                  initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : -2 }}
                  key="success"
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" as const }}
                >
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
                      <Check aria-hidden className="size-[18px]" strokeWidth={2.25} />
                    </span>
                    <span className="text-balance font-medium text-foreground text-sm tracking-tight">
                      {successLabel}
                    </span>
                  </div>
                  {showSuccessThumbnails ? (
                    <ul className="flex w-full flex-wrap justify-center gap-x-4 gap-y-3">
                      {uploadedFiles.map((file, i) => {
                        const isImage = file.type.startsWith("image/")
                        return (
                          <motion.li
                            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                            className="flex w-19 min-w-0 flex-col items-center gap-1.5"
                            initial={
                              reduceMotion
                                ? false
                                : { opacity: 0, scale: 0.94, y: 6, filter: "blur(4px)" }
                            }
                            key={`${file.name}-${file.size}`}
                            transition={{
                              type: "spring",
                              duration: 0.3,
                              bounce: 0,
                              delay: reduceMotion ? 0 : 0.04 + i * 0.055,
                            }}
                          >
                            <div
                              className="relative overflow-hidden rounded-[11px] bg-muted/25 shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_4px_14px_rgba(0,0,0,0.12)] ring-1 ring-black/12 ring-inset dark:bg-white/4 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_6px_16px_rgba(0,0,0,0.35)] dark:ring-white/12"
                              style={{
                                height: 64,
                                width: 64,
                              }}
                            >
                              {isImage ? (
                                <img
                                  alt=""
                                  className="size-full object-cover"
                                  decoding="async"
                                  height={64}
                                  src={URL.createObjectURL(file)}
                                  width={64}
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center bg-linear-to-b from-muted/40 to-muted/5 p-1.5">
                                  <File aria-hidden className="size-[34px] text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="line-clamp-2 w-full max-w-19 text-center text-[10px] text-muted-foreground leading-snug">
                              {file.name}
                            </span>
                          </motion.li>
                        )
                      })}
                    </ul>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="flex min-h-[8.5rem] w-full max-w-full flex-col items-center justify-center gap-3 text-center"
                  exit={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 2 }}
                  initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : -2 }}
                  key="idle"
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" as const }}
                >
                  <motion.span
                    animate={reduceMotion || disabled ? { y: 0 } : { y: [0, -3, 0] }}
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-foreground/10 shadow-sm ring-1 ring-foreground/10"
                    transition={{
                      duration: 4.5,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    {idleIcon ?? <Upload className="size-5 shrink-0" strokeWidth={2} />}
                  </motion.span>
                  <span className="max-w-md text-balance text-foreground text-sm leading-relaxed">
                    {emptyLabel}
                  </span>
                  {formatHint ? (
                    <span className="text-muted-foreground text-xs">{formatHint}</span>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {interactive && !reduceMotion && (
            <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl">
              <DropzoneCardBorderTrail active={isHovered || isFocused || isDragging} />
            </div>
          )}
        </div>
      </label>
    </div>
  )
}
