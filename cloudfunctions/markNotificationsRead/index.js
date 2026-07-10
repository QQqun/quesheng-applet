const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, collection, docId, data, docIds } = event

  if (action === 'markRead') {
    // 批量标记已读：按 userId 查询未读通知并更新
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    // 先通过 openid 查找用户手机号
    const userRes = await db.collection('users').where({ _openid: openid }).limit(1).get()
    const userId = userRes.data.length > 0 ? (userRes.data[0].phone || userRes.data[0].username) : ''

    if (!userId) return { success: false, error: '无法识别用户' }

    const res = await db.collection('notifications').where({
      userId: userId,
      isRead: false
    }).update({ data: { isRead: true } })

    return { success: true, updated: res.stats.updated }
  }

  if (action === 'updateDoc') {
    // 更新单个文档
    if (!collection || !docId || !data) {
      return { success: false, error: '参数不完整' }
    }
    try {
      const res = await db.collection(collection).doc(docId).update({ data })
      return { success: true, updated: res.stats.updated }
    } catch (err) {
      console.error('updateDoc error:', err)
      return { success: false, error: err.message }
    }
  }

  if (action === 'removeDoc') {
    // 删除单个文档
    if (!collection || !docId) {
      return { success: false, error: '参数不完整' }
    }
    try {
      const res = await db.collection(collection).doc(docId).remove()
      return { success: true, removed: res.stats.removed }
    } catch (err) {
      console.error('removeDoc error:', err)
      return { success: false, error: err.message }
    }
  }

  if (action === 'removeDocs') {
    // 批量删除文档
    if (!collection || !docIds || !Array.isArray(docIds)) {
      return { success: false, error: '参数不完整' }
    }
    try {
      let removed = 0
      for (const id of docIds) {
        const res = await db.collection(collection).doc(id).remove()
        removed += res.stats.removed
      }
      return { success: true, removed }
    } catch (err) {
      console.error('removeDocs error:', err)
      return { success: false, error: err.message }
    }
  }

  return { success: false, error: '未知操作' }
}
