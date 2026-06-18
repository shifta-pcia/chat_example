const STORAGE_KEY = 'opencode_chat_history';

const CONFIG = {
  systemPrompt: "You are a helpful, friendly, and concise AI assistant. Respond in a conversational manner. Keep responses brief unless the user asks for detail.",
  defaultModel: "deepseek-v4-flash-free",
};

const state = {
  messages: loadMessages(),
};

const messagesEl = document.getElementById('messages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const modelSelect = document.getElementById('modelSelect');
const clearBtn = document.getElementById('clearBtn');
const loadingEl = document.getElementById('loading');

function loadMessages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages));
}

function addMessage(role, content) {
  state.messages.push({ role, content });
  saveMessages();
  renderMessage(role, content);
}

function renderMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const header = document.createElement('div');
  header.className = 'message-header';
  header.textContent = role === 'user'
    ? '>> YOU'
    : `<< ${modelSelect.options[modelSelect.selectedIndex].text}`;

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  contentEl.textContent = content;

  div.appendChild(header);
  div.appendChild(contentEl);
  messagesEl.appendChild(div);
  scrollToBottom();
}

function renderMessages() {
  messagesEl.innerHTML = '';
  state.messages.forEach(m => renderMessage(m.role, m.content));
}

function scrollToBottom() {
  const container = document.getElementById('chatContainer');
  container.scrollTop = container.scrollHeight;
}

function setLoading(on) {
  loadingEl.classList.toggle('hidden', !on);
  document.getElementById('sendBtn').disabled = on;
}

async function sendMessage(text) {
  addMessage('user', text);

  setLoading(true);
  try {
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: state.messages.map(m => ({ role: m.role, content: m.content })),
        model: modelSelect.value,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      addMessage('assistant', `[Error] ${errData.error || 'Something went wrong'}`);
      return;
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '[No response]';
    addMessage('assistant', reply);
  } catch (err) {
    addMessage('assistant', `[Error] ${err.message}`);
  } finally {
    setLoading(false);
  }
}

function clearChat() {
  if (state.messages.length === 0) return;
  state.messages = [];
  saveMessages();
  messagesEl.innerHTML = '';
  localStorage.removeItem(STORAGE_KEY);
}

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendMessage(text);
});

messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
});

messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

clearBtn.addEventListener('click', clearChat);

(async function init() {
  renderMessages();
  if (state.messages.length === 0) {
    addMessage('assistant', 'Hello! I\'m your OpenCode assistant. Ask me anything.');
  }
})();
