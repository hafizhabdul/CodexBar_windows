import { nativeImage, NativeImage } from 'electron'
import type { UsageSnapshot } from '../../shared/types'

const ICON_SIZE = 16

export function createMeterIcon(snapshots: UsageSnapshot[]): NativeImage {
  // Create a simple 16x16 icon using raw RGBA pixel data
  const buffer = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4, 0)

  if (snapshots.length === 0) {
    // Default gray icon when no data
    drawDefaultIcon(buffer)
  } else {
    drawMeterBars(buffer, snapshots)
  }

  return nativeImage.createFromBuffer(buffer, {
    width: ICON_SIZE,
    height: ICON_SIZE,
  })
}

function drawDefaultIcon(buffer: Buffer) {
  // Draw a simple meter shape in gray
  const gray = [128, 128, 128, 255]
  const barWidth = 12
  const startX = 2

  // Top bar (session) - 40% filled
  drawBar(buffer, startX, 4, barWidth, 3, gray, 0.4)
  // Bottom bar (weekly) - 20% filled
  drawBar(buffer, startX, 10, barWidth, 2, gray, 0.2)
}

function drawMeterBars(buffer: Buffer, snapshots: UsageSnapshot[]) {
  const primary = snapshots[0]
  if (!primary) {
    drawDefaultIcon(buffer)
    return
  }

  const sessionPct = primary.session?.limit
    ? Math.min(1, primary.session.used / primary.session.limit)
    : 0
  const weeklyPct = primary.weekly?.limit
    ? Math.min(1, primary.weekly.used / primary.weekly.limit)
    : 0

  // Color based on usage level
  const sessionColor = getColorForUsage(sessionPct)
  const weeklyColor = getColorForUsage(weeklyPct)
  const bgColor = [60, 60, 60, 255]

  const barWidth = 12
  const startX = 2

  // Background bars
  drawBar(buffer, startX, 4, barWidth, 3, bgColor, 1.0)
  drawBar(buffer, startX, 10, barWidth, 2, bgColor, 1.0)

  // Filled portions
  if (sessionPct > 0) drawBar(buffer, startX, 4, barWidth, 3, sessionColor, sessionPct)
  if (weeklyPct > 0) drawBar(buffer, startX, 10, barWidth, 2, weeklyColor, weeklyPct)
}

function drawBar(
  buffer: Buffer,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number[],
  fillPct: number
) {
  const filledWidth = Math.round(width * fillPct)
  for (let row = y; row < y + height && row < ICON_SIZE; row++) {
    for (let col = x; col < x + filledWidth && col < ICON_SIZE; col++) {
      const idx = (row * ICON_SIZE + col) * 4
      buffer[idx] = color[0]     // R
      buffer[idx + 1] = color[1] // G
      buffer[idx + 2] = color[2] // B
      buffer[idx + 3] = color[3] // A
    }
  }
}

function getColorForUsage(pct: number): number[] {
  if (pct >= 0.9) return [239, 68, 68, 255]   // Red
  if (pct >= 0.7) return [245, 158, 11, 255]   // Amber
  if (pct >= 0.4) return [59, 130, 246, 255]   // Blue
  return [34, 197, 94, 255]                     // Green
}
