import App from './App'
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
App.mpType = 'app'
const app = new Vue({
	...App
})
app.$mount()
