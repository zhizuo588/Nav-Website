<template>
  <BaseModal :show="show" title="添加网站" @close="$emit('close')">
    <template #icon>
      <span class="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/50"></span>
    </template>
    
    <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-sm">{{ error }}</span>
    </div>

    <form @submit.prevent="$emit('submit', form)" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">网站名称 *</label>
        <input v-model="form.name" type="text" required class="glass-input" placeholder="例如：GitHub">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">网站链接 *</label>
        <input v-model="form.url" type="url" required class="glass-input" placeholder="例如：https://github.com">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">网站描述</label>
        <input v-model="form.desc" type="text" class="glass-input" placeholder="简单的一句话介绍（可选）">
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">图标链接</label>
          <input v-model="form.iconUrl" type="url" class="glass-input" placeholder="留空自动获取">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">内网链接</label>
          <input v-model="form.lanUrl" type="url" class="glass-input" placeholder="（可选）">
        </div>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <input v-model="form.darkIcon" type="checkbox" id="addDarkIcon" class="w-4 h-4 rounded border-gray-300 dark:border-white/10 bg-white dark:bg-gray-900/50 text-green-500 focus:ring-green-500/50">
        <label for="addDarkIcon" class="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">这是一个深色图标（需要反色显示）</label>
      </div>

      <div class="flex gap-3 pt-4">
        <button type="button" @click="$emit('close')" class="btn-action-cancel">取消</button>
        <button type="submit" :disabled="loading" class="btn-action bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-70 disabled:cursor-not-allowed">
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ loading ? '添加中...' : '确认添加' }}</span>
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { reactive, watch } from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  show: Boolean,
  loading: Boolean,
  error: String,
  initialCategory: String
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  name: '',
  url: '',
  desc: '',
  category: '',
  iconUrl: '',
  lanUrl: '',
  darkIcon: false
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    form.name = ''
    form.url = ''
    form.desc = ''
    form.category = props.initialCategory || ''
    form.iconUrl = ''
    form.lanUrl = ''
    form.darkIcon = false
  }
})
</script>