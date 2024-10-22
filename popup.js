document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const summarizeButton = document.getElementById('summarize');

  // Load the API key from chrome.storage.local
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save the API key when it changes
  apiKeyInput.addEventListener('change', () => {
    const apiKey = apiKeyInput.value.trim();
    chrome.storage.local.set({ geminiApiKey: apiKey });
  });

  summarizeButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('Please enter a valid Gemini API key.');
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'processStories',
        apiKey: apiKey
      });
    });
  });
});
