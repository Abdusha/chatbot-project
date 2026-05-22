// DOM Elements
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const fileInput = document.getElementById('file-input');
const attachBtn = document.getElementById('attach-btn');
const clearFileBtn = document.getElementById('clear-file-btn');
const fileStatus = document.getElementById('file-status');

// Conversation history to maintain context
let conversationHistory = [];
let uploadedFile = null; // Store uploaded file data

/**
 * Initialize chat with welcome message
 */
document.addEventListener('DOMContentLoaded', initializeChat);

function initializeChat() {
  // Tampilkan pesan sambutan statis dari bot
  const welcomeMessage = 'Halo! 👋 Saya Hello Work ID, asisten karir Anda. Bagaimana saya bisa membantu Anda hari ini?';
  appendMessage('bot', welcomeMessage);
  
  // Add to conversation history
  conversationHistory.push({
    role: 'model',
    text: welcomeMessage
  });
}

/**
 * Handle file selection
 */
async function handleFileSelection(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showFileStatus('File terlalu besar (max 10MB)', 'error');
    fileInput.value = '';
    uploadedFile = null;
    attachBtn.classList.remove('has-file');
    return;
  }

  try {
    const fileContent = await readFile(file);
    uploadedFile = {
      name: file.name,
      type: file.type,
      content: fileContent
    };

    showFileStatus(`✓ File uploaded: ${file.name}`, 'success');
    attachBtn.classList.add('has-file');
  } catch (error) {
    showFileStatus(`Error reading file: ${error.message}`, 'error');
    fileInput.value = '';
    uploadedFile = null;
    attachBtn.classList.remove('has-file');
  }
}

/**
 * Read file as text or base64
 */
async function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Read as text for PDF/TXT, as data URL for binary files
    if (file.type === 'application/pdf') {
      reader.readAsDataURL(file);
    } else if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else if (file.type.includes('word') || file.type.includes('document')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

/**
 * Show file status message
 */
function showFileStatus(message, type = 'success') {
  fileStatus.textContent = message;
  fileStatus.classList.add('show', type);
  fileStatus.classList.remove(type === 'success' ? 'error' : 'success');
  
  // Show clear button when file is successfully uploaded
  if (type === 'success') {
    clearFileBtn.style.display = 'flex';
  }
}

/**
 * Clear uploaded file
 */
function clearFile() {
  uploadedFile = null;
  fileInput.value = '';
  fileStatus.classList.remove('show', 'success', 'error');
  fileStatus.textContent = '';
  attachBtn.classList.remove('has-file');
  clearFileBtn.style.display = 'none';
}


/**
 * Initialize form submission listener
 */
form.addEventListener('submit', handleFormSubmit);
attachBtn.addEventListener('click', () => fileInput.click());
clearFileBtn.addEventListener('click', clearFile);
fileInput.addEventListener('change', handleFileSelection);

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  
  // If no message and no file, return
  if (!userMessage && !uploadedFile) return;

  // Show user message if exists
  if (userMessage) {
    appendMessage('user', userMessage);
    input.value = '';
  }

  // Show uploaded file in chat if exists
  if (uploadedFile) {
    appendMessage('user', `📎 CV Uploaded: ${uploadedFile.name}`);
  }

  // Add user message to conversation history
  if (userMessage) {
    conversationHistory.push({
      role: 'user',
      text: userMessage
    });
  }

  // Add file info to conversation if exists
  if (uploadedFile) {
    const fileMessage = `[CV File: ${uploadedFile.name}]\n\nContent:\n${uploadedFile.content}`;
    conversationHistory.push({
      role: 'user',
      text: fileMessage
    });
  }

  // Clear file status and input
  fileStatus.classList.remove('show', 'success', 'error');
  fileStatus.textContent = '';
  uploadedFile = null;
  fileInput.value = '';
  attachBtn.classList.remove('has-file');
  clearFileBtn.style.display = 'none';

  // Show "Thinking..." message temporarily
  const thinkingElement = appendMessage('bot', 'Thinking...');

  try {
    // Send request to backend with optional file data
    const aiResponse = await sendMessageToBackend(conversationHistory);

    // Remove the "Thinking..." message
    thinkingElement.remove();

    // Add AI response to chat
    appendMessage('bot', aiResponse);

    // Add AI response to conversation history
    conversationHistory.push({
      role: 'model',
      text: aiResponse
    });
  } catch (error) {
    // Remove the "Thinking..." message
    thinkingElement.remove();

    // Show error message
    const errorMessage = error.message || 'Failed to get response from server.';
    appendMessage('bot', `Sorry, ${errorMessage}`);

    console.error('Error:', error);
  }
}

/**
 * Send conversation to backend API
 * @param {Array} conversation - Array of message objects with role and text
 * @returns {Promise<string>} - AI response text
 */
async function sendMessageToBackend(conversation) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ conversation })
  });

  // Check if response is ok
  if (!response.ok) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  console.log('API Response:', data);

  // Validate response structure (check for both 'result' and 'response' keys)
  const aiResponse = data.result || data.response;
  
  if (!aiResponse || aiResponse.trim() === '') {
    console.error('Response is empty:', data);
    throw new Error('no response received');
  }

  return aiResponse;
}

/**
 * Append message to chat box
 * @param {string} sender - 'user' or 'bot'
 * @param {string} text - Message text (can include markdown)
 * @returns {HTMLElement} - The created message element
 */
function appendMessage(sender, text) {
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('message', sender);

  const messageContent = document.createElement('div');
  
  // Parse markdown for bot messages, plain text for user messages
  if (sender === 'bot') {
    const markdownHTML = marked.parse(text);
    const sanitizedHTML = DOMPurify.sanitize(markdownHTML);
    messageContent.innerHTML = sanitizedHTML;
  } else {
    messageContent.textContent = text;
  }

  messageWrapper.appendChild(messageContent);
  chatBox.appendChild(messageWrapper);

  // Auto-scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;

  return messageWrapper;
}
