<template>
	<div class="sidebar-logo-container" :class="{'is-collapse': !store.appStore.sidebarOpened}">
		<transition name="logo-fade">
			<div v-if="store.appStore.sidebarOpened" class="sidebar-logo">
				<el-avatar :size="28" class="logo-icon" :src="'/favicon.ico'">
					<span>{{ $t('app.miniLogoText') }}</span>
				</el-avatar>
				<span class="logo-title">{{ $t('app.logoText') }}</span>
			</div>
			<div v-else class="sidebar-logo sidebar-logo-collapse">
				<el-avatar :size="32" class="logo-icon" :src="'/favicon.ico'">
					<span>{{ $t('app.miniLogoText') }}</span>
				</el-avatar>
			</div>
		</transition>
	</div>
</template>

<script setup lang="ts">
import store from '@/store'
</script>

<style lang="scss" scoped>
.sidebar-logo-container {
	position: relative;
	width: 100%;
	height: var(--theme-header-height);
	overflow: hidden;
	background: var(--theme-menu-bg-color);
	box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
	text-align: center;
	transition: all 0.3s;

	&.is-collapse {
		.sidebar-logo {
			margin: 0;
		}
	}
}

.sidebar-logo {
	height: var(--theme-header-height);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--theme-logo-text-color);
	font-size: 18px;
	font-weight: 600;
	transition: all 0.3s;

	.logo-icon {
		margin-right: 10px;
		background: var(--el-color-primary-light-8);
		color: var(--el-color-primary);
		font-weight: bold;
	}

	.logo-title {
		margin-left: 10px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

.sidebar-logo-collapse {
	justify-content: center;
	.logo-icon {
		margin-right: 0;
	}
}

.logo-fade-enter-active,
.logo-fade-leave-active {
	transition: opacity 0.3s, transform 0.3s;
}

.logo-fade-enter-from,
.logo-fade-leave-to {
	opacity: 0;
	transform: translateX(10px);
}
</style>
