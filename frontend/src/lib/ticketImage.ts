import QRCode from 'qrcode'

export type TicketImageInput = {
  eventTitle: string
  eventStart?: string | Date | null
  venue?: string | null
  city?: string | null
  holderName: string
  ticketType: string
  ticketCode: string
  orderShortId: string
  status?: string
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
      if (lines.length === maxLines - 1) break
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  if (words.length && lines.length === maxLines) {
    const last = lines[maxLines - 1]
    if (ctx.measureText(text).width > maxWidth || words.join(' ') !== lines.join(' ')) {
      let truncated = last
      while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
        truncated = truncated.slice(0, -1)
      }
      lines[maxLines - 1] = `${truncated}…`
    }
  }
  return lines.length ? lines : [text]
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Renders a premium event ticket onto a canvas and returns a PNG blob. */
export async function renderTicketPng(input: TicketImageInput): Promise<Blob> {
  const W = 1200
  const H = 560
  const stubW = 320
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  // Soft page background (transparent export — fill ticket body only)
  ctx.clearRect(0, 0, W, H)

  // Shadow
  ctx.save()
  ctx.shadowColor = 'rgba(15, 23, 42, 0.28)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 18
  roundRect(ctx, 24, 24, W - 48, H - 48, 28)
  ctx.fillStyle = '#0b1f14'
  ctx.fill()
  ctx.restore()

  // Clip ticket card
  ctx.save()
  roundRect(ctx, 24, 24, W - 48, H - 48, 28)
  ctx.clip()

  // Main panel gradient (deep forest → teal)
  const mainGrad = ctx.createLinearGradient(stubW, 0, W, H)
  mainGrad.addColorStop(0, '#0f291c')
  mainGrad.addColorStop(0.45, '#14532d')
  mainGrad.addColorStop(1, '#0ea5a4')
  ctx.fillStyle = mainGrad
  ctx.fillRect(24, 24, W - 48, H - 48)

  // Atmospheric orbs
  const orb1 = ctx.createRadialGradient(980, 120, 20, 980, 120, 260)
  orb1.addColorStop(0, 'rgba(74, 222, 128, 0.35)')
  orb1.addColorStop(1, 'rgba(74, 222, 128, 0)')
  ctx.fillStyle = orb1
  ctx.fillRect(24, 24, W - 48, H - 48)

  const orb2 = ctx.createRadialGradient(420, 480, 10, 420, 480, 220)
  orb2.addColorStop(0, 'rgba(45, 212, 191, 0.25)')
  orb2.addColorStop(1, 'rgba(45, 212, 191, 0)')
  ctx.fillStyle = orb2
  ctx.fillRect(24, 24, W - 48, H - 48)

  // Subtle diagonal stripe texture
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  for (let i = -H; i < W; i += 18) {
    ctx.beginPath()
    ctx.moveTo(24 + i, 24)
    ctx.lineTo(24 + i + H, 24 + H)
    ctx.stroke()
  }
  ctx.restore()

  // Stub panel (left)
  const stubGrad = ctx.createLinearGradient(24, 24, stubW + 24, H)
  stubGrad.addColorStop(0, '#052e1a')
  stubGrad.addColorStop(1, '#0a3d28')
  ctx.fillStyle = stubGrad
  ctx.fillRect(24, 24, stubW, H - 48)

  // Perforation line
  const perfX = 24 + stubW
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.setLineDash([6, 10])
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(perfX, 48)
  ctx.lineTo(perfX, H - 48)
  ctx.stroke()
  ctx.restore()

  // Notch cutouts on perforation
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(perfX, 24, 14, 0, Math.PI * 2)
  ctx.arc(perfX, H - 24, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  // Re-clip after destination-out punched through — redraw outer isn't needed for download

  // Brand on stub
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '600 13px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillText('EVENTFLOW', 56, 64)
  ctx.fillStyle = '#4ade80'
  ctx.font = '700 11px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillText('ADMIT ONE', 56, 84)

  // QR
  const qrDataUrl = await QRCode.toDataURL(input.ticketCode, {
    width: 220,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#052e1a', light: '#ffffff' },
  })
  const qrImg = await loadImage(qrDataUrl)
  const qrSize = 180
  const qrX = 24 + (stubW - qrSize) / 2
  const qrY = 130
  roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 16)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(input.ticketCode, 24 + stubW / 2, qrY + qrSize + 42)
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '500 11px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Scan at entrance', 24 + stubW / 2, qrY + qrSize + 62)
  ctx.textAlign = 'left'

  // Main content
  const contentX = stubW + 64
  const contentRight = W - 56

  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = '600 12px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillText('YOUR TICKET', contentX, 72)

  // Type badge
  const typeLabel = (input.ticketType || 'General').toUpperCase()
  ctx.font = '700 12px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  const typeWidth = ctx.measureText(typeLabel).width + 28
  roundRect(ctx, contentRight - typeWidth, 56, typeWidth, 30, 999)
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 1
  roundRect(ctx, contentRight - typeWidth, 56, typeWidth, 30, 999)
  ctx.stroke()
  ctx.fillStyle = '#bbf7d0'
  ctx.textAlign = 'center'
  ctx.fillText(typeLabel, contentRight - typeWidth / 2, 76)
  ctx.textAlign = 'left'

  // Event title
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 42px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  const titleLines = wrapText(ctx, input.eventTitle || 'Event', contentRight - contentX - 20, 2)
  let titleY = 130
  for (const line of titleLines) {
    ctx.fillText(line, contentX, titleY)
    titleY += 50
  }

  // Accent line
  const accent = ctx.createLinearGradient(contentX, 0, contentX + 220, 0)
  accent.addColorStop(0, '#4ade80')
  accent.addColorStop(1, 'rgba(74,222,128,0)')
  ctx.fillStyle = accent
  ctx.fillRect(contentX, titleY + 4, 220, 4)

  // Meta grid
  const metaTop = titleY + 48
  const colW = (contentRight - contentX) / 2

  const dateStr = input.eventStart
    ? new Date(input.eventStart).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'TBA'

  const venueStr = [input.venue, input.city].filter(Boolean).join(' · ') || 'Venue TBA'

  const fields: Array<{ label: string; value: string; x: number; y: number }> = [
    { label: 'HOLDER', value: input.holderName || 'Guest', x: contentX, y: metaTop },
    { label: 'WHEN', value: dateStr, x: contentX + colW, y: metaTop },
    { label: 'WHERE', value: venueStr, x: contentX, y: metaTop + 90 },
    {
      label: 'ORDER',
      value: `#${input.orderShortId}`,
      x: contentX + colW,
      y: metaTop + 90,
    },
  ]

  for (const field of fields) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '700 11px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
    ctx.fillText(field.label, field.x, field.y)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 20px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
    const valueLines = wrapText(ctx, field.value, colW - 24, 2)
    let vy = field.y + 28
    for (const line of valueLines) {
      ctx.fillText(line, field.x, vy)
      vy += 26
    }
  }

  // Footer bar
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(stubW + 24, H - 88, W - stubW - 48, 64)

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '500 13px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillText(
    'Show this image at the door · Keep your phone brightness up',
    contentX,
    H - 52
  )

  const status = (input.status || 'valid').toUpperCase()
  ctx.fillStyle = status === 'VALID' ? '#86efac' : '#fde68a'
  ctx.font = '700 12px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(status, contentRight, H - 52)
  ctx.textAlign = 'left'

  ctx.restore()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to encode ticket image'))
      },
      'image/png',
      1
    )
  })
}

export async function downloadTicketImage(input: TicketImageInput) {
  const blob = await renderTicketPng(input)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ticket-${input.ticketCode}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
