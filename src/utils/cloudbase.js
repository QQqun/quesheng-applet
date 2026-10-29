import dayjs from 'dayjs'

const ENV_ID = 'cloud1-d5gw8fkm90605dfd6'

wx.cloud.init({
  env: ENV_ID
})

const db = wx.cloud.database()

function getCollection(name) {
  return db.collection(name)
}

const REQUIRED_COLLECTIONS = ['groups', 'scores', 'users', 'notifications', 'settlements']

// 集合不存在的错误码：-502005（客户端）/ errMsg 含 not exist
function isCollectionMissing(err) {
  return (
    err &&
    (err.errCode === -502005 ||
      err.errCode === -1 ||
      /not exist|not found|COLLECTION_NOT_EXIST/i.test(err.errMsg || ''))
  )
}

async function ensureCollections() {
  const checks = await Promise.all(
    REQUIRED_COLLECTIONS.map(async (collectionName) => {
      try {
        await db.collection(collectionName).limit(1).get()
        return null
      } catch (err) {
        return isCollectionMissing(err) ? collectionName : null
      }
    })
  )
  const missing = checks.filter(Boolean)
  if (missing.length === 0) return
  // 客户端 SDK 没有 createCollection，需由云函数以管理员权限创建
  try {
    const { result } = await wx.cloud.callFunction({
      name: 'initCollections',
      data: { collections: missing }
    })
    if (result && result.failed && result.failed.length > 0) {
      console.warn('集合创建失败:', result.failed)
    } else {
      console.log('已创建集合:', (result && result.created) || missing)
    }
  } catch (err) {
    console.warn('initCollections 云函数不可用，请在云开发控制台手动创建集合:', missing.join(', '), err)
  }
}

async function ensureLogin() {
  try {
    const { result } = await wx.cloud.callFunction({
      name: 'login'
    })
    return result
  } catch (err) {
    console.error('匿名登录失败:', err)
    if (err.errMsg?.includes('FunctionName')) {
      throw new Error('未部署 login 云函数，请在微信云开发控制台创建 login 云函数')
    }
    throw err
  }
}

async function addDoc(collection, data) {
  const now = dayjs().toDate()
  data.createTime = now
  data.updateTime = now
  try {
    const res = await getCollection(collection).add({ data })
    return { id: res._id }
  } catch (err) {
    // 集合未创建时先通过云函数建表，再重试写入（如 settlements / notifications）
    if (!isCollectionMissing(err)) throw err
    console.log(`表 ${collection} 不存在，正在尝试创建...`)
    await ensureCollections()
    const res = await getCollection(collection).add({ data })
    return { id: res._id }
  }
}

async function updateDoc(collection, docId, data) {
  data.updateTime = dayjs().toDate()
  return await getCollection(collection).doc(docId).update({ data })
}

async function removeDoc(collection, docId) {
  return await getCollection(collection).doc(docId).remove()
}

async function queryDocs(collection, whereObj) {
  let query = getCollection(collection)
  if (whereObj) {
    query = query.where(whereObj)
  }
  const res = await query.get()
  return res.data || []
}

// 客户端单次最多 20 条，改为先 count 再并行拉取，避免串行等待
const CLIENT_BATCH_SIZE = 20

async function queryAllDocs(collection, whereObj) {
  try {
    let countQuery = getCollection(collection)
    if (whereObj) countQuery = countQuery.where(whereObj)
    const { total } = await countQuery.count()

    if (!total) return []

    const pages = Math.ceil(total / CLIENT_BATCH_SIZE)
    const tasks = []
    for (let i = 0; i < pages; i++) {
      let query = getCollection(collection).skip(i * CLIENT_BATCH_SIZE).limit(CLIENT_BATCH_SIZE)
      if (whereObj) query = query.where(whereObj)
      tasks.push(query.get().catch(() => ({ data: [] })))
    }
    const results = await Promise.all(tasks)
    return results.reduce((acc, res) => acc.concat(res.data || []), [])
  } catch (err) {
    console.error('批量查询失败:', err)
    return []
  }
}

/**
 * 读取积分记录（优先云函数一次拉取，失败时降级为客户端并行查询）
 * @param {Object} options
 * @param {Array<string>} options.groupIds 群组ID数组
 * @param {string} [options.startDate] 开始日期 YYYY-MM-DD
 * @param {string} [options.endDate] 结束日期 YYYY-MM-DD
 */
async function queryScores({ groupIds = [], startDate, endDate } = {}) {
  if (!groupIds || groupIds.length === 0) return []

  try {
    if (typeof wx !== 'undefined' && wx.cloud && wx.cloud.callFunction) {
      const { result } = await wx.cloud.callFunction({
        name: 'getScores',
        data: { groupIds, startDate, endDate }
      })
      if (result && Array.isArray(result.data)) {
        return result.data
      }
    }
  } catch (err) {
    console.warn('getScores 云函数不可用，降级客户端查询:', err)
  }

  const _ = db.command
  const where = { groupId: _.in(groupIds) }
  if (startDate && endDate) {
    where.date = _.gte(startDate).and(_.lte(endDate))
  } else if (startDate) {
    where.date = _.gte(startDate)
  } else if (endDate) {
    where.date = _.lte(endDate)
  }
  return await queryAllDocs('scores', where)
}

const auth = {
  async signOut() {
    // 微信云开发无显式登出，清除本地登录态即可
    wx.removeStorageSync('cloud_login_state')
  }
}

export {
  db,
  auth,
  ENV_ID,
  ensureLogin,
  ensureCollections,
  getCollection,
  addDoc,
  updateDoc,
  removeDoc,
  queryDocs,
  queryAllDocs,
  queryScores
}
