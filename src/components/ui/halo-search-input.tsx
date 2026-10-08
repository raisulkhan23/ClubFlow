"use client"

import { useId, useRef, useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { motion, useReducedMotion, useMotionValue, useTransform } from "framer-motion"

interface HaloSearchInputProps extends React.ComponentProps<"input"> {
  isLoading?: boolean
  loadingText?: string
  loadingStaggerSec?: number
  loadingCharDurationSec?: number
  blobTranslucent?: boolean
  onClear?: () => void
}

function useAccumulator(
  isActive: boolean,
  totalChars: number,
  staggerSec: number,
  charDurationSec: number,
  reduceMotion: boolean
) {
  const displayed = useMotionValue(0)
  // Keep rounded transform for potential future use
  const _rounded = useTransform(displayed, (v: number) => Math.round(v))
  void _rounded

  useEffect(() => {
    if (reduceMotion) {
      displayed.set(totalChars)
      return
    }
    if (!isActive) {
      displayed.set(0)
      return
    }
    const duration = charDurationSec * 1000
    let current = 0
    let rafId = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = now - last
      last = now
      current = Math.min(totalChars, current + dt / duration)
      displayed.set(current)
      if (current < totalChars) {
        rafId = requestAnimationFrame(tick)
      } else {
        displayed.set(totalChars)
      }
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isActive, totalChars, staggerSec, charDurationSec, reduceMotion, motion])

  return displayed
}

export function HaloSearchInput({
  className,
  isLoading = false,
  loadingText = "Searching…",
  loadingStaggerSec = 0.05,
  loadingCharDurationSec = 0.35,
  blobTranslucent = false,
  onClear,
  value,
  onChange,
  placeholder,
  ...props
}: HaloSearchInputProps) {
  const id = useId()
  const reduceMotion = useReducedMotion() ?? false
  const [focused, setFocused] = useState(false)
  const [localValue, setLocalValue] = useState(value ?? "")
  const clearRef = useRef(onClear)
  const onClearStable = clearRef.current

  useEffect(() => {
    clearRef.current = onClear
  }, [onClear])

  const displayed = useAccumulator(
    isLoading,
    loadingText.length,
    loadingStaggerSec,
    loadingCharDurationSec,
    reduceMotion
  )

  const loadingSlice = reduceMotion || !isLoading
    ? loadingText
    : loadingText.slice(0, Math.max(1, displayed.get()))

  const showLoading = isLoading
  const showValue = !isLoading && localValue

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
    onChange?.(e)
  }, [onChange])

  const handleClear = useCallback(() => {
    setLocalValue("")
    if (onClearStable) onClearStable()
  }, [onClearStable])

  return (
    <div
      className={cn(
        "relative flex w-full items-center rounded-xl border bg-background transition-[background-color,border-color,box-shadow] duration-200",
        focused && "border-ring/70 shadow-[0_0_0_3px rgba(0,0,0,0.05)]",
        blobTranslucent && "backdrop-blur-xl backdrop-saturate-150 bg-transparent",
        className
      )}
      style={
        blobTranslucent
          ? undefined
          : {
              background: focused
                ? "linear-gradient(to bottom, var(--card) 0%, color-mix(in oklch, var(--card) 94%, var(--muted)) 100%)"
                : "linear-gradient(to bottom, var(--card) 0%, color-mix(in oklch, var(--card) 96%, var(--muted)) 100%)",
            }
      }
    >
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        {showLoading ? (
          <motion.span
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
            className="text-muted-foreground text-sm tabular"
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          >
            {loadingSlice}
            {!reduceMotion && isLoading && displayed.get() < loadingText.length ? (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                className="text-primary"
                transition={{ duration: 0.4, repeat: Infinity }}
              >
                █
              </motion.span>
            ) : null}
          </motion.span>
        ) : showValue ? (
          <span className="text-foreground text-sm">{localValue}</span>
        ) : (
          <span className="text-muted-foreground text-sm">
            {placeholder ?? "Search…"}
          </span>
        )}
      </div>

      <input
        id={id}
        className={cn(
          "flex w-full border-0 bg-transparent py-3 pl-10 pr-10 text-sm outline-none placeholder:text-muted-foreground",
          blobTranslucent ? "text-foreground" : "text-foreground",
          isLoading && "pointer-events-none opacity-40"
        )}
        value={showLoading ? "" : localValue}
        onChange={handleChange}
        onFocus={(e) => {
          setFocused(true)
          ;(e.target as HTMLInputElement).dataset.focused = "true"
        }}
        onBlur={(e) => {
          setFocused(false)
          delete (e.target as HTMLInputElement).dataset.focused
        }}
        {...props}
      />

      {showValue && !isLoading && (
        <button
          type="button"
          aria-label="Clear search"
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground"
          )}
          onClick={handleClear}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {isLoading && !showValue && (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <motion.div
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
            className="flex gap-0.5"
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: "100ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: "200ms" }} />
          </motion.div>
        </div>
      )}
    </div>
  )
}
