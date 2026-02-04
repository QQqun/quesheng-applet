import App from './App'
import store from './store'
import uView from 'uview-ui'

// 解决 uview-ui 在 H5/非App平台 引用 uni.requireNativePlugin 报错的问题
// #ifdef H5
if (typeof uni.requireNativePlugin !== 'function') {
	uni.requireNativePlugin = () => {}
}
// #endif

import Vue from 'vue'
Vue.config.productionTip = false
Vue.use(uView)
Vue.prototype.$store = store
Vue.prototype.$adpid = "1111111111"
Vue.prototype.$backgroundAudioData = {
	playing: false,
	playTime: 0,
	formatedPlayTime: '00:00:00'
}
App.mpType = 'app'
const app = new Vue({
	store,
	...App
})
app.$mount()
