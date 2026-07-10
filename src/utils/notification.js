import { addDoc } from './cloudbase'

export async function createNotification({ userId, type, title, content, groupId, groupName }) {
  return await addDoc('notifications', {
    userId,
    type,
    title,
    content,
    groupId: groupId || '',
    groupName: groupName || '',
    isRead: false
  })
}
