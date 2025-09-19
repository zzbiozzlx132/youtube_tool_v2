// === RESEARCH TOOL LOGIC ===
async function handleUrlInput(event) {
    const url = event.target.value;
    const videoID = extractVideoID(url);
    
    resetUI();
    if (!videoID) return;

    const cachedData = cache.get(videoID);
    if (cachedData) {
        showToast("Tải dữ liệu từ cache!", 'info');
        state.research.videoData = cachedData.videoData;
        state.research.channelData = cachedData.channelData;
        renderPreAnalysis();
        renderTags();
        document.getElementById('runTrendAnalysisBtn').disabled = false;
        document.getElementById('aiSuggestionsSection').classList.remove('hidden');
        document.getElementById('scriptWriterSection').classList.remove('hidden');
        return;
    }

    const runBtn = document.getElementById('runTrendAnalysisBtn');
    runBtn.disabled = true;
    runBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...`;

    try {
        const videoData = await fetchYouTubeAPI('videos', { part: 'snippet,statistics,contentDetails', id: videoID });
        if (!videoData.items?.length) throw new Error('Không tìm thấy video.');
        
        const channelData = await fetchYouTubeAPI('channels', { part: 'statistics', id: videoData.items[0].snippet.channelId });
        if (!channelData.items?.length) throw new Error('Không tìm thấy kênh.');

        state.research.videoData = videoData.items[0];
        state.research.channelData = channelData.items[0];
        
        cache.set(videoID, { videoData: state.research.videoData, channelData: state.research.channelData });

        renderPreAnalysis();
        renderTags();
        runBtn.disabled = false;
        document.getElementById('aiSuggestionsSection').classList.remove('hidden');
        document.getElementById('scriptWriterSection').classList.remove('hidden');
    } catch (error) {
        resetUI();
    } finally {
        runBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> CHẤM ĐIỂM TREND TỰ ĐỘNG`;
    }
}

function renderPreAnalysis() {
    const { videoData, channelData } = state.research;
    const { snippet, statistics, contentDetails, id } = videoData;
    const hoursSincePublished = (new Date() - new Date(snippet.publishedAt)) / 36e5;
    const viewCount = parseInt(statistics.viewCount);
    state.research.calculatedVPH = hoursSincePublished > 1 ? Math.round(viewCount / hoursSincePublished) : viewCount;
    const stats = { views: viewCount, likes: parseInt(statistics.likeCount), subs: parseInt(channelData.statistics.subscriberCount), duration: formatDuration(contentDetails.duration), likeViewRatio: (viewCount > 0 ? (parseInt(statistics.likeCount) / viewCount * 100) : 0).toFixed(2), age: Math.ceil(hoursSincePublished / 24), vph: state.research.calculatedVPH };
    document.getElementById('preAnalysis').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div class="thumbnail-container shadow-lg"><img src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" alt="Thumbnail" onerror="this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg';"></div>
            <div class="space-y-3">
                <h3 class="font-bold text-xl leading-tight text-white">${snippet.title}</h3>
                <p class="text-sm text-slate-300">bởi <a href="https://youtube.com/channel/${snippet.channelId}" target="_blank" class="font-bold hover:text-sky-400">${snippet.channelTitle}</a></p>
                <div class="grid grid-cols-3 gap-4 text-sm bg-slate-800 p-3 rounded-lg">
                    <div class="stat-item" title="Lượt xem"><i class="fa-solid fa-eye text-sky-400"></i><div><strong>${formatNumber(stats.views)}</strong><span class="text-slate-400"> Views</span></div></div>
                    <div class="stat-item" title="Lượt thích"><i class="fa-solid fa-thumbs-up text-sky-400"></i><div><strong>${formatNumber(stats.likes)}</strong><span class="text-slate-400"> Likes</span></div></div>
                    <div class="stat-item" title="Views Per Hour"><i class="fa-solid fa-gauge-high text-sky-400"></i><div><strong>${formatNumber(stats.vph)}</strong><span class="text-slate-400"> VPH</span></div></div>
                    <div class="stat-item" title="Tỷ lệ Tương tác"><i class="fa-solid fa-heart-pulse text-sky-400"></i><div><strong>${stats.likeViewRatio}%</strong><span class="text-slate-400"> Engage</span></div></div>
                    <div class="stat-item" title="Số người đăng ký"><i class="fa-solid fa-users text-sky-400"></i><div><strong>${formatNumber(stats.subs)}</strong><span class="text-slate-400"> Subs</span></div></div>
                    <div class="stat-item" title="Ngày đăng"><i class="fa-solid fa-calendar-days text-sky-400"></i><div><strong>${stats.age} ngày</strong><span class="text-slate-400"> Trước</span></div></div>
                </div>
            </div>
        </div>
        <style>.stat-item { display: flex; align-items: center; gap: 0.5rem; }</style>`;
    document.getElementById('preAnalysis').classList.remove('hidden');
}

function renderTags() {
    const tags = state.research.videoData.snippet.tags;
    const tagsContainer = document.getElementById('tagsContainer');
    if (tags && tags.length > 0) {
        tagsContainer.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        document.getElementById('copyTagsBtn').style.display = 'flex';
    } else {
        tagsContainer.innerHTML = `<span class="text-slate-400">Video này không có tags.</span>`;
        document.getElementById('copyTagsBtn').style.display = 'none';
    }
    document.getElementById('tagsSection').classList.remove('hidden');
}

function runTrendAnalysis() {
    const { calculatedVPH: vph, videoData } = state.research;
    if (!vph && vph !== 0) {
        showToast('Không có dữ liệu VPH để phân tích.', 'error');
        return;
    }
    const videoAge = Math.ceil(Math.abs(new Date() - new Date(videoData.snippet.publishedAt)) / (36e5 * 24));
    if (videoAge > 7) {
        displayTrendResult(vph, 'bad', 'BỎ QUA', `Video đã quá cũ (${videoAge} ngày). Dữ liệu VPH không còn chính xác.`);
        openModal();
        return;
    }
    const settings = { vph_bad: parseFloat(document.getElementById('setting-vph-bad').value), vph_good: parseFloat(document.getElementById('setting-vph-good').value) };
    let level, recommendation, reason;
    if (vph < settings.vph_bad) {
        level = 'bad'; recommendation = 'BỎ QUA'; reason = `VPH < ${settings.vph_bad}. Chủ đề này có khả năng đã hạ nhiệt hoặc không đủ sức hút.`;
    } else if (vph < settings.vph_good) {
        level = 'good'; recommendation = 'CÂN NHẮC'; reason = `VPH ở mức ổn (${settings.vph_bad}-${settings.vph_good}). Có thể làm nếu có góc khai thác độc đáo.`;
    } else {
        level = 'excellent'; recommendation = 'ƯU TIÊN LÀM NGAY'; reason = `VPH > ${settings.vph_good}. Đây là một trend rất mạnh, cần triển khai nhanh.`;
    }
    displayTrendResult(vph, level, recommendation, reason);
    openModal();
}

function displayTrendResult(vph, level, recommendationText, reasonText) {
    document.getElementById('finalResult').innerHTML = `
        <div class="flex flex-col md:flex-row items-center gap-6 p-4 rounded-lg bg-slate-800">
            <div class="text-center">
                <div class="mono-font text-5xl font-bold level-${level}">${vph}</div>
                <div class="text-slate-400 font-semibold">VIEWS PER HOUR (VPH)</div>
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-2xl level-${level}">${recommendationText}</h4>
                <p class="text-slate-300 mt-1">${reasonText}</p>
            </div>
        </div>`;
}

// === START: THAY ĐỔI ===
// Sửa lại hàm này để dùng hàm chuẩn copyToClipboard
function copyAllTags(buttonElement) {
    const tags = state.research.videoData.snippet.tags;
    if (tags?.length > 0) {
        copyToClipboard(buttonElement, tags.join(', '));
    }
}
// === END: THAY ĐỔI ===

// === AI SUGGESTIONS LOGIC (SMART TRANSLATION) ===
async function runAiSuggestions() {
    if (!state.research.videoData) {
        showToast("Vui lòng phân tích một URL video trước.", 'error');
        return;
    }

    const btn = document.getElementById('runAiSuggestionsBtn');
    const outputContainer = document.getElementById('aiSuggestionsOutput');
    setButtonLoading(btn, true, 'AI đang phân tích...');
    outputContainer.innerHTML = `<div class="flex items-center gap-2 text-slate-400"><i class="fa-solid fa-spinner fa-spin"></i>AI đang suy nghĩ, vui lòng chờ...</div>`;

    try {
        const { snippet } = state.research.videoData;
        const targetLanguage = localStorage.getItem('output-language-select') || defaultSettings['output-language-select'];
        
        const suggestionPrompt = createOptimizedSuggestionsPrompt(
            snippet.title, 
            snippet.tags, 
            snippet.description, 
            targetLanguage
        );
        const result = await callGenerativeAPI(suggestionPrompt);
        
        const titlesMatch = result.match(/### TIÊU ĐỀ ĐỀ XUẤT ###([\s\S]*?)### TAGS ĐỀ XUẤT ###/);
        const tagsMatch = result.match(/### TAGS ĐỀ XUẤT ###([\s\S]*?)### MÔ TẢ ĐỀ XUẤT ###/);
        const descriptionMatch = result.match(/### MÔ TẢ ĐỀ XUẤT ###([\s\S]*)/);

        const createHeader = (title) => `
            <div class="flex justify-between items-center">
                <h4 class="font-semibold text-white">${title}</h4>
                <button class="btn-secondary text-xs" onclick="copySuggestionText(this)">
                    <i class="fa-solid fa-copy"></i> Copy
                </button>
            </div>`;

        const titlesHtml = titlesMatch ? `${createHeader('Tiêu đề đề xuất')}<div class="suggestion-content p-3 bg-slate-900 rounded-lg text-sm whitespace-pre-wrap">${titlesMatch[1].trim()}</div>` : '';
        const tagsHtml = tagsMatch ? `<div class="mt-4">${createHeader('Tags đề xuất')}</div><div class="suggestion-content p-3 bg-slate-900 rounded-lg text-sm whitespace-pre-wrap">${tagsMatch[1].trim()}</div>` : '';
        const descriptionHtml = descriptionMatch ? `<div class="mt-4">${createHeader('Mô tả đề xuất')}</div><div class="suggestion-content p-3 bg-slate-900 rounded-lg text-sm whitespace-pre-wrap">${descriptionHtml[1].trim()}</div>` : '';

        outputContainer.innerHTML = titlesHtml + tagsHtml + descriptionHtml;

    } catch (error) {
        outputContainer.innerHTML = `<p class="text-red-400">Đã có lỗi xảy ra khi lấy gợi ý: ${error.message}</p>`;
    } finally {
        setButtonLoading(btn, false);
    }
}

function createOptimizedSuggestionsPrompt(title, tags, description, targetLanguage) {
    const tagString = tags ? tags.join(', ') : 'Không có';

    return `ROLE: YouTube SEO Expert & Linguist.
TASK: Analyze the provided SOURCE_DATA and generate SEO-optimized metadata in the TARGET_LANGUAGE.

TARGET_LANGUAGE: ${targetLanguage}

SOURCE_DATA:
- Title: "${title}"
- Tags: "${tagString}"
- Description: "${description.substring(0, 1000)}..."

PROCEDURE:
1. Analyze the meaning and keywords of the SOURCE_DATA.
2. Generate new, culturally and linguistically appropriate metadata based on this analysis. All creative work must happen internally.
3. The final output MUST ONLY contain text in the TARGET_LANGUAGE.

OUTPUT_CRITERIA:
- The entire response MUST be in the ${targetLanguage} language ONLY.
- **Crucial Rule: DO NOT include the original text or any translations in parentheses.** The output must be clean and ready to copy-paste directly to YouTube.
- Use the exact format below. Do not add any extra text or explanations.

### TIÊU ĐỀ ĐỀ XUẤT ###
[Content]
### TAGS ĐỀ XUẤT ###
[Content]
### MÔ TẢ ĐỀ XUẤT ###
[Content]`;
}