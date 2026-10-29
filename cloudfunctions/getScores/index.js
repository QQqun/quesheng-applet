const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const BATCH_SIZE = 100
const MAX_BATCHES = 50

exports.main = async (event) => {
  const { groupIds = [], startDate, endDate } = event || {}
  if (!Array.isArray(groupIds) || groupIds.length === 0) {
    return { data: [] }
  }

  const where = { groupId: _.in(groupIds) }
  if (startDate && endDate) {
    where.date = _.gte(startDate).and(_.lte(endDate))
  } else if (startDate) {
    where.date = _.gte(startDate)
  } else if (endDate) {
    where.date = _.lte(endDate)
  }

  try {
    const { total } = await db.collection('scores').where(where).count()
    if (!total) return { data: [], total: 0 }

    const pages = Math.min(Math.ceil(total / BATCH_SIZE), MAX_BATCHES)
    const tasks = []
    for (let i = 0; i < pages; i++) {
      tasks.push(
        db
          .collection('scores')
          .where(where)
          .skip(i * BATCH_SIZE)
          .limit(BATCH_SIZE)
          .get()
          .catch(() => ({ data: [] }))
      )
    }

    const results = await Promise.all(tasks)
    const data = results.reduce((acc, res) => acc.concat(res.data || []), [])
    return { data, total }
  } catch (err) {
    console.error('getScores error:', err)
    return { data: [], error: err.message }
  }
}
