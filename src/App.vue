<script>
	export default {
		onLaunch: function() {
			console.log('App Launch');
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	@import "uview-ui/index.scss";

	page {
		background-color: #06120e;
		height: 100%;
		font-size: 28rpx;
		color: #e9f3ee;
	}

	/* ============ 翡翠金·暗夜竞技 设计系统 ============ */
	.qs-page {
		position: relative;
		min-height: 100vh;
		box-sizing: border-box;
		padding: 24rpx 28rpx 80rpx;
		background:
			radial-gradient(120% 55% at 18% 0%, rgba(52, 211, 153, 0.16) 0%, rgba(6, 18, 14, 0) 58%),
			radial-gradient(90% 40% at 100% 0%, rgba(233, 196, 106, 0.12) 0%, rgba(6, 18, 14, 0) 60%),
			linear-gradient(180deg, #0a2018 0%, #06120e 55%, #040c09 100%);
	}

	.qs-glass {
		position: relative;
		background: linear-gradient(160deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.035) 100%);
		border: 1rpx solid rgba(255, 255, 255, 0.09);
		border-radius: 28rpx;
		box-shadow: 0 18rpx 40rpx -20rpx rgba(0, 0, 0, 0.75), inset 0 1rpx 0 rgba(255, 255, 255, 0.12);
		box-sizing: border-box;
	}

	.qs-hero {
		position: relative;
		overflow: hidden;
		background: linear-gradient(135deg, #16a34a 0%, #0e7a52 42%, #0b4c3a 100%);
		border: 1rpx solid rgba(233, 196, 106, 0.35);
		border-radius: 32rpx;
		box-shadow: 0 24rpx 50rpx -24rpx rgba(16, 185, 129, 0.55), inset 0 1rpx 0 rgba(255, 255, 255, 0.18);
		box-sizing: border-box;
	}

	.qs-hero::after {
		content: "";
		position: absolute;
		right: -90rpx;
		top: -90rpx;
		width: 320rpx;
		height: 320rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(233, 196, 106, 0.55) 0%, rgba(233, 196, 106, 0) 68%);
		pointer-events: none;
	}

	.qs-title {
		font-size: 34rpx;
		font-weight: 700;
		color: #f4fbf7;
		letter-spacing: 1rpx;
	}

	.qs-section-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #f4fbf7;
	}

	.qs-sub {
		color: #8aa79b;
		font-size: 24rpx;
	}

	.qs-text {
		color: #dcebe3;
	}

	.qs-gold {
		color: #e9c46a;
	}

	.qs-jade {
		color: #34d399;
	}

	.qs-danger {
		color: #f87171;
	}

	.qs-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
		background: rgba(52, 211, 153, 0.14);
		border: 1rpx solid rgba(52, 211, 153, 0.28);
		color: #6ee7b7;
	}

	.qs-gold-chip {
		background: rgba(233, 196, 106, 0.14);
		border-color: rgba(233, 196, 106, 0.3);
		color: #f2d98f;
	}

	.qs-divider {
		height: 1rpx;
		background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0));
	}

	.qs-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 90rpx 0;
		color: #6e8c7f;
		font-size: 26rpx;
	}

	/* 分段控件 */
	.qs-segment {
		display: flex;
		padding: 6rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.05);
		border: 1rpx solid rgba(255, 255, 255, 0.07);
	}

	.qs-segment-item {
		flex: 1;
		text-align: center;
		padding: 14rpx 0;
		font-size: 26rpx;
		color: #8aa79b;
		border-radius: 999rpx;
		transition: all 0.2s;
	}

	.qs-segment-item.active {
		color: #05130d;
		font-weight: 700;
		background: linear-gradient(135deg, #e9c46a 0%, #f2d98f 100%);
		box-shadow: 0 10rpx 24rpx -12rpx rgba(233, 196, 106, 0.8);
	}

	/* 选择器行 */
	.qs-picker-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 26rpx;
		border-radius: 20rpx;
		background: rgba(255, 255, 255, 0.05);
		border: 1rpx solid rgba(255, 255, 255, 0.08);
		margin-bottom: 20rpx;
	}

	.qs-picker-label {
		font-size: 25rpx;
		color: #8aa79b;
	}

	.qs-picker-value {
		font-size: 27rpx;
		color: #f4fbf7;
		font-weight: 500;
	}
</style>
