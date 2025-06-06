<template>
	<div class="navbar-container" :class="headerClass">
		<div class="navbar-left">
			<Hamburger />
			<Refresh />
			<Breadcrumb v-if="store.appStore.theme.isBreadcrumb" />
		</div>
		<div class="navbar-right">
			<Lang />
			<ComponentSize />
			<Search />
			<Fullscreen />
			<Settings />
		</div>
	</div>
</template>

<script setup lang="ts">
import store from '@/store'
import Hamburger from './components/Hamburger.vue'
import Refresh from './components/Refresh.vue'
import Breadcrumb from './components/Breadcrumb.vue'
import Lang from '@/components/Lang/index.vue'
import ComponentSize from './components/ComponentSize.vue'
import Fullscreen from './components/Fullscreen.vue'
import Search from './components/Search.vue'
import Notice from './components/Notice.vue'
import Settings from '../Settings/index.vue'
import { computed } from 'vue'

const headerClass = computed(() => (store.appStore.theme.headerStyle === 'theme' ? 'header-theme' : ''))
</script>

<style lang="scss" scoped>
.navbar-container {
	height: var(--theme-header-height);
	display: flex;
	align-items: center;
	background: var(--theme-header-bg-color);
	box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
	color: var(--theme-header-text-color);
	transition: all 0.3s ease-in-out;

	::v-deep(.svg-icon) {
		align-items: center;
		cursor: pointer;
		height: var(--theme-header-height);
		line-height: var(--theme-header-height);
		padding: 0 15px;
		transition: all 0.2s ease;

		svg {
			color: var(--theme-header-text-color) !important;
			font-size: 18px;
			transition: transform 0.2s ease;
		}

		&:hover {
			background: var(--theme-header-hover-color);
			svg {
				transform: scale(1.1);
			}
		}
	}

	&.header-theme {
		background: var(--el-color-primary);
		color: white;

		::v-deep(.svg-icon) svg {
			color: white !important;
		}
	}
}

.navbar-left {
	flex: 1;
	height: inherit;
	display: flex;
	align-items: center;
	padding-left: 10px;
}

.navbar-right {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	padding-right: 10px;
	gap: 5px;

	&-link {
		height: 100%;
		display: flex;
		align-items: center;
		white-space: nowrap;
		padding: 0 10px;
		transition: all 0.3s ease;

		&:hover {
			background: var(--theme-header-hover-color);
		}

		&-photo {
			width: 32px;
			height: 32px;
			border-radius: 50%;
			object-fit: cover;
			transition: transform 0.3s ease;

			&:hover {
				transform: scale(1.1);
			}
		}
	}
}
</style>
