// 生成随机id
export function getUuid() {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  return `${s4() + s4()}${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}`
}

export function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

export function getDisplayName(user) {
  if (!user) return '未知用户'
  return user.nickName || user.nickname || user.phone || '未知用户'
}