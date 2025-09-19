// === SUPPORTED LANGUAGES ===
const supportedLanguages = [
    { value: "Tiếng Việt", text: "Tiếng Việt (Vietnamese)" }, { value: "English", text: "English" },
    { value: "Español", text: "Español (Spanish)" }, { value: "中文", text: "中文 (Chinese)" },
    { value: "हिन्दी", text: "हिन्दी (Hindi)" }, { value: "العربية", text: "العربية (Arabic)" },
    { value: "Português", text: "Português (Portuguese)" }, { value: "বাংলা", text: "বাংলা (Bengali)" },
    { value: "Русский", text: "Русский (Russian)" }, { value: "日本語", text: "日本語 (Japanese)" },
    { value: "Deutsch", text: "Deutsch (German)" }, { value: "Français", text: "Français (French)" },
    { value: "한국어", text: "한국어 (Korean)" }, { value: "Türkçe", text: "Türkçe (Turkish)" },
    { value: "Italiano", text: "Italiano (Italian)" }, { value: "Nederlands", text: "Nederlands (Dutch)" },
    { value: "Polski", text: "Polski (Polish)" }, { value: "Svenska", text: "Svenska (Swedish)" },
    { value: "Bahasa Indonesia", text: "Bahasa Indonesia (Indonesian)" }, { value: "Bahasa Melayu", text: "Bahasa Melayu (Malay)" },
    { value: "ไทย", text: "ไทย (Thai)" }, { value: "Filipino", text: "Filipino" },
    { value: "Dansk", text: "Dansk (Danish)" }, { value: "Suomi", text: "Suomi (Finnish)" },
    { value: "Norsk", text: "Norsk (Norwegian)" }, { value: "Čeština", text: "Čeština (Czech)" },
    { value: "Magyar", text: "Magyar (Hungarian)" }, { value: "Română", text: "Română (Romanian)" },
    { value: "Slovenčina", text: "Slovenčina (Slovak)" }, { value: "Ελληνικά", text: "Ελληνικά (Greek)" },
    { value: "Български", text: "Български (Bulgarian)" }, { value: "Українська", text: "Українська (Ukrainian)" },
    { value: "עברית", text: "עברית (Hebrew)" }, { value: "فارסי", text: "فارسی (Persian)" },
    { value: "اردو", text: "اردو (Urdu)" }, { value: "मराठी", text: "मराठी (Marathi)" },
    { value: "తెలుగు", text: "తెలుగు (Telugu)" }, { value: "தமிழ்", text: "தமிழ் (Tamil)" },
    { value: "ગુજરાતી", text: "ગુજરાતી (Gujarati)" }, { value: "ಕನ್ನಡ", text: "ಕನ್ನಡ (Kannada)" },
    { value: "മലയാളം", text: "മലയാളം (Malayalam)" }
];

// === CONFIGURATION ===
// IDs cho các settings cần load lúc đầu
const allSettingIds = [
    'youtube-api-key', 'gemini-api-key', 'chatgpt-api-key', 
    'ai-provider-select', 'gemini-model-select', 'chatgpt-model-select',
    'setting-vph-bad', 'setting-vph-good', 'setting-wpm',
    'output-language-select', 'transcript-source-language-select'
];

// IDs cho các settings cần lưu thủ công
const apiSettingIds = ['youtube-api-key', 'gemini-api-key', 'chatgpt-api-key'];
const calcSettingIds = ['setting-vph-bad', 'setting-vph-good', 'setting-wpm'];

const defaultSettings = {
    'youtube-api-key': '',
    'gemini-api-key': '',
    'chatgpt-api-key': '',
    'ai-provider-select': 'gemini',
    'gemini-model-select': 'gemini-1.5-flash-latest',
    'chatgpt-model-select': 'gpt-4o-mini',
    'output-language-select': 'Tiếng Việt',
    'transcript-source-language-select': 'Tiếng Việt',
    'setting-vph-bad': 200,
    'setting-vph-good': 1000,
    'setting-wpm': 150
};

// === FUNCTIONS ===
function saveApiSettings() {
    apiSettingIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) localStorage.setItem(id, el.value);
    });
    showToast('Đã lưu cài đặt API Keys!', 'success');
}

function saveCalcSettings() {
    calcSettingIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) localStorage.setItem(id, el.value);
    });
    // Cập nhật lại hiển thị VPH ngay sau khi lưu
    document.getElementById('vph-excellent-display').textContent = `> ${document.getElementById('setting-vph-good').value}`;
    showToast('Đã lưu tham số tính toán!', 'success');
}


function loadSettings() {
    allSettingIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = localStorage.getItem(id) || defaultSettings[id] || '';
        }
    });
    document.getElementById('vph-excellent-display').textContent = `> ${document.getElementById('setting-vph-good').value}`;
    handleAIProviderChange();
}

function handleAIProviderChange() {
    const provider = document.getElementById('ai-provider-select').value;
    const geminiContainer = document.getElementById('gemini-model-select-container');
    const chatgptContainer = document.getElementById('chatgpt-model-select-container');

    if (provider === 'gemini') {
        geminiContainer.classList.remove('hidden');
        chatgptContainer.classList.add('hidden');
    } else { // chatgpt
        geminiContainer.classList.add('hidden');
        chatgptContainer.classList.remove('hidden');
    }
}