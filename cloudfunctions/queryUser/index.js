const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { collection, query, all } = event
  if (!collection || !query) {
    return { data: [] }
  }
  try {
    if (all) {
      const allData = []
      let batch = 0
      const BATCH_SIZE = 100
      while (true) {
        const res = await db.collection(collection).where(query).skip(batch * BATCH_SIZE).limit(BATCH_SIZE).get()
        const data = res.data || []
        allData.push(...data)
        if (data.length < BATCH_SIZE) break
        batch++
      }
      return { data: allData }
    }
    const res = await db.collection(collection).where(query).get()
    return { data: res.data || [] }
  } catch (err) {
    console.error('queryUser error:', err)
    return { data: [], error: err.message }
  }
}
