// === UTILITY FUNCTIONS ===

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const cache = {
    get: (key) => {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            return null;
        }
        const item = JSON.parse(itemStr);
        const now = new Date();
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return item.value;
    },
    set: (key, value) => {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + CACHE_DURATION_MS,
        };
        localStorage.setItem(key, JSON.stringify(item));
    }
};

function extractVideoID(url) {
    const patterns = [
        /(?:v=|\/)([a-zA-Z0-9_-]{11}).*/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
}

function formatNumber(num) {
    if (num === null || num === undefined) return '--';
    const n = Number(num);
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return n.toString();
}

function formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '00:00';
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    let formatted = '';
    if (hours > 0) formatted += `${hours}:`;
    formatted += `${minutes.toString().padStart(2, '0')}:`;
    formatted += `${seconds.toString().padStart(2, '0')}`;
    return formatted;
}

function parseTimeToSeconds(timeString) {
    if (!timeString || typeof timeString !== 'string') return 0;
    const parts = timeString.split(':').map(part => parseInt(part, 10) || 0);
    let seconds = 0;
    if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        seconds = parts[0];
    }
    return seconds;
}

function countWords(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).length;
}

function getWordSlice(str, count, fromEnd = false) {
    if (!str) return '';
    const words = str.trim().split(/\s+/);
    if (fromEnd) {
        return words.slice(Math.max(0, words.length - count)).join(' ');
    }
    return words.slice(0, count).join(' ');
}

// === START: CẬP NHẬT CODE ===
function estimateReadingTime(wordCount) {
    // Lấy WPM từ cài đặt, nếu không có hoặc không hợp lệ thì mặc định là 150
    const wpm = parseInt(localStorage.getItem('setting-wpm')) || 150;

    if (wordCount === 0) {
        return "0 giây";
    }
    // Tính toán số phút (dưới dạng số thập phân)
    const minutes = wordCount / wpm;
    // Chuyển đổi sang tổng số giây và làm tròn
    const totalSeconds = Math.round(minutes * 60);
    
    // Trả về định dạng phù hợp
    if (totalSeconds < 60) {
        return `${totalSeconds} giây`;
    } else {
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;
        return `${displayMinutes} phút ${displaySeconds} giây`;
    }
}

function handleTranscriptInput() {
    const transcript = document.getElementById('videoTranscript').value;
    const totalWords = countWords(transcript);
    const estimatedTime = estimateReadingTime(totalWords); // Gọi hàm mới đã được cập nhật

    // Cập nhật bộ đếm từ và thời gian đọc
    document.getElementById('transcript-word-count').innerText = 
        `${totalWords} từ ≈ ${estimatedTime}`;

    // Tự động gợi ý số phần
    const scriptPartsInput = document.getElementById('scriptParts');
    if (totalWords > 0) {
        const idealPartSize = 1000;
        const suggestedParts = Math.round(totalWords / idealPartSize);
        scriptPartsInput.value = Math.max(1, suggestedParts);
    } else {
        scriptPartsInput.value = '';
    }
}
// === END: CẬP NHẬT CODE ===