const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const DEFAULT_COLLECTIONS = ['groups', 'scores', 'users', 'notifications', 'settlements']

/**
 * 创建云数据库集合（客户端 SDK 无 createCollection，必须由云函数以管理员权限执行）
 * 入参: { collections?: string[] }  不传则创建全部默认集合
 * 返回: { created: string[], existed: string[], failed: [{name, message}] }
 */
exports.main = async (event = {}) => {
  const targets =
    Array.isArray(event.collections) && event.collections.length > 0
      ? event.collections
      : DEFAULT_COLLECTIONS

  const created = []
  const existed = []
  const failed = []

  for (const name of targets) {
    try {
      await db.createCollection(name)
      created.push(name)
    } catch (err) {
      // 创建失败多半是集合已存在，用一次读取来确认
      try {
        await db.collection(name).limit(1).get()
        existed.push(name)
      } catch (readErr) {
        failed.push({ name, message: (err && (err.errMsg || err.message)) || String(err) })
      }
    }
  }

  return { created, existed, failed }
}
