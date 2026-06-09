import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = 'quesheng-ysl-mcdpdsydzdd-d6ff580'

const app = cloudbase.init({
  env: ENV_ID
})

const db = app.database()

const auth = app.auth({
  persistence: 'local'
})

function getCollection(name) {
  return db.collection(name)
}

// 需要自动创建的表集合
const REQUIRED_COLLECTIONS = ['groups', 'scores']

// 自动创建表
async function ensureCollections() {
  for (const collectionName of REQUIRED_COLLECTIONS) {
    try {
      // 尝试查询表，如果表不存在会抛出错误
      await db.collection(collectionName).limit(1).get()
    } catch (err) {
      if (err.code === 'DATABASE_COLLECTION_NOT_EXIST') {
        console.log(`表 ${collectionName} 不存在，正在创建...`)
        try {
          // 创建表
          await db.createCollection(collectionName)
          console.log(`表 ${collectionName} 创建成功`)
        } catch (createErr) {
          console.error(`创建表 ${collectionName} 失败:`, createErr)
          // 如果创建失败，继续尝试下一个表
        }
      }
    }
  }
}

async function ensureLogin() {
  const loginState = await auth.getLoginState()
  if (loginState) return loginState

  try {
    await auth.signInAnonymously()
    return auth.getLoginState()
  } catch (err) {
    console.error('匿名登录失败:', err)

    // 检查是否是匿名登录被禁用的错误
    if (err.error_code === 4045 || err.error === 'login_type_disabled') {
      throw new Error('匿名登录功能未开启，请联系开发者在腾讯云开发控制台的身份源列表中开启匿名登录')
    }

    throw err
  }
}

async function addDoc(collection, data) {
  const now = new Date()
  data.createTime = now
  data.updateTime = now
  return await getCollection(collection).add(data)
}

async function updateDoc(collection, docId, data) {
  data.updateTime = new Date()
  return await getCollection(collection).doc(docId).update(data)
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

export {
  app,
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
