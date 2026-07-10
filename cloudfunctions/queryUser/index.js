const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { collection, query } = event
  if (!collection || !query) {
    return { data: [] }
  }
  try {
    const res = await db.collection(collection).where(query).get()
    return { data: res.data || [] }
  } catch (err) {
    console.error('queryUser error:', err)
    return { data: [], error: err.message }
  }
}
