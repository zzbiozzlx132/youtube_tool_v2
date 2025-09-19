// === YOUTUBE API ===
async function fetchYouTubeAPI(endpoint, params) {
    const apiKey = localStorage.getItem('youtube-api-key');
    if (!apiKey) {
        showToast('Chưa có YouTube API Key trong Cài Đặt.', 'error');
        throw new Error('Chưa có YouTube API Key.');
    }
    const query = new URLSearchParams(params).toString();
    const apiUrl = `https://www.googleapis.com/youtube/v3/${endpoint}?key=${apiKey}&${query}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errData = await response.json();
            const errorMessage = errData.error?.message || `Lỗi YouTube API: ${response.status}`;
            showToast(errorMessage, 'error');
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        showToast(`Lỗi mạng hoặc API YouTube: ${error.message}`, 'error');
        throw error;
    }
}


// === GENERATIVE AI API (Router and Implementations) ===
async function callGenerativeAPI(prompt) {
    const selectedProvider = localStorage.getItem('ai-provider-select') || defaultSettings['ai-provider-select'];
    if (selectedProvider === 'gemini') {
        return await callGeminiAPI(prompt);
    } else if (selectedProvider === 'chatgpt') {
        return await callChatGPTAPI(prompt);
    } else {
        const errorMsg = 'Nhà cung cấp AI không hợp lệ được chọn.';
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
    }
}

async function callGeminiAPI(prompt) {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
        showToast('Chưa có Gemini API Key trong Cài Đặt.', 'error');
        throw new Error('Chưa có Gemini API Key.');
    }
    const model = localStorage.getItem('gemini-model-select') || defaultSettings['gemini-model-select'];
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents": [{ "parts": [{ "text": prompt }] }],
                "safetySettings": [
                    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
                    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
                    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
                    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error?.message || `Lỗi Gemini API: ${response.status}`;
            showToast(errorMessage, 'error');
            throw new Error(errorMessage);
        }
        
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            let reason = data.promptFeedback?.blockReason ? `Lý do: ${data.promptFeedback.blockReason}` : "Có thể do bộ lọc an toàn.";
            const errorMessage = `Gemini API không trả về nội dung. ${reason}`;
            showToast(errorMessage, 'error');
            throw new Error(errorMessage);
        }
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        showToast(`Lỗi mạng hoặc API Gemini: ${error.message}`, 'error');
        throw error;
    }
}

async function callChatGPTAPI(prompt) {
    const apiKey = localStorage.getItem('chatgpt-api-key');
    if (!apiKey) {
        showToast('Chưa có OpenAI (ChatGPT) API Key trong Cài Đặt.', 'error');
        throw new Error('Chưa có OpenAI API Key.');
    }
    const model = localStorage.getItem('chatgpt-model-select') || defaultSettings['chatgpt-model-select'];
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error?.message || `Lỗi OpenAI API: ${response.status}`;
            showToast(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        if (!data.choices?.[0]?.message?.content) {
            const errorMessage = `OpenAI API không trả về nội dung.`;
            showToast(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        return data.choices[0].message.content;
    } catch (error) {
        showToast(`Lỗi mạng hoặc API OpenAI: ${error.message}`, 'error');
        throw error;
    }
}