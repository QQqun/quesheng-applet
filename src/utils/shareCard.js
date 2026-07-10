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

export function drawShareCard({
  canvasId,
  canvasWidth = 750,
  canvasHeight = 1000,
  title,
  subtitle,
  dataList,
  theme = '#22C55E'
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

        const cardPadding = 0
        const contentWidth = canvasWidth - cardPadding * 2

        // 1. 白色圆角背景
        drawRoundRect(ctx, cardPadding, cardPadding, contentWidth, canvasHeight, 24, '#ffffff')

        // 2. 顶部绿色渐变区域
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 200)
        gradient.addColorStop(0, theme)
        gradient.addColorStop(1, '#16A34A')
        drawRoundRect(ctx, cardPadding, cardPadding, contentWidth, 200, 24, gradient, true)

        // 3. 标题
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 36px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(title || '雀圣积分', 40, 80)

        // 4. 副标题
        ctx.font = '24px sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillText(subtitle || '', 40, 130)

        // 5. 数据列表
        let yOffset = 240
        const rowHeight = 56
        const maxRows = Math.min(dataList.length, Math.floor((canvasHeight - 320) / rowHeight))

        for (let i = 0; i < maxRows; i++) {
          const item = dataList[i]
          const y = yOffset + i * rowHeight

          // 排名
          if (i < 3) {
            const medals = ['#FFD700', '#C0C0C0', '#CD7F32']
            ctx.fillStyle = medals[i]
            ctx.font = 'bold 28px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(`${i + 1}`, 40, y)
            // 画一个圆形背景
            ctx.beginPath()
            ctx.arc(40, y - 8, 14, 0, 2 * Math.PI)
            ctx.fillStyle = medals[i]
            ctx.fill()
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 18px sans-serif'
            ctx.fillText(`${i + 1}`, 40, y - 2)
          } else {
            ctx.fillStyle = '#6b7280'
            ctx.font = 'bold 24px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(`${i + 1}`, 40, y)
          }

          // 姓名
          ctx.fillStyle = '#1f2937'
          ctx.font = '28px sans-serif'
          ctx.textAlign = 'left'
          const nameText = item.name || ''
          ctx.fillText(nameText.length > 8 ? nameText.substring(0, 8) + '...' : nameText, 80, y)

          // 积分
          const score = item.score || 0
          ctx.fillStyle = score >= 0 ? '#22C55E' : '#ef4444'
          ctx.font = 'bold 28px sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText(`${score >= 0 ? '+' : ''}${score}`, canvasWidth - 40, y)

          // 分割线
          if (i < maxRows - 1) {
            ctx.beginPath()
            ctx.moveTo(40, y + rowHeight / 2)
            ctx.lineTo(canvasWidth - 40, y + rowHeight / 2)
            ctx.strokeStyle = '#f3f4f6'
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }

        // 6. 底部品牌
        const brandY = canvasHeight - 60
        ctx.fillStyle = '#9ca3af'
        ctx.font = '20px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('雀圣积分助手', canvasWidth / 2, brandY)

        // 7. 导出图片
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
