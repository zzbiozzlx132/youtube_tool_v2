// === GLOBAL STATE & CONSTANTS ===
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 giờ

let state = {
    research: { videoData: null, channelData: null, calculatedVPH: 0, isLoading: false },
    optimizer: { videoData: null, isLoading: false },
    script: { blueprint: null, originalParts: [], writtenParts: [], finalScript: "", translatedTranscript: null }
};

function populateLanguageDropdowns() {
    const selects = [
        document.getElementById('transcript-source-language-select'),
        document.getElementById('output-language-select')
    ];
    
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = ''; // Xóa các option cũ
        supportedLanguages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.value;
            option.textContent = lang.text;
            select.appendChild(option);
        });
    });
}

function populateStyleDropdowns(styles, groupSelectId, specificSelectId) {
    const groupSelect = document.getElementById(groupSelectId);
    const specificSelect = document.getElementById(specificSelectId);
    if (!groupSelect || !specificSelect) return;

    // Populate group dropdown
    for (const groupName in styles) {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        groupSelect.appendChild(option);
    }

    // Function to update specific dropdown based on group
    const updateSpecificDropdown = () => {
        const selectedGroup = groupSelect.value;
        specificSelect.innerHTML = ''; // Clear current options
        if (styles[selectedGroup]) {
            for (const styleName in styles[selectedGroup]) {
                const option = document.createElement('option');
                option.value = styleName;
                option.textContent = styleName;
                specificSelect.appendChild(option);
            }
        }
        // Restore saved specific style if it exists in the new list
        const savedSpecific = localStorage.getItem(specificSelectId);
        if (savedSpecific && specificSelect.querySelector(`option[value="${CSS.escape(savedSpecific)}"]`)) {
            specificSelect.value = savedSpecific;
        } else {
             // If saved one doesn't exist, save the first one in the list
            if (specificSelect.options.length > 0) {
                localStorage.setItem(specificSelectId, specificSelect.options[0].value);
            }
        }
    };

    // Event listener for group change
    groupSelect.addEventListener('change', updateSpecificDropdown);

    // Initial population
    const savedGroup = localStorage.getItem(groupSelectId);
    if (savedGroup && groupSelect.querySelector(`option[value="${CSS.escape(savedGroup)}"]`)) {
        groupSelect.value = savedGroup;
    } else {
         // If nothing is saved, save the first group
        if (groupSelect.options.length > 0) {
            localStorage.setItem(groupSelectId, groupSelect.options[0].value);
        }
    }
    updateSpecificDropdown(); // Call once to populate specific styles initially
}


// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    populateLanguageDropdowns(); 
    loadSettings();

    document.getElementById('setting-vph-good').addEventListener('input', (e) => {
        document.getElementById('vph-excellent-display').textContent = `> ${e.target.value || 0}`;
    });

    const optimizerToolUI = {
        manualCTR: document.getElementById('manualCTR'),
        manualAVD: document.getElementById('manualAVD'),
    };
    if (optimizerToolUI.manualCTR) {
        optimizerToolUI.manualCTR.addEventListener('input', () => renderOptimizationChecklist(state.optimizer.videoData));
        optimizerToolUI.manualAVD.addEventListener('input', () => renderOptimizationChecklist(state.optimizer.videoData));
    }


    const creativitySlider = document.getElementById('creativitySlider');
    const creativityLabel = document.getElementById('creativityLabel');
    if (creativitySlider) {
        creativitySlider.addEventListener('input', (e) => {
            const creativityValue = e.target.value;
            const originalValue = 100 - creativityValue;
            creativityLabel.textContent = `Tỷ lệ Nội dung: Giữ lại ${originalValue}% / Viết mới ${creativityValue}%`;
        });
    }

    const videoUrlInput = document.getElementById('videoUrl');
    if (videoUrlInput) {
        videoUrlInput.addEventListener('input', debounce(handleUrlInput, 800));
    }

    // --- LOGIC LƯU TỰ ĐỘNG CHO CÁC SELECT ---
    const handleAutoSaveSelect = (event) => {
        const selectElement = event.target;
        localStorage.setItem(selectElement.id, selectElement.value);
        let message = `Đã lưu lựa chọn: ${selectElement.options[selectElement.selectedIndex].text}`;

        if (selectElement.id === 'transcript-source-language-select') {
             message = `Đã lưu Ngôn ngữ Input: ${selectElement.options[selectElement.selectedIndex].text}`;
        } else if (selectElement.id === 'output-language-select') {
             message = `Đã lưu Ngôn ngữ Output: ${selectElement.options[selectElement.selectedIndex].text}`;
        } else if (selectElement.id === 'ai-provider-select') {
            handleAIProviderChange();
            message = `Đã đổi nhà cung cấp AI: ${selectElement.options[selectElement.selectedIndex].text}`;
        } else if (selectElement.id.includes('-model-select')) {
             message = `Đã đổi AI Model: ${selectElement.options[selectElement.selectedIndex].text}`;
        } else if (selectElement.id.includes('-style-')) {
            if (selectElement.id.includes('-group')) {
                const specificId = selectElement.id.replace('-group', '-specific');
                setTimeout(() => {
                    const specificSelect = document.getElementById(specificId);
                    if (specificSelect && specificSelect.value) {
                         localStorage.setItem(specificId, specificSelect.value);
                    }
                }, 50);
            }
            message = `Đã cập nhật lựa chọn Studio.`;
        }
        
        showToast(message, 'success');
    };

    document.getElementById('transcript-source-language-select')?.addEventListener('change', handleAutoSaveSelect);
    document.getElementById('output-language-select')?.addEventListener('change', handleAutoSaveSelect);
    document.getElementById('ai-provider-select')?.addEventListener('change', handleAutoSaveSelect);
    document.getElementById('gemini-model-select')?.addEventListener('change', handleAutoSaveSelect);
    document.getElementById('chatgpt-model-select')?.addEventListener('change', handleAutoSaveSelect);
    document.getElementById('image-style-group')?.addEventListener('change', handleAutoSaveSelect);
    document.getElementById('image-style-specific')?.addEventListener('change', handleAutoSaveSelect);
    document.getElementById('video-style-group')?.addEventListener('change', handleAutoSaveSelect);
    document.getElementById('video-style-specific')?.addEventListener('change', handleAutoSaveSelect);
    
    document.getElementById('pasteTranscriptBtn')?.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            const transcriptInput = document.getElementById('videoTranscript');
            transcriptInput.value = text;
            transcriptInput.dispatchEvent(new Event('input', { bubbles: true }));
            showToast('Đã dán nội dung thành công!', 'success');
        } catch (err) {
            showToast('Không thể đọc clipboard. Vui lòng cấp quyền.', 'error');
            console.error('Failed to read clipboard contents: ', err);
        }
    });

    document.getElementById('editRoleStyleBtn')?.addEventListener('click', (e) => {
        const roleInput = document.getElementById('roleOutput');
        const styleInput = document.getElementById('styleOutput');
        const button = e.currentTarget;
        const icon = button.querySelector('i');

        if (roleInput.disabled) {
            roleInput.disabled = false;
            styleInput.disabled = false;
            roleInput.focus();
            icon.classList.remove('fa-pencil');
            icon.classList.add('fa-save');
            button.title = "Lưu thay đổi";
            showToast('Bạn có thể chỉnh sửa Role / Style.', 'info');
        } else {
            roleInput.disabled = true;
            styleInput.disabled = true;
            icon.classList.remove('fa-save');
            icon.classList.add('fa-pencil');
            button.title = "Chỉnh sửa Role / Style";
            showToast('Đã lưu và khóa Role / Style.', 'success');
        }
    });

    handleAIProviderChange();
    
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const wasActive = header.classList.contains('active');

            // Đóng tất cả accordion trong cùng một group
            const accordionGroup = header.closest('.space-y-2');
            if (accordionGroup) {
                 accordionGroup.querySelectorAll('.accordion-header').forEach(otherHeader => {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.style.maxHeight = null;
                 });
            }
            
            // Mở/đóng cái được click
            if (!wasActive) {
                header.classList.add('active');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // === START: KHỞI TẠO STUDIO SẢN XUẤT ===
    populateStyleDropdowns(imageStyles, 'image-style-group', 'image-style-specific');
    populateStyleDropdowns(videoStyles, 'video-style-group', 'video-style-specific');
    // === END: KHỞI TẠO STUDIO SẢN XUẤT ===
    
    // Mở accordion đầu tiên trong Cài đặt
     const settingsAccordions = document.querySelectorAll('#settings-accordion .accordion-header');
    if (settingsAccordions.length > 0) {
        settingsAccordions[0].click();
    }
});