const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { collection, docId, data } = event
  if (!collection || !docId || !data) {
    return { success: false, error: '缺少必要参数' }
  }
  try {
    data.updateTime = new Date()
    await db.collection(collection).doc(docId).update({ data })
    return { success: true }
  } catch (err) {
    console.error('updateUser error:', err)
    return { success: false, error: err.message }
  }
}
