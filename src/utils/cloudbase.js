const ENV_ID = 'cloud1-d5gw8fkm90605dfd6'

wx.cloud.init({
  env: ENV_ID
})

const db = wx.cloud.database()

function getCollection(name) {
  return db.collection(name)
}

const REQUIRED_COLLECTIONS = ['groups', 'scores']

async function ensureCollections() {
  for (const collectionName of REQUIRED_COLLECTIONS) {
    try {
      await db.collection(collectionName).limit(1).get()
    } catch (err) {
      if (err.errCode === -1 || err.errMsg?.includes('not exist')) {
        console.log(`表 ${collectionName} 不存在，正在创建...`)
        try {
          await db.createCollection(collectionName)
          console.log(`表 ${collectionName} 创建成功`)
        } catch (createErr) {
          console.error(`创建表 ${collectionName} 失败:`, createErr)
        }
      }
    }
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
  const now = new Date()
  data.createTime = now
  data.updateTime = now
  const res = await getCollection(collection).add({ data })
  return { id: res._id }
}

async function updateDoc(collection, docId, data) {
  data.updateTime = new Date()
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
  queryDocs
}
