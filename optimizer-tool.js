function setOptimizerLoading(isLoading) {
    const optimizerToolUI = {
        videoUrlInput: document.getElementById('optimizerVideoUrl'),
        runBtn: document.getElementById('runOptimizerBtn'),
    };
    optimizerToolUI.videoUrlInput.disabled = isLoading;
    setButtonLoading(optimizerToolUI.runBtn, isLoading, 'Đang phân tích...');
}

async function runOptimizer() {
    const url = document.getElementById('optimizerVideoUrl').value;
    if (!url) {
        showToast("Vui lòng dán URL video.", 'error');
        return;
    }
    const videoID = extractVideoID(url);
    if (!videoID) {
        showToast("URL video không hợp lệ.", 'error');
        return;
    }
    setOptimizerLoading(true);
    try {
        const videoData = await fetchYouTubeAPI('videos', { part: 'snippet,statistics,contentDetails', id: videoID });
        if (!videoData.items || videoData.items.length === 0) throw new Error('Không tìm thấy video.');
        state.optimizer.videoData = videoData.items[0];
        renderOptimizerResults(state.optimizer.videoData);
    } catch (error) {
        document.getElementById('optimizerResults').classList.add('hidden');
    } finally {
        setOptimizerLoading(false);
    }
}

function renderOptimizerResults(video) {
    const snippet = video.snippet;
    document.getElementById('optimizerVideoInfo').innerHTML = `
        <div class="flex gap-4 items-start">
            <img src="${snippet.thumbnails.medium.url}" class="w-32 rounded-lg" alt="Thumbnail">
            <div class="flex-1">
                <h4 class="font-bold text-white">${snippet.title}</h4>
                <p class="text-sm text-slate-400 mt-1">bởi ${snippet.channelTitle}</p>
            </div>
        </div>`;
    renderOptimizationChecklist(video);
    document.getElementById('optimizerResults').classList.remove('hidden');
}

function renderOptimizationChecklist(video) {
    if (!video) return;
    const { snippet, contentDetails } = video;
    const ctr = parseFloat(document.getElementById('manualCTR').value) || 0;
    const avd = parseTimeToSeconds(document.getElementById('manualAVD').value);
    
    const durationRegex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = contentDetails.duration.match(durationRegex);
    const hours = parseInt(matches[1] || '0');
    const minutes = parseInt(matches[2] || '0');
    const seconds = parseInt(matches[3] || '0');
    const durationInSeconds = hours * 3600 + minutes * 60 + seconds;

    const checks = [
        (() => {
            const len = snippet.title.length;
            if (len >= 20 && len <= 70) return { status: 'success', text: `Độ dài tiêu đề (${len}) nằm trong khoảng tối ưu.` };
            if (len > 70) return { status: 'warning', text: `Tiêu đề (${len}) hơi dài, có thể bị cắt bớt.` };
            return { status: 'danger', text: `Tiêu đề (${len}) quá ngắn, chưa đủ hấp dẫn.` };
        })(),
        (() => {
            const len = snippet.description.length;
            if (len >= 200) return { status: 'success', text: `Mô tả đủ dài (${len} ký tự), tốt cho SEO.` };
            return { status: 'danger', text: `Mô tả (${len} ký tự) hơi ngắn, nên bổ sung thông tin.` };
        })(),
        (() => {
            const count = (snippet.tags || []).length;
            if (count >= 20) return { status: 'success', text: `Số lượng tags (${count}) rất tốt.` };
            if (count >= 10) return { status: 'warning', text: `Số lượng tags (${count}) khá ổn, có thể thêm.` };
            return { status: 'danger', text: `Nên có ít nhất 15-20 tags.` };
        })(),
        (() => {
            if (!ctr) return { status: 'warning', text: 'Nhập CTR để nhận đề xuất.' };
            if (ctr >= 8) return { status: 'success', text: `CTR ${ctr}% là RẤT TỐT. Thumbnail và tiêu đề hiệu quả.` };
            if (ctr >= 4) return { status: 'warning', text: `CTR ${ctr}% là mức KHÁ. Có thể thử nghiệm thêm.` };
            return { status: 'danger', text: `CTR ${ctr}% là mức THẤP. Cần cải thiện ngay.` };
        })(),
        (() => {
            if (!avd || !durationInSeconds) return { status: 'warning', text: 'Nhập Thời gian xem TB để nhận đề xuất.' };
            const retention = (avd / durationInSeconds) * 100;
            if (retention >= 50) return { status: 'success', text: `Tỷ lệ giữ chân (~${retention.toFixed(0)}%) RẤT CAO.` };
            if (retention >= 35) return { status: 'warning', text: `Tỷ lệ giữ chân (~${retention.toFixed(0)}%) ở mức KHÁ.` };
            return { status: 'danger', text: `Tỷ lệ giữ chân (~${retention.toFixed(0)}%) ở mức THẤP.` };
        })()
    ];
    const icons = ['fa-heading', 'fa-file-alt', 'fa-tags', 'fa-mouse-pointer', 'fa-clock'];
    document.getElementById('optimizationChecklist').innerHTML = checks.map((item, i) => `
        <div class="checklist-item">
            <i class="fa-solid ${icons[i]} checklist-icon icon-${item.status}"></i>
            <div><p class="text-slate-300 text-sm">${item.text}</p></div>
        </div>`).join('');
}