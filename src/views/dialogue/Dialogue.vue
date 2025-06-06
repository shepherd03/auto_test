<template>
  <div class="dialogue-container">
    <el-card class="chat-card">
      <!-- 顶部工具栏 -->
      <div class="chat-toolbar">
        <div class="toolbar-left">
          <el-tooltip content="清空对话" placement="top">
            <el-button 
              :icon="Delete" 
              circle
              plain
              type="danger"
              @click="clearHistory"
              :disabled="!history.length"
            />
          </el-tooltip>
        </div>
        <div class="toolbar-title">
          <el-icon><ChatLineRound /></el-icon>
          智能助手
        </div>
        <div class="toolbar-right">
          <el-tooltip content="导出对话" placement="top">
            <el-button 
              :icon="Download" 
              circle
              plain
              @click="exportHistory"
              :disabled="!history.length"
            />
          </el-tooltip>
        </div>
      </div>

      <!-- 聊天历史记录区域 -->
      <div class="chat-history" ref="chatHistoryRef">
        <div v-if="history.length === 0" class="empty-history">
          <el-empty description="开始对话吧">
            <template #image>
              <el-icon :size="60" color="var(--el-text-color-secondary)">
                <ChatRound />
              </el-icon>
            </template>
            <template #description>
              <div class="empty-tips">
                <p>您可以问我任何问题</p>
                <div class="suggestion-list">
                  <el-tag
                    v-for="(tip, index) in suggestionTips"
                    :key="index"
                    class="suggestion-item"
                    @click="handleSuggestion(tip)"
                  >
                    {{ tip.question }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-empty>
        </div>
        <div v-else v-for="(item, index) in history" :key="index">
          <!-- 用户消息 -->
          <div v-if="item.sender === '用户'" class="message user-message">
            <el-avatar class="message-avatar" :size="40" :icon="UserFilled" />
            <div class="message-content">
              <div class="message-info">
                <span class="sender">{{ item.sender }}</span>
                <span class="time">{{ item.time || '刚刚' }}</span>
              </div>
              <div class="message-text" v-html="item.text">
              </div>
              <div class="message-actions">
                <el-button 
                  text 
                  type="primary" 
                  size="small"
                  @click="copyMessage(item.text)"
                >
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- AI消息 -->
          <div v-else class="message ai-message">
            <el-avatar class="message-avatar" :size="40" :icon="Service" />
            <div class="message-content">
              <div class="message-info">
                <span class="sender">{{ item.sender }}</span>
                <span class="time">{{ item.time || '刚刚' }}</span>
                <span v-if="item.responseTime" class="response-time">
                  <el-icon><Timer /></el-icon>
                  响应: {{ item.responseTime }}ms
                </span>
              </div>
              <div v-if="!item.loading" class="message-text" v-html="item.text"></div>
              <div v-else class="loading-animation">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
              <div v-if="!item.loading" class="message-actions">
                <el-button 
                  text 
                  type="primary" 
                  size="small"
                  @click="copyMessage(item.text)"
                >
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 固定的输入区域 -->
      <div class="input-area">
        <div class="input-wrapper">
          <el-input
            v-model="query"
            type="textarea"
            :rows="3"
            :placeholder="inputPlaceholder"
            resize="none"
            @keyup.enter.ctrl="handleEnterKey"
            :maxlength="1000"
            show-word-limit
          >
          </el-input>
          <div class="send-button">
            <el-tooltip content="按 Ctrl + Enter 发送" placement="top">
              <el-button 
                type="primary" 
                :loading="loading"
                :disabled="isButtonDisabled"
                @click="sendRequest"
                round
              >
                <el-icon v-if="!loading"><Position /></el-icon>
                {{ loading ? '发送中...' : '发送' }}
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useDirectApi } from '@/api/microService';
import { getReplyContent, getReplyType, getTime } from '@/utils/resultParser';
import { 
  UserFilled, 
  Service, 
  Delete, 
  Download,
  Position,
  InfoFilled,
  Warning,
  ChatLineRound,
  ChatRound,
  CopyDocument,
  Timer
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 修改建议提示列表为对象数组，包含问题和预设回复
const suggestionTips = [
  {
    question: "你能帮我做什么?",
    answer: `我是电力业务智能助手，可以帮您解答以下问题：
      1. 电力业务咨询和办理流程
      2. 电费计算和账单解释
      3. 故障报修和处理进度查询
      4. 电力设施维护和安全用电指导
      5. 新装、增容等业务办理指南
      6. 电力政策法规解读

您可以直接输入您的具体问题，我会为您提供专业的解答。`
  },
  {
    question: "如何使用这个系统?",
    answer: `使用本系统非常简单：
1. 直接在输入框输入您的问题
2. 点击发送或按Ctrl+Enter发送
3. 等待系统回复
4. 可以点击复制按钮复制回复内容
5. 可以导出对话记录或清空历史

温馨提示：
- 问题描述越具体，回答越准确
- 如遇到系统无法理解的问题，请尝试换种方式提问
- 可以随时查看对话历史记录`
  },
  {
    question: "有什么新功能?",
    answer: `最新功能更新：
1. 新增智能问答系统，支持更准确的业务理解
2. 优化了响应速度，显示接口响应时间
3. 新增对话记录导出功能
4. 支持复制对话内容
5. 新增暗黑模式支持
6. 优化了用户界面，提供更好的交互体验

后续我们还将持续优化系统功能，为您提供更好的服务体验。`
  },
  {
    question: "怎么导出对话记录?",
    answer: `导出对话记录的方法：
1. 点击右上角的下载图标
2. 系统会自动将当前对话记录保存为文本文件
3. 文件会自动下载到您的设备中
4. 文件名格式为：对话记录_日期.txt

导出的记录包含：
- 所有对话内容
- 对话时间
- 响应时间等信息`
  },
  {
    question: "如何清空历史记录?",
    answer: `清空历史记录的方法：
1. 点击左上角的删除图标
2. 系统会弹出确认提示
3. 点击确认后即可清空所有对话记录

注意事项：
- 清空后的记录无法恢复
- 建议在清空前先导出重要的对话内容
- 清空记录不会影响系统的使用`
  }
];

// 状态变量
const query = ref('');
const history = ref([]);
const chatHistoryRef = ref(null);
const loading = ref(false);
const error = ref('');
const inputPlaceholder = ref('请输入您的问题...');

// 计算属性
const isButtonDisabled = computed(() => {
  return loading.value || !query.value.trim();
});

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
  }
};

// 发送请求
async function sendRequest() {
  if (isButtonDisabled.value) return;
  
  loading.value = true;
  error.value = '';
  
  // 检查是否是预设问题
  const predefinedAnswer = suggestionTips.find(tip => tip.question === query.value)?.answer;
  
  // 添加用户消息
  history.value.push({ 
    sender: '用户', 
    text: query.value,
    time: new Date().toLocaleTimeString()
  });
  
  const queryTemp = query.value;
  query.value = '';
  inputPlaceholder.value = '继续输入...';
  
  // 添加AI临时消息
  history.value.push({ 
    sender: '小智', 
    text: '', 
    loading: true,
    time: new Date().toLocaleTimeString()
  });

  await scrollToBottom();

  try {
    if (predefinedAnswer) {
      // 如果是预设问题，直接返回预设答案
      const lastMessageIndex = history.value.length - 1;
      history.value[lastMessageIndex] = { 
        sender: '小智', 
        text: predefinedAnswer, 
        loading: false,
        time: new Date().toLocaleTimeString(),
        responseTime: 0 // 预设回复响应时间为0
      };
    } else {
      // 不是预设问题，调用API
      const startTime = Date.now();
      const response = await useDirectApi(queryTemp);
      const responseTime = Date.now() - startTime;

      if (response.data) {
        const lastMessageIndex = history.value.length - 1;
        const replyContent = getReplyContent(response);
        const replyType = getReplyType(response);
        const time = getTime(response);
        
        history.value[lastMessageIndex] = { 
          sender: '小智', 
          text: replyContent, 
          loading: false,
          time: time || new Date().toLocaleTimeString(),
          responseTime
        };
      }
    }
    await scrollToBottom();
  } catch (err) {
    console.error(err);
    error.value = '请求失败，请稍后重试';
    ElMessage.error('请求失败，请稍后重试');
    const lastMessageIndex = history.value.length - 1;
    history.value[lastMessageIndex] = { 
      sender: '小智', 
      text: '抱歉，我遇到了一些问题，请稍后再试。', 
      loading: false,
      time: new Date().toLocaleTimeString()
    };
  } finally {
    loading.value = false;
  }
}

// 处理回车事件
function handleEnterKey(event) {
  if (event.ctrlKey && !isButtonDisabled.value) {
    event.preventDefault();
    sendRequest();
  }
}

// 复制消息
const copyMessage = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('复制成功');
  });
};

// 清空历史
const clearHistory = () => {
  ElMessageBox.confirm('确定要清空所有对话记录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    history.value = [];
    ElMessage.success('已清空对话记录');
  });
};

// 导出历史
const exportHistory = () => {
  const historyText = history.value
    .map(item => `${item.sender}: ${item.text}\n时间: ${item.time}\n`)
    .join('\n');
  
  const blob = new Blob([historyText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `对话记录_${new Date().toLocaleDateString()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// 修改建议点击处理函数
const handleSuggestion = (tip) => {
  query.value = tip.question; // 修改为使用question属性
  sendRequest();
};

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped lang="scss">
.dialogue-container {
  height: calc(100vh - 120px); // 调整整体高度
  background: var(--el-bg-color-page);
  box-sizing: border-box;
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;

  :deep(.el-card__body) {
    height: 100%;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
}

.chat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);

  .toolbar-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--el-fill-color-lighter);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color-darker);
    border-radius: 3px;
  }
}

.empty-history {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .empty-tips {
    text-align: center;
    color: var(--el-text-color-primary); // 修改颜色以适配暗黑模式
    
    p {
      margin-bottom: 16px;
      font-size: 16px;
    }
  }

  .suggestion-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    max-width: 500px; // 增加宽度
    padding: 0 20px;
  }

  .suggestion-item {
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 20px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border: 1px solid var(--el-color-primary-light-5);

    &:hover {
      transform: translateY(-2px);
      background: var(--el-color-primary-light-7);
      color: var(--el-color-primary-dark-2);
    }
  }
}
.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 85%;
  position: relative;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-info {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  .sender {
    font-weight: 500;
  }
  
  .time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .response-time {
    font-size: 12px;
    color: var(--el-color-success);
    display: flex;
    align-items: center;
    gap: 4px;
    
    .el-icon {
      font-size: 14px;
    }
  }
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  position: relative;
  transition: all 0.3s;

  &:hover {
    box-shadow: var(--el-box-shadow-light);
  }
}

.message-actions {
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  gap: 8px;
}

.message:hover .message-actions {
  opacity: 1;
}

.user-message {
  margin-left: auto;
  
  .message-text {
    background: var(--el-color-primary-light-9);
    color: var(--el-text-color-primary);

    :deep(code) {
      background-color: var(--el-color-primary-light-8);
      padding: 2px 4px;
      border-radius: 4px;
    }
  }
}

.ai-message {
  margin-right: auto;
  
  .message-text {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);

    :deep(code) {
      background-color: var(--el-fill-color-darker);
      padding: 2px 4px;
      border-radius: 4px;
    }
  }
}

.loading-animation {
  padding: 16px;
  display: flex;
  gap: 6px;
  justify-content: center;
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--el-color-primary);
    animation: bounce 1s infinite;
    
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.input-area {
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;

  :deep(.el-textarea) {
    flex: 1;
    
    .el-textarea__inner {
      border-radius: 12px;
      padding: 12px 16px;
      min-height: 24px !important;
      max-height: 150px;
      line-height: 1.6;
      
      &:focus {
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
      }
    }
  }
}

.send-button {
  .el-button {
    height: 40px;
    padding: 0 24px;
    font-size: 16px;
    
    .el-icon {
      margin-right: 4px;
      font-size: 18px;
    }
  }
}

// 暗黑模式适配
:deep(html.dark) {
  .user-message .message-text {
    background: var(--el-color-primary-dark-2);
    color: var(--el-text-color-primary);
  }

  .ai-message .message-text {
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
  }

  .chat-history {
    background: var(--el-bg-color-overlay);
  }

  .input-area {
    background: var(--el-bg-color);
    border-color: var(--el-border-color-darker);
  }

  .chat-toolbar {
    background: var(--el-bg-color);
    border-color: var(--el-border-color-darker);
  }

  .empty-history {
    .suggestion-item {
      background: var(--el-color-primary-dark-2);
      color: var(--el-text-color-primary);
      border-color: var(--el-color-primary);

      &:hover {
        background: var(--el-color-primary);
        color: white;
      }
    }
  }
}
</style>