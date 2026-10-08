"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { useMotionValue, useTransform, useReducedMotion, motion, AnimatePresence } from "framer-motion"
import { Check, File, FileText, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChangeEvent, DragEvent, ReactNode, SVGProps } from "react"

/* ─── File type glyphs + helpers (inlined; no file-icons / file-type-placeholder imports) ─── */

const MicrosoftExcel = ({
  gradientIdPrefix = "",
  ...props
}: SVGProps<SVGSVGElement> & { gradientIdPrefix?: string }) => {
  const p = gradientIdPrefix
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand glyph; callers set aria-hidden
    <svg {...props} viewBox="0 0 486 500">
      <defs>
        <radialGradient
          cx="-746.66"
          cy="781.44"
          fx="-746.66"
          fy="781.44"
          gradientTransform="matrix(-28.32596 -29.80763 -23.11916 21.97986 -2596.39 -38900.31)"
          gradientUnits="userSpaceOnUse"
          id={`${p}microsoft_excel__a`}
          r="13.89"
        >
          <stop offset=".06" stopColor="#379539" />
          <stop offset=".42" stopColor="#297c2d" />
          <stop offset=".7" stopColor="#15561c" />
        </radialGradient>
        <linearGradient
          gradientTransform="matrix(1 0 0 -1 0 502)"
          gradientUnits="userSpaceOnUse"
          id={`${p}microsoft_excel__c`}
          x1="69.43"
          x2="260.84"
          y1="210.33"
          y2="210.33"
        >
          <stop offset="0" stopColor="#52d17c" />
          <stop offset=".33" stopColor="#4aa647" />
        </linearGradient>
      </defs>
      <path
        d="M69.43 159.72c0-34.52 27.98-62.5 62.49-62.5h354.09v361.11c0 23.01-18.65 41.67-41.66 41.67H152.74c-46.01 0-83.31-37.31-83.31-83.33V159.72Z"
        style={{ fill: `url(#${p}microsoft_excel__a)` }}
      />
      <path
        d="M69.43 229.17c0-34.52 27.98-62.5 62.49-62.5h187.46c-23.01 0-41.66 18.66-41.66 41.67v83.33c0 23.01-18.65 41.67-41.66 41.67h-83.31c-46.01 0-83.31 37.31-83.31 83.33v-187.5Z"
        style={{ fill: `url(#${p}microsoft_excel__c)` }}
      />
    </svg>
  )
}

const MicrosoftWord = ({
  gradientIdPrefix = "",
  ...props
}: SVGProps<SVGSVGElement> & { gradientIdPrefix?: string }) => {
  const p = gradientIdPrefix
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand glyph; callers set aria-hidden
    <svg {...props} viewBox="0 0 486 500">
      <defs>
        <radialGradient
          cx="-689.34"
          cy="753.93"
          fx="-689.34"
          fy="753.93"
          gradientTransform="matrix(47.56 0 0 -20.15 33260.63 15691.18)"
          gradientUnits="userSpaceOnUse"
          id={`${p}microsoft_word__a`}
          r="13.89"
        >
          <stop offset=".18" stopColor="#1657f4" />
          <stop offset=".57" stopColor="#0036c4" />
        </radialGradient>
      </defs>
      <path
        d="m69.43 376.25 194.4-237.36L486 293.13v158.26c0 26.85-21.76 48.61-48.6 48.61H152.74c-46.01 0-83.31-37.31-83.31-83.33v-40.42Z"
        style={{ fill: `url(#${p}microsoft_word__a)` }}
      />
    </svg>
  )
}

const MicrosoftPowerPoint = ({
  gradientIdPrefix = "",
  ...props
}: SVGProps<SVGSVGElement> & { gradientIdPrefix?: string }) => {
  const p = gradientIdPrefix
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand glyph; callers set aria-hidden
    <svg {...props} viewBox="60 78.75 581.25 562.5">
      <defs>
        <radialGradient
          cx="0"
          cy="0"
          fx="0"
          fy="0"
          gradientTransform="rotate(135 185.459 218.557) scale(564.67953 950.43148)"
          gradientUnits="userSpaceOnUse"
          id={`${p}microsoft_powerpoint__b`}
          r="1"
        >
          <stop
            offset=".152"
            style={{ stopColor: "#aa1d2d", stopOpacity: "1" }}
          />
          <stop
            offset=".381"
            style={{ stopColor: "#d12b18", stopOpacity: ".439216" }}
          />
          <stop
            offset=".602"
            style={{ stopColor: "#ff3c00", stopOpacity: "0" }}
          />
        </radialGradient>
      </defs>
      <path
        d="M641.2 360c0-155.332-125.907-281.25-281.223-281.25C204.66 78.75 78.75 204.668 78.75 360s125.91 281.25 281.227 281.25c155.316 0 281.222-125.918 281.222-281.25Zm0 0"
        style={{
          stroke: "none",
          fillRule: "nonzero",
          fill: `url(#${p}microsoft_powerpoint__b)`,
        }}
      />
    </svg>
  )
}

const PDF = (props: SVGProps<SVGSVGElement>) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand glyph; callers set aria-hidden
  <svg {...props} viewBox="0 0 75.32 92.604">
    <path
      color="#000"
      d="M-29.633 123.947c-3.552 0-6.443 2.894-6.443 6.446v49.498c0 3.551 2.891 6.445 6.443 6.445h37.85c3.552 0 6.443-2.893 6.443-6.445v-40.702s.102-1.191-.416-2.351a6.516 6.516 0 0 0-1.275-1.844 1.058 1.058 0 0 0-.006-.008l-9.39-9.21a1.058 1.058 0 0 0-.016-.016s-.802-.764-1.99-1.274c-1.4-.6-2.842-.537-2.842-.537l.021-.002z"
      fill="#ff2116"
      font-family="sans-serif"
      overflow="visible"
      paint-order="markers fill stroke"
      style={{
        lineHeight: "normal",
        fontVariantLigatures: "normal",
        fontVariantPosition: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantAlternates: "normal",
        fontFeatureSettings: "normal",
        textIndent: "0",
        textAlign: "start",
        textDecorationLine: "none",
        textDecorationStyle: "solid",
        textDecorationColor: "#000",
        textTransform: "none",
        textOrientation: "mixed",
        whiteSpace: "normal",
        isolation: "auto",
        mixBlendMode: "normal",
      }}
      transform="translate(53.548 -183.975) scale(1.4843)"
    />
  </svg>
)

const Markdown = (props: SVGProps<SVGSVGElement>) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand glyph; callers set aria-hidden
  <svg {...props} fill="none" viewBox="0 0 208 128">
    <g fill="#000">
      <path
        clipRule="evenodd"
        d="M15 10a5 5 0 0 0-5 5v98a5 5 0 0 0 5 5h178a5 5 0 0 0 5-5V15a5 5 0 0 0-5-5zM0 15A15 15 0 0 1 15 0h178a15 15 0 0 1 15 15v98a15 15 0 0 1-15 15H15a15 15 0 0 1-15-15z"
        fillRule="evenodd"
      />
      <path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0-30-33h20V30h20v35h20z" />
    </g>
  </svg>
)

const JSONSchema = (props: SVGProps<SVGSVGElement>) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand glyph; callers set aria-hidden
  <svg {...props} preserveAspectRatio="xMidYMid" viewBox="0 0 256 220">
    <path
      d="M70.206 0v16.767c-6.616 0-11.833 1.032-15.622 3.082-3.788 2.05-6.475 5.23-8.043 9.543-1.57 4.312-2.361 9.811-2.361 16.484v34.24c0 4.454-.58 8.511-1.754 12.159-1.173 3.647-3.322 6.786-6.46 9.415-3.153 2.63-7.606 4.652-13.403 6.08-.735.17-1.569.31-2.36.466v2.644l1.597.298c.262.052.518.107.763.168 5.797 1.428 10.264 3.45 13.403 6.08 3.138 2.629 5.287 5.767 6.46 9.415 1.174 3.661 1.754 7.705 1.754 12.158v34.24c0 6.688.791 12.159 2.36 16.442 1.57 4.284 4.256 7.465 8.044 9.543 3.79 2.078 9.006 3.125 15.622 3.125v16.78c-8.397 0-15.438-.918-21.15-2.742-5.71-1.824-10.263-4.623-13.698-8.383-3.436-3.761-5.896-8.525-7.408-14.293-1.513-5.768-2.262-12.583-2.262-20.457V145.87c0-9.36-1.909-16.032-5.698-20.033-3.803-4.001-10.461-5.994-19.99-5.994V99.3c9.529 0 16.201-1.993 19.99-5.994 3.803-4.001 5.698-10.674 5.698-20.033V45.876c0-7.875.749-14.689 2.262-20.457 1.512-5.768 3.972-10.532 7.408-14.293 3.435-3.76 7.987-6.56 13.699-8.383C54.768.919 61.823 0 70.207 0Zm115.588 0c8.383 0 15.438.919 21.149 2.743 5.712 1.823 10.264 4.623 13.7 8.383 3.42 3.76 5.895 8.525 7.407 14.293 1.513 5.768 2.262 12.582 2.262 20.457v27.398c0 9.36 1.895 16.032 5.698 20.033 3.788 4 10.461 5.994 19.99 5.994v20.528c-9.529 0-16.188 1.993-19.99 5.994-3.79 4-5.698 10.674-5.698 20.033v27.384c0 7.874-.749 14.689-2.262 20.457-1.512 5.768-3.972 10.532-7.408 14.292-3.421 3.761-7.987 6.56-13.7 8.384-5.71 1.824-12.751 2.743-21.148 2.743v-16.781c6.616 0 11.833-1.047 15.622-3.125 3.788-2.078 6.474-5.259 8.043-9.542 1.57-4.284 2.361-9.756 2.361-16.443v-34.24c0-4.453.58-8.497 1.754-12.158 1.173-3.648 3.322-6.786 6.46-9.416 3.139-2.63 7.606-4.651 13.403-6.079.735-.184 1.569-.311 2.36-.467v-2.643l-1.597-.305a25.155 25.155 0 0 1-.763-.162c-5.797-1.413-10.25-3.435-13.403-6.065-3.138-2.63-5.287-5.768-6.46-9.415-1.174-3.648-1.754-7.705-1.754-12.158V45.876c0-6.673-.791-12.172-2.36-16.484-1.57-4.312-4.256-7.493-8.044-9.543-3.79-2.05-9.006-3.082-15.622-3.082V0Zm15.876 109.282c0 .976-1.866 3.436-4.128 5.472-3.79 3.404-9.334 8.707-14.568 13.853l-3.835 3.798-5.112 5.165c-3.334 3.42-5.58 5.86-5.58 6.165 0 .537 3.987 7.422 8.879 15.31l8.256 13.347a1.553 1.553 0 0 1-.17 1.866l-1.965 1.513c-1.484 1.64-2.488 2.926-2.686 4.538.257.72-.458 1.17-1.384 1.601l-1.09.49c-3.145 1.463-5.531-.075-14.063-9.928l-4.027-4.685c-4.036-4.63-7.444-8.149-7.95-8.162-1.287-.028-15.524 15.537-26.537 29.01-9.712 11.876-18.265 12.116-20.74 9.784-4.17-3.959-3.562-10.73 1.57-17.375l.667-.83c2.516-3.034 7.902-8.708 14.032-14.867l2.047-2.047 3.66-3.615a506.785 506.785 0 0 1 10.753-10.252l4.637-4.27-9.461-20.315c-5.715-12.502-5.226-13.604 3.048-14.605l7.728-.862 6.715 10.15c3.69 5.585 7.252 10.152 7.889 10.152.592 0 6.38-4.608 13.188-10.48l6.375-5.528c7.693-6.598 9.283-7.392 12.387-7.087l.89.107c2.424.337 4.598.175 5.368-.366l.175-.157c1.3-1.555 5.032.75 5.032 3.11Zm-38.454-92.897c6.164 0 7.083 2.15 7.083 2.15-20.938 10.927-38.652 30.409-56.946 66.29l-2.946 5.873-11.375 22.119c-.897 1.63-1.075-.646-5.084-6.115l-.684-.912C71.892 73.885 56.314 67.89 56.407 67.383c8.257-5.32 23.724-.117 33.28 8.38l.354.339.946.825c1.558 1.399 2.289 2.302 4.61 4.886.232 0 2.678-3.861 5.22-7.975l5.92-9.71c21.291-33.577 43.557-47.771 56.479-47.743Z"
      fill="#002CC4"
    />
  </svg>
)

const CSS = (props: SVGProps<SVGSVGElement>) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand glyph; callers set aria-hidden
  <svg {...props} viewBox="0 0 512 512">
    <path
      d="M71.357 460.819 30.272 0h451.456l-41.129 460.746L255.724 512z"
      fill="#264de4"
    />
    <path d="m405.388 431.408 35.148-393.73H256v435.146z" fill="#2965f1" />
  </svg>
)

const HTML5 = (props: SVGProps<SVGSVGElement>) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand glyph; callers set aria-hidden
  <svg {...props} viewBox="0 0 452 520">
    <path d="M41 460L0 0h451l-41 460-185 52" fill="#e34f26" />
    <path d="M226 472l149-41 35-394H226" fill="#ef652a" />
    <path
      d="M226 208h-75l-5-58h80V94H84l15 171h127zm0 147l-64-17-4-45h-56l7 89 117 32z"
      fill="#ecedee"
    />
    <path
      d="M226 265h69l-7 73-62 17v59l115-32 16-174H226zm0-171v56h136l5-56z"
      fill="#fff"
    />
  </svg>
)

export function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

/* ─── Rim chrome (self-contained; no halo-card import) ─── */

const BORDER_TRAIL_LOOP_MS = 5250

type RimVariant = "default" | "success" | "destructive"

const RIM_BLOB_GRADIENTS: Record<
  RimVariant,
  { primaryBg: string; secondaryBg: string; tertiaryBg: string }
> = {
  default: {
    primaryBg: "linear-gradient(90deg, #ff0080, #7928ca, #00d4ff, #0070f3)",
    secondaryBg: "linear-gradient(90deg, #ff4d4d, #f9cb28, #ff0080)",
    tertiaryBg: "linear-gradient(90deg, #0070f3, #00d4ff, #7928ca)",
  },
  success: {
    primaryBg:
      "linear-gradient(90deg, #047857, #059669, #10b981, #14b8a6, #0d9488)",
    secondaryBg: "linear-gradient(90deg, #34d399, #6ee7b7, #2dd4bf, #5eead4)",
    tertiaryBg: "linear-gradient(90deg, #065f46, #047857, #0f766e)",
  },
  destructive: {
    primaryBg:
      "linear-gradient(90deg, #991b1b, #dc2626, #e11d48, #f43f5e, #be123c)",
    secondaryBg: "linear-gradient(90deg, #fb7185, #fda4af, #f87171, #fecdd3)",
    tertiaryBg: "linear-gradient(90deg, #7f1d1d, #b91c1c, #dc2626)",
  },
}

interface BorderTrailChrome {
  ambientGradient: string
  ambientGlow: string
  coreGradient: string
  coreGlow: string
}

const RIM_BORDER_TRAIL: Record<RimVariant, BorderTrailChrome> = {
  default: {
    ambientGradient:
      "linear-gradient(90deg, transparent 0%, rgba(255,0,128,0) 6%, rgba(255,0,128,0.38) 24%, rgba(121,40,202,0.5) 50%, rgba(0,212,255,0.42) 76%, rgba(0,212,255,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(255,0,128,0.72) 20%, rgba(200,140,255,0.92) 50%, rgba(0,212,255,0.78) 80%, transparent 100%)",
    ambientGlow:
      "0 0 22px rgba(121,40,202,0.28), 0 0 44px rgba(0,212,255,0.18), 0 0 2px rgba(255,255,255,0.12)",
    coreGlow:
      "0 0 14px rgba(255,0,128,0.35), 0 0 28px rgba(0,212,255,0.32), inset 0 0 1px rgba(255,255,255,0.22)",
  },
  success: {
    ambientGradient:
      "linear-gradient(90deg, transparent 0%, rgba(5,150,105,0) 6%, rgba(16,185,129,0.36) 24%, rgba(20,184,166,0.48) 50%, rgba(13,148,136,0.4) 76%, rgba(13,148,136,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(5,150,105,0.68) 20%, rgba(52,211,153,0.88) 50%, rgba(20,184,166,0.8) 80%, transparent 100%)",
    ambientGlow:
      "0 0 22px rgba(16,185,129,0.32), 0 0 44px rgba(13,148,136,0.22), 0 0 2px rgba(255,255,255,0.1)",
    coreGlow:
      "0 0 14px rgba(5,150,105,0.42), 0 0 28px rgba(20,184,166,0.4), inset 0 0 1px rgba(255,255,255,0.2)",
  },
  destructive: {
    ambientGradient:
      "linear-gradient(90deg, transparent 0%, rgba(220,38,38,0) 6%, rgba(220,38,38,0.4) 24%, rgba(244,63,94,0.52) 50%, rgba(190,18,60,0.44) 76%, rgba(190,18,60,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.75) 20%, rgba(251,113,133,0.9) 50%, rgba(244,63,94,0.82) 80%, transparent 100%)",
    ambientGlow:
      "0 0 22px rgba(220,38,38,0.35), 0 0 44px rgba(244,63,94,0.24), 0 0 2px rgba(255,255,255,0.08)",
    coreGlow:
      "0 0 14px rgba(220,38,38,0.48), 0 0 28px rgba(244,63,94,0.4), inset 0 0 1px rgba(255,255,255,0.16)",
  },
}

function DropzoneCardBorderTrail({
  active,
  rimVariant = "default",
}: {
  active: boolean
  rimVariant?: RimVariant
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

  const pathCornerRadiusPx = 16
  const trailLengthPx = 184
  const trailThicknessPx = 32

  const trailBox = {
    height: trailThicknessPx,
    offsetPath: `rect(0 auto auto 0 round ${pathCornerRadiusPx}px)`,
    width: trailLengthPx,
  } as const

  const trail = RIM_BORDER_TRAIL[rimVariant]

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
        active ? "visible opacity-100" : "invisible opacity-0"
      )}
      aria-hidden
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
            background: trail.ambientGradient,
            boxShadow: trail.ambientGlow,
          }}
        />
      </motion.div>
      <motion.div
        className="absolute dark:opacity-[0.94]"
        style={{
          ...trailBox,
          filter: "blur(4px)",
          offsetDistance,
        }}
      >
        <div
          className="size-full rounded-[999px]"
          style={{
            background: trail.coreGradient,
            boxShadow: trail.coreGlow,
          }}
        />
      </motion.div>
    </div>
  )
}

function dropzoneBorderGlowConfig(
  translucent: boolean,
  rimEmphasis: boolean,
  rimVariant: RimVariant = "default"
) {
  let idleOpacity: number
  if (translucent) {
    idleOpacity = rimEmphasis ? 0.92 : 0.72
  } else {
    idleOpacity = rimEmphasis ? 0.78 : 0.5
  }
  const gradients = RIM_BLOB_GRADIENTS[rimVariant]
  return {
    opacityIdle: idleOpacity,
    primaryBg: gradients.primaryBg,
    secondaryBg: gradients.secondaryBg,
    tertiaryBg: gradients.tertiaryBg,
    primaryLeft: ["-5%", "75%", "-5%"],
    secondaryLeft: ["65%", "10%", "65%"],
    tertiaryLeft: ["25%", "55%", "25%"],
    durationMain: 6,
    durationSec: 5,
    durationTer: 4,
  }
}

type DropzoneBorderGlowState = ReturnType<typeof dropzoneBorderGlowConfig>

function DropzoneCardRimBlobs({
  borderGlow,
  reduceMotion,
}: {
  borderGlow: DropzoneBorderGlowState
  reduceMotion: boolean
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl" aria-hidden>
      <motion.div
        animate={{
          opacity: reduceMotion
            ? borderGlow.opacityIdle * 0.82
            : borderGlow.opacityIdle,
        }}
        className="absolute inset-x-0 bottom-0 h-[58%]"
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <motion.div
          animate={{
            left: borderGlow.primaryLeft,
          }}
          className="-bottom-10 absolute h-32 w-88 blur-2xl"
          style={{
            background: borderGlow.primaryBg,
          }}
          transition={{
            duration: reduceMotion ? 0.01 : borderGlow.durationMain,
            repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          animate={{
            left: borderGlow.secondaryLeft,
          }}
          className="-bottom-7 absolute h-24 w-52 blur-2xl"
          style={{
            background: borderGlow.secondaryBg,
          }}
          transition={{
            duration: reduceMotion ? 0.01 : borderGlow.durationSec,
            repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          animate={{
            left: borderGlow.tertiaryLeft,
          }}
          className="-bottom-5 absolute h-20 w-44 blur-xl"
          style={{
            background: borderGlow.tertiaryBg,
          }}
          transition={{
            duration: reduceMotion ? 0.01 : borderGlow.durationTer,
            repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  )
}

function dropzoneFillBackgroundFor(
  translucent: boolean,
  interactive: boolean,
  rimEmphasis: boolean
) {
  if (translucent) {
    if (interactive && rimEmphasis) {
      return "linear-gradient(to bottom, color-mix(in oklch, var(--card) 88%, transparent) 0%, color-mix(in oklch, var(--card) 74%, transparent) 100%)"
    }
    return "linear-gradient(to bottom, color-mix(in oklch, var(--card) 82%, transparent) 0%, color-mix(in oklch, var(--card) 70%, transparent) 100%)"
  }
  if (interactive && rimEmphasis) {
    return "linear-gradient(to bottom, var(--card) 0%, color-mix(in oklch, var(--card) 90%, var(--muted)) 100%)"
  }
  return "linear-gradient(to bottom, var(--card) 0%, color-mix(in oklch, var(--card) 94%, var(--muted)) 100%)"
}

const CROSSFADE_SEC = 0.2

const crossfade = (reduceMotion: boolean) => ({
  exit: {
    opacity: reduceMotion ? 1 : 0,
    scale: reduceMotion ? 1 : 0.96,
    y: reduceMotion ? 0 : 2,
  },
  initial: {
    opacity: reduceMotion ? 1 : 0,
    scale: reduceMotion ? 1 : 0.96,
    y: reduceMotion ? 0 : -2,
  },
})

const crossfadeTransition = (reduceMotion: boolean) => ({
  duration: reduceMotion ? 0 : CROSSFADE_SEC,
  ease: "easeOut" as const,
})

/** Fixed tile size so image previews stay compact. */
const THUMB_PX = 64

const THUMB_TYPE_ICON_CLASS =
  "pointer-events-none h-[34px] w-[34px] max-h-[85%] max-w-[85%] shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.14)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"

/** Renders the same type glyph used in the dropzone success tiles (for upload rows, etc.). */
export function DropzoneFileTypeGlyph({ file }: { file: File }) {
  const gradientIdPrefix = useId().replace(/:/g, "")
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const kind = inferPlaceholderKind(file)

  if (ext === "htm" || ext === "html") {
    return <HTML5 aria-hidden className={THUMB_TYPE_ICON_CLASS} />
  }
  if (ext === "css") {
    return <CSS aria-hidden className={THUMB_TYPE_ICON_CLASS} />
  }

  switch (kind) {
    case "pdf":
      return <PDF aria-hidden className={THUMB_TYPE_ICON_CLASS} />
    case "doc":
      return (
        <MicrosoftWord
          aria-hidden
          className={THUMB_TYPE_ICON_CLASS}
          gradientIdPrefix={gradientIdPrefix}
        />
      )
    case "sheet":
      return (
        <MicrosoftExcel
          aria-hidden
          className={THUMB_TYPE_ICON_CLASS}
          gradientIdPrefix={gradientIdPrefix}
        />
      )
    case "md":
      return (
        <Markdown
          aria-hidden
          className={cn(
            THUMB_TYPE_ICON_CLASS,
            "dark:opacity-95 dark:brightness-0 dark:invert"
          )}
        />
      )
    case "json":
      return <JSONSchema aria-hidden className={THUMB_TYPE_ICON_CLASS} />
    case "ppt":
      return (
        <MicrosoftPowerPoint
          aria-hidden
          className={THUMB_TYPE_ICON_CLASS}
          gradientIdPrefix={gradientIdPrefix}
        />
      )
    case "txt":
      return (
        <FileText
          aria-hidden
          className={cn(THUMB_TYPE_ICON_CLASS, "text-muted-foreground")}
        />
      )
    default:
      return (
        <File
          aria-hidden
          className={cn(THUMB_TYPE_ICON_CLASS, "text-muted-foreground")}
        />
      )
  }
}

function dropzoneSurfaceClassNames(
  interactive: boolean,
  translucent: boolean,
  isDragging: boolean
) {
  return cn(
    "relative z-0 flex flex-col items-center justify-center gap-3 rounded-[15px] border border-border/90 px-6",
    "min-h-44 py-8",
    "shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_rgba(0,0,0,0.05)]",
    "dark:border-border dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_1px_2px_rgba(0,0,0,0.35),0_4px_20px_rgba(0,0,0,0.35)]",
    "outline-none transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200 ease-out",
    interactive &&
      "hover:border-ring/50 hover:shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_1px_2px_rgba(0,0,0,0.09),0_4px_14px_rgba(0,0,0,0.11)]",
    interactive &&
      "dark:hover:border-zinc-500/60 dark:hover:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_2px_rgba(0,0,0,0.42),0_4px_20px_rgba(0,0,0,0.48)]",
    interactive &&
      "focus-within:border-ring/70 focus-within:shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_1px_2px_rgba(0,0,0,0.09),0_4px_14px_rgba(0,0,0,0.11)]",
    interactive &&
      "dark:focus-within:border-zinc-500/55 dark:focus-within:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_2px_rgba(0,0,0,0.42),0_4px_20px_rgba(0,0,0,0.48)]",
    translucent && "backdrop-blur-xl backdrop-saturate-150",
    isDragging && "shadow-md"
  )
}

interface DropzoneBodyProps {
  cf: ReturnType<typeof crossfade>
  cfTransition: ReturnType<typeof crossfadeTransition>
  disabled: boolean
  emptyLabel: string
  formatHint: string | null
  idleIcon?: ReactNode
  imageObjectUrls: Record<string, string>
  reduceMotion: boolean
  showSuccess: boolean
  showSuccessThumbnails: boolean
  successLabel: string
  uploadedFiles: File[]
}

function DropzoneBody({
  cf,
  cfTransition,
  disabled,
  emptyLabel,
  formatHint,
  idleIcon,
  imageObjectUrls,
  reduceMotion,
  showSuccess,
  showSuccessThumbnails,
  successLabel,
  uploadedFiles,
}: DropzoneBodyProps) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {showSuccess ? (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn(
            "flex w-full max-w-full flex-col items-center gap-4 text-center",
            showSuccessThumbnails ? "min-h-0" : "min-h-[8.5rem] justify-center"
          )}
          exit={cf.exit}
          initial={cf.initial}
          key="success"
          transition={cfTransition}
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
                const k = fileKey(file)
                const isImage = file.type.startsWith("image/")
                const src = imageObjectUrls[k]
                return (
                  <motion.li
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      filter: "blur(0px)",
                    }}
                    className="flex w-19 min-w-0 flex-col items-center gap-1.5"
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, scale: 0.94, y: 6, filter: "blur(4px)" }
                    }
                    key={k}
                    transition={{
                      type: "spring",
                      duration: 0.3,
                      bounce: 0,
                      delay: reduceMotion ? 0 : 0.04 + i * 0.055,
                    }}
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-[11px] bg-muted/25 shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_4px_14px_rgba(0,0,0,0.12)] ring-1 ring-black/12 ring-inset",
                        "dark:bg-white/4 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_6px_16px_rgba(0,0,0,0.35)] dark:ring-white/12"
                      )}
                      style={{
                        height: THUMB_PX,
                        width: THUMB_PX,
                      }}
                    >
                      {isImage && src ? (
                        <img
                          alt=""
                          className="size-full object-cover"
                          decoding="async"
                          height={THUMB_PX}
                          src={src}
                          width={THUMB_PX}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-linear-to-b from-muted/40 to-muted/5 p-1.5">
                          <DropzoneFileTypeGlyph file={file} />
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
          exit={cf.exit}
          initial={cf.initial}
          key="idle"
          transition={cfTransition}
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
  )
}

export interface HaloDropzoneProps {
  className?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  /** Frosted glass fill (matches composer translucent mode). */
  translucent?: boolean
  /** Called after files are chosen via drop or picker. */
  onFiles?: (files: File[]) => void
  /**
   * Clear the success state after this many ms. `0` keeps success until the next
   * drop or until the user picks again.
   */
  successResetMs?: number
  /** Primary line in the idle slot. */
  emptyLabel?: string
  /** Line under the filename in the success slot. */
  successLabel?: string
  /** Optional icon override for the idle slot (defaults to upload). */
  idleIcon?: ReactNode
  /** Secondary line under the title; set `null` to hide. */
  formatHint?: string | null
  /**
   * When the dropzone shows success, render thumbnail previews inside the zone.
   * Set `false` if you show file details (e.g. upload rows) below the dropzone.
   */
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

  const ariaFileSummary = useMemo(() => {
    if (uploadedFiles.length === 0) {
      return ""
    }
    if (uploadedFiles.length === 1) {
      return uploadedFiles[0]?.name ?? ""
    }
    return `${uploadedFiles.length} files: ${uploadedFiles.map((f) => f.name).join(", ")}`
  }, [uploadedFiles])

  const cf = useMemo(() => crossfade(reduceMotion), [reduceMotion])
  const cfTransition = useMemo(
    () => crossfadeTransition(reduceMotion),
    [reduceMotion]
  )

  const interactive = !disabled
  const rimEmphasis =
    interactive && (isHovered || isFocused || isDragging || showSuccess)

  const borderGlow = useMemo(
    () => dropzoneBorderGlowConfig(translucent, rimEmphasis),
    [translucent, rimEmphasis]
  )

  const fillBackground = useMemo(
    () => dropzoneFillBackgroundFor(translucent, interactive, rimEmphasis),
    [translucent, interactive, rimEmphasis]
  )

  const showTrailChrome = interactive && !reduceMotion
  const trailActive = interactive && (isHovered || isFocused || isDragging)

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  const imageObjectUrls = useMemo(() => {
    const next: Record<string, string> = {}
    for (const f of uploadedFiles) {
      const k = fileKey(f)
      if (f.type.startsWith("image/")) {
        next[k] = URL.createObjectURL(f)
      }
    }
    return next
  }, [uploadedFiles])

  useEffect(() => {
    const urls = imageObjectUrls
    return () => {
      for (const u of Object.values(urls)) {
        URL.revokeObjectURL(u)
      }
    }
  }, [imageObjectUrls])

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

      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: <label> is the activation surface for the hidden file input; drag/drop and keyboard mirror the native picker. */}
      <label
        aria-disabled={disabled || undefined}
        aria-label={
          showSuccess && ariaFileSummary
            ? `${successLabel}: ${ariaFileSummary}`
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
          <DropzoneCardRimBlobs
            borderGlow={borderGlow}
            reduceMotion={reduceMotion}
          />

          <div
            className={dropzoneSurfaceClassNames(
              interactive,
              translucent,
              isDragging
            )}
            style={{ background: fillBackground }}
          >
            <DropzoneBody
              cf={cf}
              cfTransition={cfTransition}
              disabled={disabled}
              emptyLabel={emptyLabel}
              formatHint={formatHint}
              idleIcon={idleIcon}
              imageObjectUrls={imageObjectUrls}
              reduceMotion={reduceMotion}
              showSuccess={showSuccess}
              showSuccessThumbnails={showSuccessThumbnails}
              successLabel={successLabel}
              uploadedFiles={uploadedFiles}
            />
          </div>

          {showTrailChrome ? (
            <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl">
              <DropzoneCardBorderTrail active={trailActive} />
            </div>
          ) : null}
        </div>
      </label>
    </div>
  )
}

/** True when we should treat the file as an image for previews (MIME or extension). */
function looksLikeImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true
  }
  const ext = file.name.split(".").pop()?.toLowerCase()
  return (
    ext === "png" ||
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "gif" ||
    ext === "webp" ||
    ext === "avif" ||
    ext === "svg" ||
    ext === "bmp" ||
    ext === "ico"
  )
}

/**
 * Blob URL for local image previews. Created in `useEffect` (not `useMemo`) so React
 * Strict Mode’s effect cleanup/re-run does not leave a memoized revoked URL.
 */
function useImageObjectUrl(file: File): string | null {
  const [url, setUrl] = useState<string | null>(null)
  const prevFileRef = useRef(file)

  useEffect(() => {
    prevFileRef.current = file
    let objectUrl: string | null = null

    if (!looksLikeImageFile(file)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing URL when file is not an image
      setUrl(null)
      return
    }

    objectUrl = URL.createObjectURL(file)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setting blob URL for image preview
    setUrl(objectUrl)

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [file])

  return url
}

export function formatFileBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—"
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  }
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}

export interface DropzoneUploadFileRowProps {
  file: File
  /** 0–100 upload progress. */
  progress: number
  /** When true, bar uses success styling (full width). */
  complete?: boolean
  onRemove?: () => void
  className?: string
}

export function DropzoneUploadFileRow({
  file,
  progress,
  complete = false,
  onRemove,
  className,
}: DropzoneUploadFileRowProps) {
  const reduceMotion = useReducedMotion() ?? false
  const pct = Math.min(100, Math.max(0, progress))
  const widthPct = complete ? 100 : pct
  const isImage = looksLikeImageFile(file)
  const imageObjectUrl = useImageObjectUrl(file)

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/90 p-3 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_2px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.06)]",
        "dark:border-border dark:bg-card/60 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_4px_20px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-background",
            "shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_2px_6px_rgba(15,23,42,0.08)] ring-1 ring-black/8",
            "dark:bg-muted/40 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_2px_8px_rgba(0,0,0,0.35)] dark:ring-white/10"
          )}
        >
          {isImage && imageObjectUrl ? (
            <img
              alt=""
              className="size-full object-cover"
              decoding="async"
              height={44}
              src={imageObjectUrl}
              width={44}
            />
          ) : (
            <DropzoneFileTypeGlyph file={file} />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground text-sm leading-tight tracking-tight">
                {file.name}
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs tabular-nums leading-none">
                {formatFileBytes(file.size)}
              </p>
            </div>
            {onRemove ? (
              <button
                aria-label={`Remove ${file.name}`}
                className={cn(
                  "shrink-0 rounded-md p-1 text-muted-foreground transition-[color,transform] duration-150",
                  "hover:bg-muted hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  "active:scale-[0.96] motion-reduce:active:scale-100"
                )}
                onClick={onRemove}
                type="button"
              >
                <X aria-hidden className="size-4" strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(pct)}
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 ease-out",
              complete
                ? "bg-emerald-500/90 dark:bg-emerald-400/90"
                : "bg-linear-to-r from-[#ff0080] via-[#7928ca] to-[#0070f3] dark:opacity-95",
              reduceMotion && "duration-75"
            )}
            style={{ width: `${widthPct}%` }}
          />
        </div>
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          {Math.round(complete ? 100 : pct)}%
        </span>
      </div>
    </div>
  )
}

export interface QueuedFile {
  id: string
  file: File
  progress: number
  done: boolean
}

interface DropzoneUploadFileListProps {
  items: QueuedFile[]
  onRemove: (id: string) => void
  className?: string
}

/** Renders stacked upload rows; drive `progress` / `done` from your upload logic. */
export function DropzoneUploadFileList({
  items,
  onRemove,
  className,
}: DropzoneUploadFileListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <DropzoneUploadFileRow
            complete={item.done}
            file={item.file}
            onRemove={() => onRemove(item.id)}
            progress={item.done ? 100 : item.progress}
          />
        </li>
      ))}
    </ul>
  )
}

/**
 * Minimal document thumbnails + extension badges (reference: polished file-type grid).
 */

export type FilePlaceholderKind =
  | "generic"
  | "pdf"
  | "doc"
  | "sheet"
  | "txt"
  | "json"
  | "md"
  | "ppt"

const BADGE: Record<
  Exclude<FilePlaceholderKind, "generic">,
  { label: string; className: string }
> = {
  pdf: { label: "PDF", className: "bg-[#ef4444]" },
  doc: { label: "DOC", className: "bg-[#1d4ed8]" },
  sheet: { label: "XLX", className: "bg-[#059669]" },
  txt: { label: "TXT", className: "bg-[#f97316]" },
  json: { label: "JSON", className: "bg-[#eab308]" },
  md: { label: "MD", className: "bg-[#1e293b]" },
  ppt: { label: "PPT", className: "bg-[#ea580c]" },
}

export function inferPlaceholderKind(file: File): FilePlaceholderKind {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const t = file.type

  if (t === "application/pdf" || ext === "pdf") {
    return "pdf"
  }
  if (
    t.includes("wordprocessingml") ||
    t === "application/msword" ||
    ext === "doc" ||
    ext === "docx"
  ) {
    return "doc"
  }
  if (
    t.includes("spreadsheet") ||
    t.includes("excel") ||
    t === "text/csv" ||
    ["xls", "xlsx", "csv", "ods"].includes(ext)
  ) {
    return "sheet"
  }
  if (t === "text/plain" || ext === "txt") {
    return "txt"
  }
  if (t.includes("json") || ext === "json") {
    return "json"
  }
  if (ext === "md" || ext === "mdx" || t.includes("markdown")) {
    return "md"
  }
  if (
    t.includes("presentation") ||
    t.includes("powerpoint") ||
    ext === "ppt" ||
    ext === "pptx"
  ) {
    return "ppt"
  }
  return "generic"
}

function LineRows({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {[0.92, 0.78, 0.85, 0.65].map((w) => (
        <div
          className="h-1 rounded-full bg-zinc-200/90 dark:bg-zinc-300/50"
          key={w}
          style={{ width: `${w * 100}%` }}
        />
      ))}
    </div>
  )
}

function PlaceholderArt({ kind }: { kind: FilePlaceholderKind }) {
  switch (kind) {
    case "generic":
      return (
        <div className="flex flex-col gap-2">
          <div className="mx-auto size-8 rounded-full bg-zinc-200/80 dark:bg-zinc-300/40" />
          <LineRows />
        </div>
      )
    case "pdf":
    case "doc":
      return <LineRows />
    case "sheet":
      return (
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
          }}
        >
          {Array.from({ length: 16 }, (_, i) => {
            const row = Math.floor(i / 4)
            const col = i % 4
            return (
              <div
                className="aspect-square rounded-[1px] bg-zinc-200/85 dark:bg-zinc-300/45"
                key={`${row}-${col}`}
              />
            )
          })}
        </div>
      )
    case "txt":
      return (
        <svg
          aria-hidden="true"
          className="h-full w-full text-zinc-300"
          viewBox="0 0 48 56"
        >
          <path
            d="M4 12 Q12 8 16 14 T28 12 T40 18 M4 22 Q14 18 20 24 T36 22 M6 32 Q12 28 18 34 T34 30 M8 42 Q16 38 22 44 T38 40"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      )
    case "json":
      return (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 w-full rounded bg-[#3b82f6]/80" />
          <div className="h-1.5 w-[88%] rounded bg-[#eab308]/90" />
          <div className="h-1.5 w-full rounded bg-[#22c55e]/85" />
          <div className="h-1.5 w-[72%] rounded bg-[#3b82f6]/70" />
        </div>
      )
    case "md":
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 size-1 shrink-0 rounded-full bg-zinc-400" />
            <div className="h-1 flex-1 rounded-full bg-zinc-200/90 dark:bg-zinc-300/45" />
          </div>
          <div className="h-1 w-[92%] rounded-full bg-zinc-200/90 dark:bg-zinc-300/45" />
          <div className="h-1 w-[78%] rounded-full bg-zinc-200/90 dark:bg-zinc-300/45" />
        </div>
      )
    case "ppt":
      return (
        <div className="flex flex-col gap-1.5">
          <div className="aspect-video w-full rounded bg-zinc-200/90 dark:bg-zinc-300/45" />
          <div className="flex gap-1">
            <div className="h-5 flex-1 rounded bg-zinc-200/80 dark:bg-zinc-300/40" />
            <div className="h-5 flex-1 rounded bg-zinc-200/80 dark:bg-zinc-300/40" />
          </div>
        </div>
      )
    default:
      return <LineRows />
  }
}

export function FileTypePlaceholder({
  kind,
  className,
}: {
  kind: FilePlaceholderKind
  className?: string
}) {
  const badge = kind === "generic" ? null : BADGE[kind]

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:bg-zinc-100/95 dark:ring-white/10",
        className
      )}
    >
      {/* Dog-ear */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 size-7 bg-linear-to-br from-zinc-200/90 to-zinc-300/50 dark:from-zinc-300/60 dark:to-zinc-400/30"
        style={{
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
        }}
      />

      <div className="p-3 pt-4 pb-7">
        <PlaceholderArt kind={kind} />
      </div>

      {badge ? (
        <span
          className={cn(
            "absolute right-1.5 bottom-1.5 rounded-md px-1.5 py-0.5 font-bold text-[9px] text-white uppercase leading-none tracking-wide shadow-sm",
            badge.className
          )}
          aria-label={`${badge.label} file`}
        >
          {badge.label}
        </span>
      ) : null}
    </div>
  )
}
