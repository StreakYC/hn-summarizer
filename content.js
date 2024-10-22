function addSummaryToStory(storyElement, summary) {
  const subtextRow = storyElement.nextElementSibling;
  if (!subtextRow) return;
  const subtext = subtextRow.querySelector('.subtext');
  if (!subtext) return;
  const summaryElement = document.createElement('span');
  summaryElement.className = 'story-summary';
  summaryElement.textContent = ` | ${summary}`;
  subtext.appendChild(summaryElement);
}

function getStoryUrl(storyElement) {
  const titleLink = storyElement.querySelector('.titleline > a');
  return titleLink ? titleLink.href : null;
}

async function fetchComments(storyId) {
  const response = await fetch(`https://news.ycombinator.com/item?id=${storyId}`);
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const comments = doc.querySelectorAll('.comment');
  return Array.from(comments).map(comment => comment.textContent).join('\n\n');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processStories') {
    processStories(request.apiKey);
  }
});

async function processStories(apiKey) {
  const stories = document.querySelectorAll('.athing');
  for (const story of stories) {
    const comments = await fetchComments(story.id);
    const summary = await summarizeCommentsUsingGeminiFlash8b(comments, apiKey);
    addSummaryToStory(story, summary);
  }
}

async function summarizeCommentsUsingGeminiFlash8b(commentsText, apiKey) {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent';
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "contents": [
          {
            "role": "user",
            "parts": [
              {
                "text": commentsText
              }
            ]
          }
        ],
        "generationConfig": {
          "temperature": 1,
          "topK": 1,
          "topP": 0.95,
          "maxOutputTokens": 8192,
          "responseMimeType": "text/plain"
        },
        "systemInstruction": {
          "parts": [
            {
              "text": "Your job is to summarize the sentiment and content of all the comments of a Hacker News thread. The ideal summarization is a few words long and summarizes the general sentiment of how the commenters in the thread are reacting to the story. Do not output anything other than the summary."
            }
          ]
        }
      })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error fetching Gemini response:', error);
    return 'Error fetching response';
  }
}
