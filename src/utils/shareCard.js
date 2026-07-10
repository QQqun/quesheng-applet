function drawRoundRect(ctx, x, y, w, h, r, fillStyle, onlyTop) {
  ctx.beginPath()
  if (onlyTop) {
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.lineTo(x + w, y + h)
    ctx.lineTo(x, y + h)
    ctx.arcTo(x, y, x + w, y, r)
  } else {
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
  }
  ctx.closePath()
  ctx.fillStyle = fillStyle
  ctx.fill()
}

function drawStar(ctx, cx, cy, outerR, innerR, fillStyle) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = fillStyle
  ctx.fill()
}

function drawAvatar(ctx, x, y, size, text, bgColor = '#e5e7eb', textColor = '#4b5563') {
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, 2 * Math.PI)
  ctx.fillStyle = bgColor
  ctx.fill()
  ctx.fillStyle = textColor
  ctx.font = `bold ${Math.floor(size * 0.45)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + size / 2, y + size / 2 + 1)
}

function drawRankBadge(ctx, x, y, size, rank, bgColor, textColor) {
  drawRoundRect(ctx, x, y, size, size, size / 2, bgColor)
  ctx.fillStyle = textColor
  ctx.font = `bold ${Math.floor(size * 0.55)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${rank}`, x + size / 2, y + size / 2 + 1)
}

function formatNumber(num) {
  return Number(num).toLocaleString('en-US')
}

export function drawShareCard({
  canvasId,
  canvasWidth = 750,
  canvasHeight = 1200,
  title,
  subtitle,
  dataList,
  primaryColor = '#5B4DFF'
}) {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) { reject(new Error('canvas not found')); return }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = uni.getSystemInfoSync().pixelRatio
        canvas.width = canvasWidth * dpr
        canvas.height = canvasHeight * dpr
        ctx.scale(dpr, dpr)

        // 白色背景
        drawRoundRect(ctx, 0, 0, canvasWidth, canvasHeight, 32, '#ffffff')

        // 标题
        let currentY = 60
        if (title) {
          ctx.fillStyle = '#111827'
          ctx.font = 'bold 40px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(title, canvasWidth / 2, currentY)
          currentY += 30
        }
        if (subtitle) {
          ctx.fillStyle = '#6b7280'
          ctx.font = '24px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(subtitle, canvasWidth / 2, currentY)
          currentY += 40
        } else {
          currentY += 30
        }

        // 领奖台底部基准线
        const podiumBaseY = currentY + 220
        const centerX = canvasWidth / 2

        // 领奖台配置 [原始索引, 柱宽, 柱高, 柱颜色, badge背景色, badge文字色]
        const configs = [
          { rank: 2, width: 180, height: 110, barColor: '#F3F4F6', badgeBg: '#F3F4F6', badgeText: '#6b7280', xOffset: -200 },
          { rank: 1, width: 230, height: 170, barColor: primaryColor, badgeBg: '#EDE9FE', badgeText: primaryColor, xOffset: 0 },
          { rank: 3, width: 180, height: 80, barColor: '#E5E7EB', badgeBg: '#F3F4F6', badgeText: '#6b7280', xOffset: 215 }
        ]

        const topList = dataList.slice(0, 3)

        configs.forEach((cfg) => {
          const dataIndex = cfg.rank - 1
          if (dataIndex >= topList.length) return
          const item = topList[dataIndex]
          const barX = centerX + cfg.xOffset - cfg.width / 2
          const barY = podiumBaseY - cfg.height

          // 柱子
          drawRoundRect(ctx, barX, barY, cfg.width, cfg.height, 20, cfg.barColor, true)

          // 头像
          const avatarSize = 64
          const avatarX = centerX + cfg.xOffset - avatarSize / 2
          const avatarY = barY - avatarSize - 48
          const surname = (item.name || '?').charAt(0)
          drawAvatar(ctx, avatarX, avatarY, avatarSize, surname, cfg.rank === 1 ? '#DDD8FF' : '#E5E7EB', cfg.rank === 1 ? primaryColor : '#4b5563')

          // 排名 badge
          const badgeSize = 32
          const badgeX = centerX + cfg.xOffset - badgeSize / 2
          const badgeY = avatarY - badgeSize - 14
          drawRankBadge(ctx, badgeX, badgeY, badgeSize, cfg.rank, cfg.badgeBg, cfg.badgeText)

          // 第一名星星
          if (cfg.rank === 1) {
            drawStar(ctx, centerX + cfg.xOffset, badgeY - 22, 12, 5, primaryColor)
          }

          // 姓名
          ctx.fillStyle = '#111827'
          ctx.font = cfg.rank === 1 ? 'bold 30px sans-serif' : '28px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'alphabetic'
          const nameText = item.name || ''
          ctx.fillText(nameText.length > 6 ? nameText.substring(0, 6) + '..' : nameText, centerX + cfg.xOffset, avatarY + avatarSize + 38)

          // 分数
          ctx.fillStyle = '#111827'
          ctx.font = cfg.rank === 1 ? 'bold 40px sans-serif' : 'bold 32px sans-serif'
          ctx.fillText(formatNumber(item.score || 0), centerX + cfg.xOffset, avatarY + avatarSize + 82)
        })

        // 下方列表背景卡片
        const listTopY = podiumBaseY + 60
        const listBottomPadding = 30
        const rowHeight = 88
        const remainingList = dataList.slice(3, 10)
        const listCardHeight = remainingList.length * rowHeight + listBottomPadding
        const cardMargin = 30
        drawRoundRect(ctx, cardMargin, listTopY, canvasWidth - cardMargin * 2, listCardHeight, 24, '#F8FAFC')

        // 列表行
        remainingList.forEach((item, index) => {
          const y = listTopY + 24 + index * rowHeight
          const rank = index + 4

          // 排名
          ctx.fillStyle = '#9ca3af'
          ctx.font = '28px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${rank}`, cardMargin + 40, y + rowHeight / 2)

          // 头像
          const avatarSize = 48
          const avatarX = cardMargin + 78
          const avatarY = y + (rowHeight - avatarSize) / 2
          const surname = (item.name || '?').charAt(0)
          drawAvatar(ctx, avatarX, avatarY, avatarSize, surname, '#E5E7EB', '#4b5563')

          // 姓名
          ctx.fillStyle = '#111827'
          ctx.font = '28px sans-serif'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          const nameText = item.name || ''
          ctx.fillText(nameText.length > 8 ? nameText.substring(0, 8) + '..' : nameText, avatarX + avatarSize + 20, y + rowHeight / 2)

          // 分数
          ctx.fillStyle = '#111827'
          ctx.font = 'bold 28px sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText(formatNumber(item.score || 0), canvasWidth - cardMargin - 30, y + rowHeight / 2)
        })

        // 底部品牌
        const brandY = listTopY + listCardHeight + 60
        ctx.fillStyle = '#9ca3af'
        ctx.font = '22px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText('雀圣积分助手', canvasWidth / 2, brandY)

        // 导出图片
        setTimeout(() => {
          uni.canvasToTempFilePath({
            canvas,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          })
        }, 300)
      })
  })
}

export function saveToAlbum(tempFilePath) {
  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: resolve,
      fail: reject
    })
  })
}
