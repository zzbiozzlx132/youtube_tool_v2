// === START: THÊM HÀM MỚI ===
function copyToClipboard(buttonElement, textToCopy) {
    if (!navigator.clipboard) {
        showToast('Trình duyệt không hỗ trợ sao chép.', 'error');
        return;
    }
    
    const originalHtml = buttonElement.innerHTML;
    navigator.clipboard.writeText(textToCopy).then(() => {
        buttonElement.innerHTML = `<i class="fa-solid fa-check"></i> Đã chép!`;
        buttonElement.disabled = true;
        setTimeout(() => {
            buttonElement.innerHTML = originalHtml;
            buttonElement.disabled = false;
        }, 2000);
    }).catch(err => {
        showToast('Lỗi khi sao chép: ' + err, 'error');
    });
}
// === END: THÊM HÀM MỚI ===

function showTool(toolName) {
    document.querySelectorAll('#researchTool, #optimizerTool').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#nav-research, #nav-optimizer').forEach(el => el.classList.remove('active'));
    document.getElementById(toolName).style.display = 'block';
    const navBtnId = toolName === 'researchTool' ? 'nav-research' : 'nav-optimizer';
    document.getElementById(navBtnId).classList.add('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-check-circle';
    if (type === 'error') iconClass = 'fa-solid fa-triangle-exclamation';
    toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 5000);
}

function setLoading(isLoading, buttonId, loadingText, originalText) {
    const button = document.getElementById(buttonId);
    button.disabled = isLoading;
    if (isLoading) {
        button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        button.innerHTML = originalText;
    }
}

function setButtonLoading(button, isLoading, loadingText) {
    button.disabled = isLoading;
    if (isLoading) {
        if (!button.dataset.originalHtml) {
            button.dataset.originalHtml = button.innerHTML;
        }
        button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        }
    }
}

function resetUI() {
    state.research = { videoData: null, channelData: null, calculatedVPH: 0, isLoading: false };
    document.getElementById('preAnalysis').classList.add('hidden');
    document.getElementById('preAnalysis').innerHTML = '';
    document.getElementById('tagsSection').classList.add('hidden');
    document.getElementById('aiSuggestionsSection').classList.add('hidden');
    document.getElementById('scriptWriterSection').classList.add('hidden');
    document.getElementById('runTrendAnalysisBtn').disabled = true;
}

function openModal() { document.getElementById('resultModal').classList.add('active'); }
function closeModal() { document.getElementById('resultModal').classList.remove('active'); }

// === START: THAY ĐỔI ===
// Sửa lại hàm này để dùng hàm chuẩn copyToClipboard
function copySuggestionText(buttonElement) {
    const contentElement = buttonElement.parentElement.nextElementSibling;
    if (contentElement?.innerText) {
        copyToClipboard(buttonElement, contentElement.innerText);
    }
}
// === END: THAY ĐỔI ===