<template>
  <div
    @click="handleClick"
    class="group relative flex flex-col items-center justify-center py-1.5 sm:py-2 px-0.5 rounded-lg sm:rounded-xl border border-white/5 bg-gray-900/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-gray-800/60 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer h-full"
  >
    <!-- 图标容器 -->
    <div class="mb-1 sm:mb-1.5 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105">
      
      <!-- 显示图片 -->
      <img 
        v-if="!imageLoadError"
        :src="iconSrc" 
        @error="handleImageError"
        class="h-full w-full object-contain rounded-lg drop-shadow-md"
        :class="{ 'invert brightness-0 opacity-90': item.darkIcon }"
        alt="icon" 
      />

      <!-- 图片挂了显示这个 SVG 地球 -->
      <div v-else class="h-full w-full flex items-center justify-center rounded-lg bg-white/5 text-gray-500 group-hover:text-purple-400 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
        </svg>
      </div>

    </div>

    <!-- 文字部分 -->
    <div class="text-center w-full px-0.5">
      <h3 class="text-[11px] sm:text-xs font-medium text-gray-200 tracking-wide group-hover:text-purple-300 transition-colors truncate leading-tight">
        {{ item.name }}
      </h3>
      <p class="mt-0.5 text-[9px] sm:text-[10px] text-gray-400 line-clamp-1 group-hover:text-gray-200 transition-colors opacity-80 leading-tight">
        {{ item.desc }}
      </p>
    </div>

    <!-- 弹窗部分 (保持不变) -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.stop>
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click.stop="showModal = false"></div>
      <div class="relative bg-gray-800 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
        <h3 class="text-lg font-bold text-white mb-4 text-center">选择访问方式</h3>
        <div class="grid grid-cols-2 gap-4">
          <a :href="item.lanUrl" target="_blank" @click="handleLinkClick" class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-700/50 hover:bg-purple-600 hover:text-white transition-all border border-white/5 group/btn">
            <svg class="w-6 h-6 text-purple-400 group-hover/btn:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span class="text-sm font-medium text-gray-300 group-hover/btn:text-white">内网地址</span>
          </a>
          <a :href="item.url" target="_blank" @click="handleLinkClick" class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-700/50 hover:bg-blue-600 hover:text-white transition-all border border-white/5 group/btn">
            <svg class="w-6 h-6 text-blue-400 group-hover/btn:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
            <span class="text-sm font-medium text-gray-300 group-hover/btn:text-white">外网地址</span>
          </a>
        </div>
        <button @click.stop="showModal = false" class="mt-4 w-full py-2 text-xs text-gray-500 hover:text-white transition-colors">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  item: Object,
  onClick: Function
})

const showModal = ref(false)
const imageLoadError = ref(false)

const handleClick = () => {
  if (props.item.lanUrl) {
    showModal.value = true
  } else {
    // 记录点击并打开链接
    if (props.onClick) {
      props.onClick(props.item)
    }
    window.open(props.item.url, '_blank')
  }
}

const handleLinkClick = () => {
  // 记录点击并关闭弹窗
  if (props.onClick) {
    props.onClick(props.item)
  }
  showModal.value = false
}

const iconSrc = computed(() => {
  // 1. 优先用手动填的链接 (上面 data.js 里填的那些)
  if (props.item.iconUrl) return props.item.iconUrl
  
  // 2. 自动抓取：尝试使用 unavatar.io
  try {
    let domain = props.item.url
    if (!domain.startsWith('http')) domain = 'https://' + domain
    const hostname = new URL(domain).hostname
    
    // 使用 unavatar 服务
    return `https://unavatar.io/${hostname}`
  } catch (e) {
    return ''
  }
})

const handleImageError = () => {
  imageLoadError.value = true
}
</script>