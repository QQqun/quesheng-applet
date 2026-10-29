<template>
  <view class="qs-page group-page">
    <!-- 群组头图 -->
    <view class="qs-hero group-hero">
      <view class="hero-row">
        <view>
          <text class="hero-kicker">当前群组</text>
          <text class="hero-name">{{ groupName || '群组记分' }}</text>
        </view>
        <view class="hero-tag qs-chip">{{ sessions.length }} 场 · {{ dateLabel }}</view>
      </view>
      <view class="date-bar">
        <view class="date-arrow" @click="shiftDate(-1)">
          <u-icon name="arrow-left" size="16" color="#F4FBF7"></u-icon>
        </view>
        <view class="date-main" @click="showCalendar = true">
          <u-icon name="calendar-fill" size="17" color="#F2D98F"></u-icon>
          <text class="date-text">{{ date }}</text>
          <text class="date-week">{{ weekLabel }}</text>
        </view>
        <view class="date-arrow" @click="shiftDate(1)">
          <u-icon name="arrow-right" size="16" color="#F4FBF7"></u-icon>
        </view>
      </view>
    </view>

    <u-calendar
      :show="showCalendar"
      color="#E9C46A"
      mode="single"
      :minDate="minDate"
      :maxDate="maxDate"
      :monthNum="monthCount"
      :defaultDate="date"
      @close="showCalendar = false"
      @confirm="handleCalendarConfirm"
    ></u-calendar>

    <!-- 当日场次 -->
    <view class="section-head">
      <text class="qs-section-title">当日场次</text>
      <text class="qs-sub">{{ sessions.length }} 场 · 积分为 0 视为未参与</text>
    </view>

    <view class="session-list">
      <view
        v-for="(session, sIndex) in sessions"
        :key="session._id"
        class="session-card qs-glass"
        :class="{ editing: editingId === session._id }"
        @click="editSession(session)"
      >
        <view class="session-top">
          <view class="session-badge">第{{ sIndex + 1 }}场</view>
          <text class="session-time">{{ session.timeText }}</text>
          <text class="session-total" :class="session.total >= 0 ? 'qs-jade' : 'qs-danger'">{{ session.total >= 0 ? '+' : '' }}{{ session.total }}</text>
          <view class="session-del" @click.stop="deleteSession(session)">
            <u-icon name="trash" size="16" color="#F87171"></u-icon>
          </view>
        </view>
        <view class="session-users">
          <view v-for="user in session.participants" :key="user.name" class="user-pill">
            <text class="user-pill-name">{{ user.name }}</text>
            <text class="user-pill-score" :class="user.score >= 0 ? 'qs-jade' : 'qs-danger'">{{ user.score >= 0 ? '+' : '' }}{{ user.score }}</text>
          </view>
          <text v-if="session.participants.length === 0" class="qs-sub">本场无人参与</text>
        </view>
      </view>

      <view v-if="sessions.length === 0" class="qs-glass qs-empty">
        <u-icon name="file-text" size="44" color="#4C6B5C"></u-icon>
        <text style="margin-top: 16rpx;">这一天还没有记录，从下方录入第一场吧</text>
      </view>
    </view>

    <!-- 录入表单 -->
    <view class="form-card qs-glass">
      <view class="form-head">
        <view>
          <text class="qs-section-title">{{ editingId ? '编辑第 ' + editingLabel + ' 场' : '新增一场' }}</text>
          <text class="qs-sub form-hint">积分为 0 视为本场未参与，可记录负数</text>
        </view>
        <text v-if="editingId" class="form-cancel" @click="startNewSession">取消编辑</text>
      </view>

      <view class="member-list">
        <view v-if="users.length === 0" class="qs-empty" style="padding: 40rpx 0;">
          <text>暂无成员，请先添加成员</text>
        </view>
        <view v-for="(user, index) in users" :key="index" class="member-row">
          <view class="member-name-wrap" @tap="handleNameTap(index)">
            <u-input
              v-if="editingNameIndex === index"
              v-model="user.name"
              type="text"
              :border="false"
              :focus="true"
              color="#F4FBF7"
              placeholderStyle="color:#5E7A6C"
              @blur="finishEditName(index)"
              @confirm="finishEditName(index)"
            ></u-input>
            <text v-else class="member-name">{{ user.name }}</text>
          </view>
          <view class="score-box">
            <u-input
              v-model="user.score"
              type="text"
              :border="false"
              placeholder="0"
              color="#F4FBF7"
              placeholderStyle="color:#5E7A6C"
              inputAlign="right"
              customStyle="font-weight:700;font-size:30rpx;"
            ></u-input>
          </view>
          <view class="member-del" @click="removeMember(index)">
            <u-icon name="close-circle" size="18" color="#F87171"></u-icon>
          </view>
        </view>
      </view>

      <view class="form-actions">
        <view class="add-member" @click="openAddMemberDialog">
          <u-icon name="plus-circle-fill" size="15" color="#34D399"></u-icon>
          <text class="add-member-text">添加成员</text>
        </view>
        <u-button
          :text="editingId ? '保存修改' : '保存本场'"
          @click="saveSession"
          :loading="saving"
          customStyle="margin:0;padding:0 46rpx;height:84rpx;border-radius:999rpx;background:linear-gradient(135deg,#E9C46A,#F2D98F);color:#05130D;font-weight:700;font-size:29rpx;border:none;"
        ></u-button>
      </view>
    </view>

    <!-- 添加成员弹窗 -->
    <u-popup :show="showAddMemberDialog" mode="center" :round="28" @close="showAddMemberDialog = false" :safeAreaInsetBottom="false">
      <view class="dialog">
        <view class="dialog-title">添加成员</view>
        <view class="dialog-input">
          <u-input v-model="newMemberPhone" placeholder="手机号(必填)" type="number" maxlength="11" :border="false" color="#F4FBF7" placeholderStyle="color:#5E7A6C" @blur="onPhoneBlur"></u-input>
        </view>
        <view class="dialog-input">
          <u-input v-model="newMemberNickName" placeholder="昵称(选填)" :border="false" :disabled="nicknameReadonly" color="#F4FBF7" placeholderStyle="color:#5E7A6C"></u-input>
        </view>
        <view class="dialog-buttons">
          <u-button text="取消" @click="showAddMemberDialog = false" customStyle="border-radius:20rpx;background:rgba(255,255,255,0.08);color:#B8CCC2;border:none"></u-button>
          <u-button text="确认" @click="addMember" customStyle="border-radius:20rpx;background:linear-gradient(135deg,#E9C46A,#F2D98F);color:#05130D;font-weight:700;border:none"></u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, ensureCollections, addDoc, queryDocs, updateDoc, removeDoc } from '@/utils/cloudbase'
import { getUuid, isValidPhone } from '@/utils'
import md5 from '@/utils/md5'
import { createNotification } from '@/utils/notification'

export default {
  data() {
    return {
      groupId: '',
      groupDocId: '',
      groupName: '',
      members: [],
      users: [],
      sessions: [],
      date: '',
      maxDate: '',
      minDate: '',
      monthCount: 3,
      showCalendar: false,
      showAddMemberDialog: false,
      newMemberPhone: '',
      newMemberNickName: '',
      nicknameReadonly: false,
      editingNameIndex: -1,
      editingId: '',
      editingLabel: '',
      saving: false
    }
  },
  computed: {
    dateLabel() {
      if (!this.date) return ''
      return dayjs(this.date).format('M月D日')
    },
    weekLabel() {
      if (!this.date) return ''
      const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekMap[dayjs(this.date).day()]
    }
  },
  onLoad(options) {
    if (options.id) {
      this.groupId = options.id
    }
    const today = dayjs()
    this.date = today.format('YYYY-MM-DD')
    this.maxDate = this.date
    this.minDate = today.subtract(2, 'year').startOf('month').format('YYYY-MM-DD')
    // u-calendar 的 monthNum 会截断可选月份，必须覆盖 minDate ~ maxDate 的全部月份，否则当月会被裁掉
    this.monthCount = today.diff(dayjs(this.minDate), 'month') + 1
    this.initData()
  },
  methods: {
    async initData() {
      uni.showLoading({ title: '加载中...', mask: true })
      try {
        await ensureLogin()
        await ensureCollections()
        await Promise.all([this.loadGroupMembers(), this.loadSessions()])
        this.resetForm()
      } finally {
        uni.hideLoading()
      }
    },

    async loadGroupMembers() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo') || {}
        const currentPhone = userInfo.phone || ''

        const groups = await queryDocs('groups', { _id: this.groupId })
        const memberValues = new Set()
        if (currentPhone) memberValues.add(currentPhone)

        if (groups.length > 0) {
          const group = groups[0]
          this.groupDocId = group._id
          this.groupName = group.groupName || ''
          if (group.members && group.members.length > 0) {
            group.members.forEach((m) => memberValues.add(m))
          }
        }

        const phoneList = Array.from(memberValues)
        const memberDetails = await Promise.all(
          phoneList.map(async (p) => {
            if (isValidPhone(p)) {
              try {
                const users = await queryDocs('users', { phone: p })
                if (users.length > 0) {
                  const nickName = users[0].nickName || users[0].nickname || ''
                  return { phone: p, nickName, name: nickName || p }
                }
              } catch (err) {
                console.error('查询成员失败:', err)
              }
              return { phone: p, nickName: '', name: p }
            }
            return { phone: '', nickName: '', name: p }
          })
        )

        this.members = memberDetails
      } catch (err) {
        console.error('加载成员失败:', err)
        const userInfo = uni.getStorageSync('userInfo') || {}
        const currentPhone = userInfo.phone || ''
        this.members = currentPhone
          ? [{ phone: currentPhone, nickName: userInfo.nickName || '', name: userInfo.nickName || currentPhone }]
          : []
      }
    },

    async loadSessions() {
      try {
        await ensureLogin()
        const docs = await queryDocs('scores', {
          groupId: this.groupId,
          date: this.date
        })
        docs.sort((a, b) => {
          const ta = a.createTime ? dayjs(a.createTime).valueOf() : 0
          const tb = b.createTime ? dayjs(b.createTime).valueOf() : 0
          return ta - tb
        })

        this.sessions = docs.map((doc) => {
          const participants = (doc.users || [])
            .map((u) => ({ ...u, score: parseInt(u.score) || 0 }))
            .filter((u) => u.score !== 0)
          const total = participants.reduce((sum, u) => sum + u.score, 0)
          return {
            _id: doc._id,
            users: doc.users || [],
            participants,
            total,
            timeText: doc.createTime ? dayjs(doc.createTime).format('HH:mm') : '--:--'
          }
        })

        if (this.editingId) {
          const stillExists = this.sessions.some((s) => s._id === this.editingId)
          if (!stillExists) {
            this.startNewSession()
          }
        }
      } catch (err) {
        console.error('加载场次失败:', err)
        this.sessions = []
      }
    },

    resetForm() {
      const base = this.members.map((m) => ({
        name: m.name,
        phone: m.phone || '',
        score: ''
      }))
      const sessionNames = this.editingId ? (this.sessions.find((s) => s._id === this.editingId)?.users || []) : []
      sessionNames.forEach((u) => {
        if (!base.find((b) => b.name === u.name)) {
          base.push({ name: u.name, phone: u.phone || '', score: '' })
        }
      })
      this.users = base
      if (!this.editingId) {
        this.editingLabel = ''
      }
    },

    startNewSession() {
      this.editingId = ''
      this.editingLabel = ''
      this.resetForm()
    },

    editSession(session) {
      const index = this.sessions.findIndex((s) => s._id === session._id)
      this.editingId = session._id
      this.editingLabel = String(index + 1)

      const scoreMap = {}
      ;(session.users || []).forEach((u) => {
        scoreMap[u.name] = u
      })

      const base = this.members.map((m) => {
        const matched = scoreMap[m.name]
        return {
          name: m.name,
          phone: m.phone || (matched && matched.phone) || '',
          score: matched ? String(parseInt(matched.score) || 0) : ''
        }
      })

      ;(session.users || []).forEach((u) => {
        if (!base.find((b) => b.name === u.name)) {
          base.push({ name: u.name, phone: u.phone || '', score: String(parseInt(u.score) || 0) })
        }
      })

      this.users = base
    },

    async deleteSession(session) {
      const res = await new Promise((resolve) => {
        uni.showModal({
          title: '删除场次',
          content: `确定删除这一场记录吗？该操作不可恢复。`,
          confirmColor: '#ef4444',
          success: resolve
        })
      })
      if (!res.confirm) return

      try {
        await removeDoc('scores', session._id)
        if (this.editingId === session._id) {
          this.startNewSession()
        }
        await this.loadSessions()
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (err) {
        console.error('删除场次失败:', err)
        uni.showToast({ title: '删除失败，请重试', icon: 'none' })
      }
    },

    shiftDate(offset) {
      const next = dayjs(this.date).add(offset, 'day')
      if (next.isAfter(dayjs(this.maxDate))) return
      if (next.isBefore(dayjs(this.minDate))) return
      this.date = next.format('YYYY-MM-DD')
      this.onDateChanged()
    },

    onDateChanged() {
      this.startNewSession()
      this.loadSessions()
    },

    handleCalendarConfirm(e) {
      const val = Array.isArray(e) ? e[0] : e
      if (!val) return
      this.date = typeof val === 'string' ? val : dayjs(val).format('YYYY-MM-DD')
      this.showCalendar = false
      this.onDateChanged()
    },

    async removeMember(index) {
      const memberName = this.users[index]?.name
      const memberPhone = this.users[index]?.phone
      if (!memberName && !memberPhone) return

      const userInfo = uni.getStorageSync('userInfo') || {}
      const creatorPhone = userInfo.phone || ''

      const res = await new Promise((resolve) => {
        uni.showModal({
          title: '确认删除',
          content: `确定要删除成员"${memberName}"并清除其在该分组的所有积分吗？`,
          confirmColor: '#ef4444',
          success: resolve
        })
      })
      if (!res.confirm) return

      this.users.splice(index, 1)
      this.members = this.members.filter((m) => {
        if (memberPhone && m.phone) return m.phone !== memberPhone
        return m.name !== memberName
      })

      try {
        await ensureLogin()
        if (!this.groupDocId) {
          const groups = await queryDocs('groups', { _id: this.groupId })
          if (groups.length > 0) this.groupDocId = groups[0]._id
        }

        const allScores = await queryDocs('scores', { groupId: this.groupId })
        for (const scoreRecord of allScores) {
          const originalUsers = scoreRecord.users || []
          const updatedUsers = originalUsers.filter((u) => {
            if (memberPhone && u.phone) return u.phone !== memberPhone
            return u.name !== memberName
          })
          if (updatedUsers.length !== originalUsers.length) {
            await updateDoc('scores', scoreRecord._id, { users: updatedUsers })
          }
        }

        if (this.groupDocId) {
          await updateDoc('groups', this.groupDocId, {
            members: this.members.map((m) => m.phone || m.name)
          })
        }

        try {
          const group = await queryDocs('groups', { _id: this.groupId })
          const groupName = group.length > 0 ? group[0].groupName : '群组'
          const displayName = memberName || memberPhone
          for (const m of this.members) {
            const mPhone = m.phone || ''
            if (mPhone && mPhone !== creatorPhone) {
              await createNotification({
                userId: mPhone,
                type: 'member_leave',
                title: '成员退出',
                content: `${displayName}退出了"${groupName}"`,
                groupId: this.groupId,
                groupName
              })
            }
          }
        } catch (notifyErr) {
          console.error('发送通知失败:', notifyErr)
        }

        await this.loadSessions()
      } catch (err) {
        console.error('删除成员失败:', err)
        uni.showToast({ title: '删除失败，请重试', icon: 'none' })
      }
    },

    openAddMemberDialog() {
      this.newMemberPhone = ''
      this.newMemberNickName = ''
      this.nicknameReadonly = false
      this.showAddMemberDialog = true
    },

    async onPhoneBlur() {
      const phone = this.newMemberPhone.trim()
      if (!phone || !isValidPhone(phone)) return

      try {
        const existingUsers = await queryDocs('users', { phone })
        if (existingUsers.length > 0) {
          this.newMemberNickName = existingUsers[0].nickName || existingUsers[0].nickname || ''
          this.nicknameReadonly = true
        } else {
          this.nicknameReadonly = false
        }
      } catch (err) {
        console.error('查询用户失败:', err)
      }
    },

    async addMember() {
      if (!this.newMemberPhone.trim()) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return
      }
      if (!isValidPhone(this.newMemberPhone.trim())) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }

      const memberPhone = this.newMemberPhone.trim()
      const exists = this.members.some((m) => m.phone === memberPhone)
      if (exists) {
        uni.showToast({ title: '该成员已存在', icon: 'none' })
        return
      }

      try {
        await ensureLogin()
        const existingUsers = await queryDocs('users', { phone: memberPhone })
        if (existingUsers.length === 0) {
          const nickName = this.newMemberNickName.trim() || ''
          await addDoc('users', {
            username: memberPhone,
            phone: memberPhone,
            nickName,
            avatarUrl: 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg',
            password: md5('888888')
          })
        }
      } catch (err) {
        console.error('校验用户失败:', err)
      }

      const displayName = this.newMemberNickName.trim() || memberPhone

      this.members.push({ name: displayName, phone: memberPhone, nickName: this.newMemberNickName.trim() })
      this.users.push({ name: displayName, phone: memberPhone, score: '' })

      try {
        if (this.groupDocId) {
          await updateDoc('groups', this.groupDocId, {
            members: this.members.map((m) => m.phone || m.name)
          })
        }
      } catch (err) {
        console.error('更新群组成员失败:', err)
      }

      this.showAddMemberDialog = false
      this.newMemberPhone = ''
      this.newMemberNickName = ''

      try {
        const userInfo = uni.getStorageSync('userInfo') || {}
        const creatorPhone = userInfo.phone || ''
        const creatorName = userInfo.nickName || creatorPhone
        const group = await queryDocs('groups', { _id: this.groupId })
        const groupName = group.length > 0 ? group[0].groupName : '群组'
        for (const m of this.members) {
          const mPhone = m.phone || ''
          if (mPhone && mPhone !== creatorPhone && mPhone !== memberPhone) {
            await createNotification({
              userId: mPhone,
              type: 'new_member',
              title: '新成员加入',
              content: `${displayName}加入了"${groupName}"`,
              groupId: this.groupId,
              groupName
            })
          }
        }
        if (memberPhone && memberPhone !== creatorPhone) {
          await createNotification({
            userId: memberPhone,
            type: 'new_member',
            title: '加入群组',
            content: `${creatorName}将你加入了"${groupName}"`,
            groupId: this.groupId,
            groupName
          })
        }
      } catch (notifyErr) {
        console.error('发送通知失败:', notifyErr)
      }
    },

    handleNameTap(index) {
      this.editingNameIndex = index
    },

    async finishEditName(index) {
      const oldName = this.members[index]?.name || this.users[index]?.name
      const newName = this.users[index]?.name?.trim()

      if (!newName) {
        uni.showToast({ title: '名字不能为空', icon: 'none' })
        this.users[index].name = oldName
        this.editingNameIndex = -1
        return
      }

      if (oldName !== newName) {
        if (this.members[index]) this.members[index].name = newName
        await this.updateNameInCloud(oldName, newName)
      }

      this.editingNameIndex = -1
    },

    async updateNameInCloud(oldName, newName) {
      try {
        await ensureLogin()
        const allScores = await queryDocs('scores', { groupId: this.groupId })

        for (const scoreRecord of allScores) {
          let needUpdate = false
          const updatedUsers = (scoreRecord.users || []).map((user) => {
            if (user.name === oldName) {
              needUpdate = true
              return { ...user, name: newName }
            }
            return user
          })
          if (needUpdate) {
            await updateDoc('scores', scoreRecord._id, { users: updatedUsers })
          }
        }

        if (this.groupDocId) {
          await updateDoc('groups', this.groupDocId, {
            members: this.members.map((m) => m.phone || m.name)
          })
        }
        await this.loadGroupMembers()
        await this.loadSessions()
      } catch (err) {
        console.error('更新名称失败:', err)
      }
    },

    async saveSession() {
      if (this.users.length === 0) {
        uni.showToast({ title: '请至少添加一个成员', icon: 'none' })
        return
      }

      const payloadUsers = this.users.map((u) => ({
        name: u.name,
        phone: u.phone || '',
        score: parseInt(u.score) || 0
      }))
      const hasParticipant = payloadUsers.some((u) => u.score !== 0)
      if (!hasParticipant) {
        uni.showToast({ title: '请录入至少一位成员的积分（0 分视为未参与）', icon: 'none' })
        return
      }

      this.saving = true
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo') || {}

        if (this.editingId) {
          await updateDoc('scores', this.editingId, { users: payloadUsers })
        } else {
          await addDoc('scores', {
            id: getUuid(),
            groupId: this.groupId,
            date: this.date,
            users: payloadUsers,
            creatorId: userInfo.phone || ''
          })
        }

        uni.showToast({ title: this.editingId ? '修改成功' : '保存成功', icon: 'success' })

        try {
          const creatorPhone = userInfo.phone || ''
          const creatorName = userInfo.nickName || creatorPhone
          const groupName = this.groupName || '群组'
          for (const user of payloadUsers) {
            const userPhone = user.phone || ''
            if (userPhone && userPhone !== creatorPhone && user.score !== 0) {
              await createNotification({
                userId: userPhone,
                type: 'score_change',
                title: '积分变动',
                content: `${creatorName}在"${groupName}"录入了积分`,
                groupId: this.groupId,
                groupName
              })
            }
          }
        } catch (notifyErr) {
          console.error('发送通知失败:', notifyErr)
        }

        this.editingId = ''
        this.editingLabel = ''
        await this.loadSessions()
        this.resetForm()
      } catch (err) {
        console.error('保存失败:', err)
        uni.showToast({ title: '保存失败，请重试', icon: 'none' })
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.group-page {
  padding-top: 28rpx;
}

.group-hero {
  padding: 32rpx 30rpx 26rpx;
  margin-bottom: 30rpx;
}

.hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}

.hero-kicker {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.68);
  letter-spacing: 2rpx;
  margin-bottom: 8rpx;
}

.hero-name {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #fff9e8;
  text-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.25);
}

.hero-tag {
  margin-top: 6rpx;
}

.date-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  margin-top: 28rpx;
  background: rgba(0, 0, 0, 0.18);
  border: 1rpx solid rgba(255, 255, 255, 0.14);
  border-radius: 22rpx;
  padding: 10rpx;
}

.date-arrow {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
}

.date-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.date-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #f4fbf7;
}

.date-week {
  font-size: 22rpx;
  color: #ffe9ad;
  background: rgba(233, 196, 106, 0.16);
  border: 1rpx solid rgba(233, 196, 106, 0.3);
  border-radius: 999rpx;
  padding: 4rpx 14rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 4rpx 18rpx;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 30rpx;
}

.session-card {
  padding: 22rpx 24rpx;
  border-left: 6rpx solid rgba(52, 211, 153, 0.5);
}

.session-card.editing {
  border-left-color: #e9c46a;
  box-shadow: 0 0 0 2rpx rgba(233, 196, 106, 0.4), 0 18rpx 40rpx -20rpx rgba(0, 0, 0, 0.75);
}

.session-top {
  display: flex;
  align-items: center;
}

.session-badge {
  font-size: 22rpx;
  font-weight: 700;
  color: #05130d;
  background: linear-gradient(135deg, #34d399, #6ee7b7);
  border-radius: 999rpx;
  padding: 6rpx 16rpx;
  margin-right: 14rpx;
}

.session-time {
  font-size: 22rpx;
  color: #8aa79b;
  flex: 1;
}

.session-total {
  font-size: 30rpx;
  font-weight: 800;
  margin-right: 18rpx;
}

.session-del {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  background: rgba(248, 113, 113, 0.12);
  border: 1rpx solid rgba(248, 113, 113, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}

.session-users {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.user-pill-name {
  font-size: 24rpx;
  color: #dcebe3;
}

.user-pill-score {
  font-size: 24rpx;
  font-weight: 700;
}

.form-card {
  padding: 28rpx 26rpx;
}

.form-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.form-hint {
  display: block;
  margin-top: 8rpx;
}

.form-cancel {
  font-size: 24rpx;
  color: #f2d98f;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(233, 196, 106, 0.12);
  border: 1rpx solid rgba(233, 196, 106, 0.3);
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.member-row {
  display: flex;
  align-items: center;
  padding: 14rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.045);
  border: 1rpx solid rgba(255, 255, 255, 0.07);
}

.member-name-wrap {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 28rpx;
  color: #dcebe3;
  font-weight: 500;
}

.score-box {
  width: 170rpx;
  padding: 8rpx 18rpx;
  border-radius: 16rpx;
  background: rgba(0, 0, 0, 0.22);
  border: 1rpx solid rgba(233, 196, 106, 0.26);
  margin: 0 14rpx;
}

.member-del {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28rpx;
}

.add-member {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(52, 211, 153, 0.1);
  border: 1rpx solid rgba(52, 211, 153, 0.28);
}

.add-member-text {
  font-size: 24rpx;
  color: #6ee7b7;
}

.dialog {
  width: 600rpx;
  padding: 44rpx 40rpx 36rpx;
  border-radius: 28rpx;
  background: #0e241b;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #f4fbf7;
  text-align: center;
  margin-bottom: 32rpx;
}

.dialog-input {
  padding: 18rpx 22rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  margin-bottom: 22rpx;
}

.dialog-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 10rpx;
}

.dialog-buttons u-button {
  flex: 1;
}
</style>
