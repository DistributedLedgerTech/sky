/**
 * ALIEUX TrollBox — Poloniex-style floating chat overlay
 * Content script injected via manifest on matched pages.
 * All DOM classes prefixed with `kbox-` (CSS in css/trollbox.css).
 * Messages keyed per hostname in chrome.storage.local.
 */
(() => {
  "use strict";

  const DOMAIN        = window.location.hostname;
  const STORAGE_KEY   = `kbox_messages_${DOMAIN}`;
  const USER_KEY      = "kbox_username";
  const MAX_MESSAGES  = 100;
  const EMOJIS        = ["🔥", "💎", "🚀", "👀", "💰", "⚡", "🫡", "👍", "😂", "❤️"];
  const POLL_INTERVAL = 3000;

  let username        = null;
  let isExpanded      = false;
  let emojiPickerOpen = false;
  let lastMsgCount    = 0;
  let hasUnread       = false;

  /* Username */
  function generateUsername() {
    return `Anon${Math.floor(1000 + Math.random() * 9000)}`;
  }

  async function resolveUsername() {
    return new Promise(resolve => {
      chrome.storage.local.get(USER_KEY, r => {
        if (r[USER_KEY]) { username = r[USER_KEY]; }
        else { username = generateUsername(); chrome.storage.local.set({ [USER_KEY]: username }); }
        resolve(username);
      });
    });
  }

  /* Message persistence */
  function loadMessages() {
    return new Promise(resolve => {
      chrome.storage.local.get(STORAGE_KEY, r => resolve(r[STORAGE_KEY] || []));
    });
  }

  function saveMessages(messages) {
    return new Promise(resolve => {
      chrome.storage.local.set({ [STORAGE_KEY]: messages }, resolve);
    });
  }

  async function appendMessage(text) {
    if (!text || !text.trim()) return;
    const messages = await loadMessages();
    messages.push({ user: username, text: text.trim(), ts: Date.now() });
    while (messages.length > MAX_MESSAGES) messages.shift();
    await saveMessages(messages);
    await renderMessages();
    scrollToBottom();
  }

  /* Simulated online user count */
  function getOnlineCount() {
    let hash = 0;
    for (let i = 0; i < DOMAIN.length; i++) hash = ((hash << 5) - hash + DOMAIN.charCodeAt(i)) | 0;
    const base = (Math.abs(hash) % 30) + 3;
    const jitter = Math.floor(Math.random() * 5) - 2;
    return Math.max(1, base + jitter);
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  /* DOM Construction */
  let elRoot, elPill, elPanel, elMessageList, elInput, elSendBtn;
  let elPillCount, elPillDot, elEmojiTray, elOnlineCount;

  function buildDOM() {
    elRoot = document.createElement("div");
    elRoot.className = "kbox-root";

    // Collapsed pill
    elPill = document.createElement("button");
    elPill.className = "kbox-pill";
    elPill.setAttribute("aria-label", "Open ALIEUX chat");

    const pillLabel = document.createElement("span");
    pillLabel.className = "kbox-pill-label";
    pillLabel.textContent = "ALIEUX";

    const pillSep = document.createElement("span");
    pillSep.className = "kbox-pill-sep";
    pillSep.textContent = "\u00B7";

    elPillCount = document.createElement("span");
    elPillCount.className = "kbox-pill-count";
    elPillCount.textContent = getOnlineCount() + " online";

    elPillDot = document.createElement("span");
    elPillDot.className = "kbox-pill-dot";

    elPill.append(pillLabel, pillSep, elPillCount, elPillDot);

    // Expanded panel
    elPanel = document.createElement("div");
    elPanel.className = "kbox-panel kbox-hidden";

    // Header
    const header = document.createElement("div");
    header.className = "kbox-header";

    const headerTitle = document.createElement("span");
    headerTitle.className = "kbox-header-title";
    headerTitle.textContent = "ALIEUX";

    elOnlineCount = document.createElement("span");
    elOnlineCount.className = "kbox-header-online";
    elOnlineCount.textContent = getOnlineCount() + " online";

    const headerClose = document.createElement("button");
    headerClose.className = "kbox-header-close";
    headerClose.setAttribute("aria-label", "Minimize chat");
    headerClose.textContent = "\u2014";

    header.append(headerTitle, elOnlineCount, headerClose);

    // Messages
    elMessageList = document.createElement("div");
    elMessageList.className = "kbox-messages";

    // Emoji tray
    elEmojiTray = document.createElement("div");
    elEmojiTray.className = "kbox-emoji-tray kbox-hidden";
    EMOJIS.forEach(emoji => {
      const btn = document.createElement("button");
      btn.className = "kbox-emoji-pick";
      btn.textContent = emoji;
      btn.addEventListener("click", () => { elInput.value += emoji; elInput.focus(); });
      elEmojiTray.appendChild(btn);
    });

    // Input area
    const inputArea = document.createElement("div");
    inputArea.className = "kbox-input-area";

    const emojiBtn = document.createElement("button");
    emojiBtn.className = "kbox-emoji-btn";
    emojiBtn.setAttribute("aria-label", "Toggle emoji picker");
    emojiBtn.textContent = "\uD83D\uDE00";

    elInput = document.createElement("input");
    elInput.className = "kbox-input";
    elInput.type = "text";
    elInput.placeholder = "Say something ...";
    elInput.maxLength = 280;
    elInput.autocomplete = "off";

    elSendBtn = document.createElement("button");
    elSendBtn.className = "kbox-send-btn";
    elSendBtn.setAttribute("aria-label", "Send message");
    elSendBtn.textContent = "\u27A4";

    inputArea.append(emojiBtn, elInput, elSendBtn);

    // Assemble panel
    elPanel.append(header, elEmojiTray, elMessageList, inputArea);

    // Assemble root
    elRoot.append(elPill, elPanel);
    document.body.appendChild(elRoot);

    // Events
    elPill.addEventListener("click", () => expand());
    headerClose.addEventListener("click", () => collapse());
    emojiBtn.addEventListener("click", e => { e.stopPropagation(); toggleEmojiPicker(); });
    elSendBtn.addEventListener("click", () => sendMessage());
    elInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } });
    elPanel.addEventListener("click", e => {
      if (emojiPickerOpen && !elEmojiTray.contains(e.target) && !e.target.classList.contains("kbox-emoji-btn")) closeEmojiPicker();
    });
  }

  /* Expand / Collapse */
  function expand() {
    isExpanded = true; hasUnread = false;
    elPill.classList.add("kbox-hidden");
    elPillDot.classList.remove("kbox-dot-pulse");
    elPanel.classList.remove("kbox-hidden");
    elPanel.classList.add("kbox-animate-in");
    renderMessages().then(() => scrollToBottom());
    updateOnlineCount();
    loadMessages().then(msgs => { lastMsgCount = msgs.length; });
    setTimeout(() => elInput.focus(), 150);
  }

  function collapse() {
    isExpanded = false;
    elPanel.classList.add("kbox-hidden");
    elPanel.classList.remove("kbox-animate-in");
    elPill.classList.remove("kbox-hidden");
    closeEmojiPicker();
  }

  /* Emoji picker */
  function toggleEmojiPicker() { emojiPickerOpen ? closeEmojiPicker() : openEmojiPicker(); }
  function openEmojiPicker() { emojiPickerOpen = true; elEmojiTray.classList.remove("kbox-hidden"); }
  function closeEmojiPicker() { emojiPickerOpen = false; elEmojiTray.classList.add("kbox-hidden"); }

  /* Send */
  function sendMessage() {
    const text = elInput.value;
    if (!text.trim()) return;
    elInput.value = "";
    appendMessage(text);
    closeEmojiPicker();
    elInput.focus();
  }

  /* Render */
  async function renderMessages() {
    const messages = await loadMessages();
    elMessageList.innerHTML = "";
    if (messages.length === 0) {
      const empty = document.createElement("div");
      empty.className = "kbox-empty";
      empty.textContent = "No messages yet. Say gm!";
      elMessageList.appendChild(empty);
      return;
    }
    messages.forEach(msg => {
      const bubble = document.createElement("div");
      bubble.className = "kbox-bubble" + (msg.user === username ? " kbox-bubble-me" : "");

      const meta = document.createElement("div");
      meta.className = "kbox-bubble-meta";
      const nameEl = document.createElement("span");
      nameEl.className = "kbox-bubble-user";
      nameEl.textContent = msg.user;
      const timeEl = document.createElement("span");
      timeEl.className = "kbox-bubble-time";
      timeEl.textContent = formatTime(msg.ts);
      meta.append(nameEl, timeEl);

      const body = document.createElement("div");
      body.className = "kbox-bubble-text";
      body.textContent = msg.text;

      bubble.append(meta, body);
      elMessageList.appendChild(bubble);
    });
  }

  function scrollToBottom() { if (elMessageList) elMessageList.scrollTop = elMessageList.scrollHeight; }

  /* Online count */
  function updateOnlineCount() {
    const count = getOnlineCount();
    elPillCount.textContent = count + " online";
    if (elOnlineCount) elOnlineCount.textContent = count + " online";
  }

  /* Polling */
  function startPolling() {
    setInterval(async () => {
      const messages = await loadMessages();
      if (isExpanded) {
        await renderMessages();
        scrollToBottom();
        lastMsgCount = messages.length;
        hasUnread = false;
      } else if (messages.length > lastMsgCount) {
        hasUnread = true;
        elPillDot.classList.add("kbox-dot-pulse");
      }
      updateOnlineCount();
    }, POLL_INTERVAL);
  }

  /* Cross-tab sync */
  function listenForExternalChanges() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[STORAGE_KEY]) return;
      const newMessages = changes[STORAGE_KEY].newValue || [];
      if (isExpanded) {
        renderMessages().then(() => scrollToBottom());
        lastMsgCount = newMessages.length;
      } else if (newMessages.length > lastMsgCount) {
        hasUnread = true;
        elPillDot.classList.add("kbox-dot-pulse");
      }
    });
  }

  /* Init */
  async function init() {
    await resolveUsername();
    buildDOM();
    const msgs = await loadMessages();
    lastMsgCount = msgs.length;
    startPolling();
    listenForExternalChanges();
    updateOnlineCount();
  }

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
