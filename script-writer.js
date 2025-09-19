// === START: CÁC HÀM MỚI VÀ HÀM ĐƯỢỢC CẬP NHẬT ===

// Mới: Hàm bật/tắt chế độ chỉnh sửa cho các phần kịch bản
function togglePartEdit(partNumber, buttonElement) {
    const textarea = document.getElementById(`part-${partNumber}-output`);
    const icon = buttonElement.querySelector('i');
    if (textarea.readOnly) {
        textarea.readOnly = false;
        textarea.focus();
        icon.classList.remove('fa-pencil-alt');
        icon.classList.add('fa-save');
        buttonElement.classList.replace('btn-secondary', 'btn-primary');
        buttonElement.title = "Lưu lại";
    } else {
        textarea.readOnly = true;
        icon.classList.remove('fa-save');
        icon.classList.add('fa-pencil-alt');
        buttonElement.classList.replace('btn-primary', 'btn-secondary');
        buttonElement.title = "Chỉnh sửa";
        // Cập nhật lại state khi lưu
        updateWrittenPart(partNumber, textarea);
        showToast(`Đã lưu thay đổi cho Phần ${partNumber}`, 'success');
    }
}

// Mới: Hàm cập nhật state khi người dùng sửa nội dung
function updateWrittenPart(partNumber, textareaElement) {
    state.script.writtenParts[partNumber - 1] = textareaElement.value;
    // Cập nhật lại kịch bản tổng nếu đang hiển thị
    if (!document.getElementById('combinedScriptContainer').classList.contains('hidden')) {
        combineScriptParts();
    }
}


function toggleTranslationView() {
    const translationOutput = document.getElementById('translation-output');
    translationOutput.classList.toggle('hidden');
}

// Cập nhật: runArchitectAI giờ sẽ bao gồm cả việc phân tích Role/Style
async function runArchitectAI() {
    const transcript = document.getElementById('videoTranscript').value;
    const parts = document.getElementById('scriptParts').value;
    if (!transcript || !parts) {
        showToast("Vui lòng dán transcript và nhập số phần.", 'error');
        return;
    }

    const btn = document.getElementById('architectBtn');
    setButtonLoading(btn, true, 'AI đang chuẩn bị...');
    
    document.getElementById('step2-container').classList.add('hidden');
    document.getElementById('script-writing-output').classList.add('hidden');
    document.getElementById('step3-options').classList.add('hidden');
    
    const translationContainer = document.getElementById('translation-output-container');
    const translationOutput = document.getElementById('translation-output');
    translationContainer.classList.add('hidden');
    translationOutput.classList.add('hidden');
    
    try {
        const sourceLanguage = document.getElementById('transcript-source-language-select').value;
        const targetLanguage = document.getElementById('output-language-select').value;
        let processedTranscript = transcript;

        // BƯỚC 1.1: DỊCH THUẬT (NẾU CẦN)
        if (sourceLanguage !== targetLanguage) {
            setButtonLoading(btn, true, `AI đang dịch...`);
            showToast(`Phát hiện ngôn ngữ khác nhau. Bắt đầu dịch...`, 'info');
            
            const translationPrompt = createSmartTranscriptTranslationPrompt(transcript, targetLanguage);
            const translatedText = await callGenerativeAPI(translationPrompt);
            processedTranscript = translatedText;
            
            state.script.translatedTranscript = translatedText;
            translationOutput.innerText = translatedText;
            translationContainer.classList.remove('hidden');
            showToast(`Dịch hoàn tất!`, 'success');
        } else {
            showToast(`Ngôn ngữ nguồn và đích trùng nhau, bỏ qua bước dịch.`, 'info');
        }
        
        // BƯỚC 1.2: PHÂN TÍCH ROLE & STYLE (MỚI)
        setButtonLoading(btn, true, 'AI phân tích chuyên gia...');
        const analysisPrompt = createRoleStyleAnalysisPrompt(processedTranscript, targetLanguage);
        let roleStyle = { role: "Master YouTube Scriptwriter", style: "Engaging and informative" }; // Default
        try {
            const analysisResult = await callGenerativeAPI(analysisPrompt);
            const cleanedResult = analysisResult.match(/\{[\s\S]*\}/);
            if (cleanedResult) {
                const parsedJson = JSON.parse(cleanedResult[0]);
                roleStyle.role = parsedJson.role || roleStyle.role;
                roleStyle.style = parsedJson.style || roleStyle.style;
                showToast('AI đã đề xuất Role & Style!', 'success');
            }
        } catch (e) {
            showToast('Không thể phân tích Role/Style, dùng giá trị mặc định.', 'warning');
        }
        document.getElementById('roleOutput').value = roleStyle.role;
        document.getElementById('styleOutput').value = roleStyle.style;


        // BƯỚC 1.3: TẠO DÀN Ý
        setButtonLoading(btn, true, 'AI đang thiết kế dàn ý...');
        const architectPrompt = createOptimizedArchitectPrompt(processedTranscript, parts, targetLanguage);
        const blueprint = await callGenerativeAPI(architectPrompt);

        state.script.blueprint = blueprint;
        
        const partRegex = /### ORIGINAL PART \d+ ###\s*([\s\S]*?)(?=(### ORIGINAL PART \d+ ###)|$)/g;
        state.script.originalParts = [...blueprint.matchAll(partRegex)].map(match => match[1].trim());

        document.getElementById('blueprintOutput').innerText = blueprint;
        document.getElementById('parts-count').innerText = state.script.originalParts.length;
        document.getElementById('step2-container').classList.remove('hidden');

    } catch (error) {
        showToast(`Lỗi khi tạo dàn ý: ${error.message}`, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// Mới: Prompt để phân tích Role & Style
function createRoleStyleAnalysisPrompt(transcript, targetLanguage) {
    return `ROLE: Expert Content Strategist.
TASK: Analyze the provided script transcript to determine the optimal persona (Role) and writing style for rewriting it.
TARGET_LANGUAGE: ${targetLanguage}
TRANSCRIPT:
---
${getWordSlice(transcript, 400)}...
---
PROCEDURE:
1. Read the transcript to understand its core topic, tone, and intended audience.
2. Define the most effective ROLE a writer should adopt. This role should be an expert in the transcript's subject matter. (e.g., "Experienced Financial Advisor", "Compassionate Elderly Care Expert", "Master Storyteller of ancient tales", "I-Ching and Feng Shui Grandmaster").
3. Define the most suitable WRITING STYLE. This should be a concise description of the tone and manner of writing. (e.g., "Authoritative yet easy to understand", "Warm, empathetic, and reassuring", "Mysterious, using allegorical language", "Professional and data-driven").
4. Both the Role and Style MUST be in the TARGET_LANGUAGE.

OUTPUT_CRITERIA:
- Respond with a single, valid JSON object.
- The JSON object must have two keys: "role" and "style".
- Do NOT include any other text, explanations, or markdown formatting outside of the JSON object.

EXAMPLE_OUTPUT:
{
  "role": "Bậc thầy Kinh Dịch và Phong thủy",
  "style": "Uyên bác, bí ẩn, sử dụng nhiều điển tích điển cố"
}`;
}


function createSmartTranscriptTranslationPrompt(transcript, targetLanguage) {
    return `ROLE: Expert Linguist.
TASK: Prepare a script for further processing.
TARGET_LANGUAGE: ${targetLanguage}
SOURCE_SCRIPT:
---
${transcript}
---
PROCEDURE:
1. Auto-detect the language of the SOURCE_SCRIPT.
2. If the detected language is the same as TARGET_LANGUAGE, return the source script unchanged.
3. If different, translate the entire script into TARGET_LANGUAGE with high accuracy, ensuring cultural and contextual relevance.
OUTPUT_CRITERIA:
- Output ONLY the final script text (original or translated).
- No explanations, comments, or extra text.`;
}

function createOptimizedArchitectPrompt(transcript, parts, language) {
    const labels = {
        goal: "Goal",
        content: "Content",
        emotion: "Emotion"
    };

    return `ROLE: Script Director.
TASK: Analyze a script and create a detailed blueprint.
TARGET_LANGUAGE: ${language}
SCRIPT_PARTS: ${parts}
SOURCE_SCRIPT:
---
${transcript}
---
PROCEDURE:
1. Logically divide the SOURCE_SCRIPT into ${parts} parts.
2. For each part, create a detailed blueprint containing: Main Goal, Core Ideas, and Key Emotion.
3. The labels for Goal, Content, and Emotion MUST be translated into the TARGET_LANGUAGE.
OUTPUT_CRITERIA:
- The main content must be in the TARGET_LANGUAGE.
- CRITICAL RULE: The separators like "### ORIGINAL PART 1 ###" and "### BLUEPRINT 1 ###" MUST ALWAYS be in ENGLISH and use this exact format. Do NOT translate these separators.
- Use the exact format shown in the template below.

--- TEMPLATE START ---
### ORIGINAL PART [Part Number] ###
[Original script content for this part]
### BLUEPRINT [Part Number] ###
- **[Translate "${labels.goal}" to ${language}]:** [The goal]
- **[Translate "${labels.content}" to ${language}]:**
    - [Core idea 1]
    - [Core idea 2]
- **[Translate "${labels.emotion}" to ${language}]:** [The key emotion]
--- TEMPLATE END ---`;
}

// Cập nhật: runWriterAI để render ra giao diện mới
async function runWriterAI() {
    if (!state.script.blueprint || state.script.originalParts.length === 0) {
        showToast("Lỗi: Không tìm thấy dàn ý. Vui lòng chạy lại Bước 1.", 'error');
        return;
    }
    const creativityLevel = document.getElementById('creativitySlider').value;
    const role = document.getElementById('roleOutput').value;
    const style = document.getElementById('styleOutput').value;
    
    const btn = document.getElementById('writerBtn');
    setButtonLoading(btn, true, 'AI đang viết...');
    
    document.getElementById('script-writing-output').classList.remove('hidden');
    document.getElementById('step3-options').classList.add('hidden');
    document.getElementById('combinedScriptContainer').classList.add('hidden');
    
    const partsOutputContainer = document.getElementById('scriptPartsOutput');
    const statusIndicator = document.getElementById('status-indicator');
    const progressBarContainer = document.getElementById('progress-bar-container');
    const progressBar = document.getElementById('progress-bar');

    partsOutputContainer.innerHTML = '';
    progressBarContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    state.script.writtenParts = new Array(state.script.originalParts.length);
    
    const sourceLanguage = document.getElementById('transcript-source-language-select').value;
    const targetLanguage = localStorage.getItem('output-language-select') || defaultSettings['output-language-select'];

    let partsCompleted = 0;
    const totalParts = state.script.originalParts.length;

    statusIndicator.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Bước 2: Viết phần ${partsCompleted + 1}/${totalParts}...`;

    for (const [index, originalPart] of state.script.originalParts.entries()) {
        const partNumber = index + 1;
        const partDiv = document.createElement('div');
        partDiv.className = 'p-4 bg-slate-800 rounded-lg';
        
        // CẬP NHẬT GIAO DIỆN: Thêm ô nhập số lượng cho mỗi loại prompt
        partDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="font-bold text-sky-400">PHẦN ${partNumber}</div>
                <div class="flex items-center gap-2">
                    <button onclick="togglePartEdit(${partNumber}, this)" class="btn-secondary !p-2 h-8 w-8" title="Chỉnh sửa">
                        <i class="fa-solid fa-pencil-alt"></i>
                    </button>
                    <div id="part-${partNumber}-status"><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>
            </div>
            <textarea id="part-${partNumber}-output" class="input-field mono-font w-full mt-2 h-32 bg-slate-900" readonly oninput="updateWrittenPart(${partNumber}, this)"></textarea>
            
            <div id="part-${partNumber}-prompt-tool" class="hidden space-y-3 mt-4 pt-4 border-t border-slate-700">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="flex items-center gap-2">
                        <input type="number" id="imagePromptCount-${partNumber}" class="input-field mono-font w-16 text-center py-1" value="1" min="1" max="10">
                        <button onclick="generatePrompts('image', ${partNumber})" class="btn-secondary flex-1 justify-center text-xs"><i class="fa-solid fa-image"></i> Ảnh</button>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="number" id="videoPromptCount-${partNumber}" class="input-field mono-font w-16 text-center py-1" value="1" min="1" max="10">
                        <button onclick="generatePrompts('video', ${partNumber})" class="btn-secondary flex-1 justify-center text-xs"><i class="fa-solid fa-video"></i> Video</button>
                    </div>
                     <div class="flex items-center gap-2">
                        <input type="number" id="musicPromptCount-${partNumber}" class="input-field mono-font w-16 text-center py-1" value="1" min="1" max="10">
                        <button onclick="generatePrompts('music', ${partNumber})" class="btn-secondary flex-1 justify-center text-xs"><i class="fa-solid fa-music"></i> Nhạc</button>
                    </div>
                </div>
                <div id="prompt-output-${partNumber}" class="hidden mt-2 p-2 bg-slate-900 rounded-lg whitespace-pre-wrap mono-font text-xs max-h-40 overflow-y-auto"></div>
            </div>
        `;
        partsOutputContainer.appendChild(partDiv);
        
        const originalWordCount = countWords(originalPart);
        const prompt = createOptimizedWriterPrompt(
            state.script.blueprint, 
            originalPart, 
            partNumber, 
            creativityLevel, 
            sourceLanguage,
            targetLanguage,
            role, 
            style, 
            originalWordCount
        );
        
        try {
            const rewrittenPart = await callGenerativeAPI(prompt);
            state.script.writtenParts[index] = rewrittenPart;
            document.getElementById(`part-${partNumber}-output`).value = rewrittenPart;
            document.getElementById(`part-${partNumber}-status`).innerHTML = `<i class="fa-solid fa-check-circle text-green-400"></i>`;
            document.getElementById(`part-${partNumber}-prompt-tool`).classList.remove('hidden');
        } catch (error) {
            const errorMsg = `[LỖI KHI VIẾT PHẦN ${partNumber}: ${error.message}]`;
            state.script.writtenParts[index] = errorMsg;
            document.getElementById(`part-${partNumber}-output`).value = errorMsg;
            document.getElementById(`part-${partNumber}-status`).innerHTML = `<i class="fa-solid fa-exclamation-triangle text-red-400"></i>`;
        } finally {
            partsCompleted++;
            const progressPercentage = (partsCompleted / totalParts) * 100;
            progressBar.style.width = `${progressPercentage}%`;
            if (partsCompleted < totalParts) {
                statusIndicator.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Bước 2: Viết phần ${partsCompleted + 1}/${totalParts}...`;
            }
        }
    }

    statusIndicator.innerHTML = '<i class="fa-solid fa-check-circle text-green-400"></i> Viết kịch bản hoàn tất!';
    document.getElementById('step3-options').classList.remove('hidden');
    setTimeout(() => { progressBarContainer.classList.add('hidden'); }, 1500);
    setButtonLoading(btn, false);
}

// Cập nhật: Prompt của Writer để có logic độ dài thông minh
function createOptimizedWriterPrompt(fullBlueprint, originalPart, partNumber, creativityLevel, sourceLanguage, targetLanguage, role, style, originalWordCount) {
    const newContentPercentage = creativityLevel;
    const originalContentPercentage = 100 - newContentPercentage;
    
    const roleInstruction = role || "Master YouTube Scriptwriter";
    const styleInstruction = style ? `3. Adopt the following writing style: "${style}".` : '';
    
    let wordCountInstruction = '';
    // Conditional Logic cho độ dài
    if (sourceLanguage === targetLanguage) {
        // Strict Rule: +/- 10% word count
        const minWords = Math.round(originalWordCount * 0.90);
        const maxWords = Math.round(originalWordCount * 1.10);
        wordCountInstruction = `Word Count Control (Strict): The final output's word count MUST be strictly between ${minWords} and ${maxWords} words. This is the highest priority rule.`;
    } else {
        // Flexible Guideline
        wordCountInstruction = `Word Count Guideline (Flexible): The goal is to maintain a similar speaking duration to the original ${originalWordCount}-word script part. The top priority is to ensure the translated language is natural, fluent, and culturally appropriate. Do not strictly adhere to the original word count; adapt it for fluency.`;
    }

    return `ROLE: ${roleInstruction}.
TASK: Rewrite and enhance a script part based on a blueprint, a specific content ratio, and word count rules.
TARGET_LANGUAGE: ${targetLanguage}
FULL_BLUEPRINT:
---
${fullBlueprint}
---
SOURCE_PART_NUMBER: ${partNumber}
SOURCE_PART_CONTENT:
---
${originalPart}
---
PROCEDURE:
1. Embody your assigned ROLE and deeply analyze the writing style, core message, and intent of the SOURCE_PART_CONTENT.
2. Rewrite it according to the following principle:
   - **Retain Core Message (${originalContentPercentage}%):** Preserve the core meaning and key information from the original script.
   - **Enhance & Rewrite (${newContentPercentage}%):** Elevate the script by rewriting sentences to be more impactful, adding better hooks, using stronger and more emotionally resonant language, and making the arguments more compelling.
${styleInstruction}

OUTPUT_CRITERIA:
- **${wordCountInstruction}**
- Response MUST be in TARGET_LANGUAGE only.
- Output ONLY the rewritten text. No notes, titles, or parenthetical remarks.`;
}

// === CÁC HÀM CÒN LẠI GIỮ NGUYÊN HOẶC ĐƯỢC CẬP NHẬT LỚN ===
function combineScriptParts() {
    if (state.script.writtenParts.some(p => !p || p.startsWith('[LỖI'))) {
        showToast('Không thể ghép vì một số phần kịch bản bị lỗi hoặc còn trống.', 'error');
        return;
    }
    state.script.finalScript = state.script.writtenParts.join('\n\n---\n\n');
    document.getElementById('finalScriptOutput').innerText = state.script.finalScript;
    document.getElementById('combinedScriptContainer').classList.remove('hidden');
    updateFinalScriptStats();
    showToast("Đã ghép các phần thành kịch bản hoàn thiện!", 'success');
    document.getElementById('step3-options').classList.add('hidden');
}

function updateFinalScriptStats() {
    const statsEl = document.getElementById('final-script-stats');
    if (!statsEl || !state.script.finalScript) {
        if(statsEl) statsEl.innerText = '';
        return;
    }
    const totalWords = countWords(state.script.finalScript);
    const estimatedTime = estimateReadingTime(totalWords);
    statsEl.innerText = `${totalWords} từ ≈ ${estimatedTime}`;
}

async function generatePrompts(type, partNumber) {
    const scriptPartContent = state.script.writtenParts[partNumber - 1];
    if (!scriptPartContent || scriptPartContent.startsWith('[LỖI')) {
        showToast(`Nội dung Phần ${partNumber} bị lỗi hoặc trống.`, 'error');
        return;
    }
    
    const count = document.getElementById(`${type}PromptCount-${partNumber}`).value || 1;
    const role = document.getElementById('roleOutput').value;
    const style = document.getElementById('styleOutput').value;

    const outputDiv = document.getElementById(`prompt-output-${partNumber}`);
    outputDiv.innerHTML = `<div class="flex items-center gap-2 text-xs"><i class="fa-solid fa-spinner fa-spin"></i> Đang tạo...</div>`;
    outputDiv.classList.remove('hidden');
    
    let systemPrompt;

    if (type === 'image') {
        const selectedStyleName = localStorage.getItem('image-style-specific');
        const selectedGroupName = localStorage.getItem('image-style-group');
        const styleDetails = (selectedGroupName && selectedStyleName && imageStyles[selectedGroupName]?.[selectedStyleName]) || "detailed, photorealistic";

        systemPrompt = `ROLE: Visionary Art Director for AI Image Generation.
TASK: Analyze the provided script context. First, identify ${count} distinct, core visual ideas within the script content. Then, for EACH of these core ideas, generate one highly detailed and evocative image prompt that strictly adheres to the specified artistic style.
OUTPUT_LANGUAGE: English.

*** CREATIVE CONTEXT ***
- ROLE of the script writer: "${role}"
- WRITING STYLE of the script: "${style}"
- SCRIPT CONTENT (this part): "${scriptPartContent}"

*** ARTISTIC STYLE (CRITICAL) ***
- Style Name: "${selectedStyleName}"
- Style Description: "${styleDetails}"
- Your task is to apply THIS SPECIFIC style to every generated prompt.

*** INSTRUCTIONS FOR EACH PROMPT ***
1.  Synthesize all context (script content, writer role, artistic style) to define the visual essence for the specific core idea.
2.  Generate a prompt describing these elements in rich detail, seamlessly blending the script's meaning with the artistic style's characteristics. Focus on:
    -   **Subject & Action:** What is the main focus? What is happening?
    -   **Composition & Environment:** How is the scene framed? What is the background?
    -   **Mood & Lighting:** What is the emotion? How is it lit (e.g., dramatic chiaroscuro, soft morning light)?
    -   **Camera & Lens:** e.g., cinematic wide shot, macro detail, dutch angle.
3.  Combine these into a single, cohesive paragraph for each prompt.
4.  CRITICAL: Each generated prompt MUST end with the following technical parameters, exactly as written:
    --ar 16:9 --no text, watermark, logo, blurry, deformed hands, ugly, bad anatomy

*** OUTPUT FORMAT ***
- Use a numbered list for the ${count} prompts. Each prompt must correspond to a unique visual idea from the script.
- Example:
  1. [Full prompt for key idea 1, infused with the "${selectedStyleName}" style, and ending with technical parameters]
  2. [Full prompt for key idea 2, infused with the "${selectedStyleName}" style, and ending with technical parameters]`;

    } else if (type === 'video') {
        const selectedStyleName = localStorage.getItem('video-style-specific');
        const selectedGroupName = localStorage.getItem('video-style-group');
        const styleDetails = (selectedGroupName && selectedStyleName && videoStyles[selectedGroupName]?.[selectedStyleName]) || "standard B-roll";
        
        systemPrompt = `ROLE: Director of Photography & Film Historian.
TASK: Analyze the script content to suggest ${count} specific B-roll shots. For EACH shot, you must interpret a key moment from the script through the lens of the specified cinematic style.
OUTPUT_LANGUAGE: English.

*** SCRIPT CONTEXT ***
- Script Content: "${scriptPartContent}"

*** CINEMATIC STYLE (CRITICAL) ***
- Style Name: "${selectedStyleName}"
- Style Description & Keywords: "${styleDetails}"
- Your suggestions must embody the visual language of this style.

*** INSTRUCTIONS FOR EACH SHOT ***
1.  Identify ${count} distinct key moments or ideas in the script.
2.  For each moment, describe a B-roll shot with these elements, all filtered through the chosen cinematic style:
    -   **Action:** What is happening in the shot?
    -   **Shot Composition:** (e.g., wide shot, close-up, rule of thirds, leading lines).
    -   **Camera Angle & Movement:** (e.g., low-angle static, slow dolly in, handheld tracking shot).
    -   **Lighting & Mood:** (e.g., high-contrast film noir lighting, soft natural light, vibrant neon glow).

*** OUTPUT FORMAT ***
- Use a numbered list for the ${count} shots.
- Example:
  1. **Moment:** [Briefly describe the first key moment from the script]
     **Shot:** [Detailed shot description incorporating the "${selectedStyleName}" style, covering Action, Composition, Camera, and Lighting]
  2. **Moment:** [Briefly describe the second key moment from the script]
     **Shot:** [Detailed shot description incorporating the "${selectedStyleName}" style]`;

    } else { // music
        systemPrompt = `ROLE: AI Music Prompt Engineer for tools like Suno AI.
TASK: Analyze the script's content and emotion to generate ${count} concise music prompts.

*** SCRIPT CONTEXT ***
- Overall Writing Style: "${style}"
- Script Part Content: "${scriptPartContent}"

*** CRITICAL RULES (NON-NEGOTIABLE) ***
1.  **NO VOCALS:** The primary rule is that the output MUST be for INSTRUMENTAL music only. Do not use words like 'vocal', 'singing', 'choir', 'lyrics', 'voice', or 'chant'. The output must generate music without any human singing. This is the most important rule.
2.  **SUNO AI FORMAT:** The prompt must be a short, concise phrase or a comma-separated list of keywords. Keep it under 15 words.
3.  **EMOTIONAL CORE:** The prompt must directly reflect the core emotion and mood of the script content (e.g., suspenseful, happy, mysterious, epic).
4.  **DESCRIPTIVE KEYWORDS:** Use powerful keywords for genre, instruments, and tempo (e.g., "cinematic trailer music", "upbeat funk", "dark ambient synth", "slow emotional piano").

*** OUTPUT FORMAT ***
- Use a numbered list for the ${count} prompts.
- Output ONLY the raw prompt text, ready to be copied into Suno AI.
- Example:
  1. Instrumental, epic cinematic trailer, powerful orchestra, suspenseful strings
  2. Background lofi beat, chillhop, relaxing piano, no vocals
  3. Dark ambient soundscape, mysterious synth pads, slow tempo`;
    }

    try {
        const result = await callGenerativeAPI(systemPrompt);
        outputDiv.innerText = result;
    } catch(error) {
        outputDiv.innerText = `Lỗi: ${error.message}`;
    }
}

function downloadScriptAsTxt() {
    if (!state.script.finalScript || state.script.finalScript.trim() === "") {
         showToast("Chưa có kịch bản hoàn thiện để tải về.", 'error'); return;
    }
    const blob = new Blob([state.script.finalScript], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'kich-ban-final.txt';
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
    showToast('Đã bắt đầu tải file kịch bản!', 'success');
}

function copyFullScript() {
    if (!state.script.finalScript) {
         showToast("Chưa có kịch bản để sao chép.", 'error'); return;
    }
    navigator.clipboard.writeText(state.script.finalScript.trim()).then(() => {
        showToast("Đã sao chép kịch bản vào clipboard!", 'success');
    }).catch(err => {
        showToast("Lỗi khi sao chép: " + err, 'error');
    });
}



async function generateVoSuggestions() {
    if (!state.script.finalScript || state.script.finalScript.trim() === "") {
        showToast("Chưa có kịch bản hoàn thiện để phân tích.", 'error');
        return;
    }

    const btn = document.getElementById('generateVoBtn');
    const outputDiv = document.getElementById('voiceSuggestionsOutput');
    setButtonLoading(btn, true, 'AI đang phân tích...');
    outputDiv.classList.add('hidden');

    // Lấy thêm ngữ cảnh từ Role và Style đã xác định ở Bước 2
    const role = document.getElementById('roleOutput').value || "Chuyên gia";
    const style = document.getElementById('styleOutput').value || "Chia sẻ kiến thức";
    const targetLanguage = document.getElementById('output-language-select').value;


    const prompt = `ROLE: Expert Casting Director for Voiceovers.
TASK: Analyze the provided script and its context to recommend the ideal voiceover profile.
TARGET_LANGUAGE: ${targetLanguage}

SCRIPT_CONTEXT:
- Script Author's Role: "${role}"
- Script's Writing Style: "${style}"

FULL_SCRIPT_TEXT:
---
${getWordSlice(state.script.finalScript, 500)}... 
---

PROCEDURE:
1.  Read the script and analyze its tone, topic, and intended audience.
2.  Based on the analysis, determine the most suitable voice profile.
3.  Provide your recommendation in a single, valid JSON object. All text values in the JSON MUST be in the TARGET_LANGUAGE.

JSON_STRUCTURE:
{
  "gender": "Nam' or 'Nữ'",
  "age_range": "e.g., 'Thanh niên (20-30 tuổi)', 'Trung niên (35-50 tuổi)', 'Lớn tuổi (trên 55 tuổi)'",
  "primary_style": "The main delivery style, e.g., 'Kể chuyện (Storyteller)', 'Tin tức (News Anchor)', 'Giải trí (Entertainer)', 'Thuyết minh (Documentary)', 'Reviewer'",
  "vocal_characteristics": ["An array of 3-4 descriptive keywords, e.g., 'Trầm ấm', 'Truyền cảm', 'Rõ ràng', 'Năng lượng cao', 'Chắc chắn', 'Thân thiện'"],
  "justification": "A short, single sentence explaining WHY this voice is suitable for the script."
}

CRITICAL_RULE: Respond ONLY with the valid JSON object and nothing else. Do not include any explanatory text or markdown formatting outside the JSON.`;

    try {
        const result = await callGenerativeAPI(prompt);
        // Cố gắng tìm và parse JSON từ kết quả trả về, phòng trường hợp AI thêm text thừa
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI did not return a valid JSON object.");
        }
        
        const data = JSON.parse(jsonMatch[0]);

        outputDiv.innerHTML = `
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div class="font-semibold text-slate-400">Giới tính:</div>
                <div class="text-white font-bold">${data.gender || 'N/A'}</div>

                <div class="font-semibold text-slate-400">Độ tuổi:</div>
                <div class="text-white font-bold">${data.age_range || 'N/A'}</div>

                <div class="font-semibold text-slate-400">Phong cách chính:</div>
                <div class="text-white font-bold">${data.primary_style || 'N/A'}</div>

                <div class="font-semibold text-slate-400">Đặc điểm giọng:</div>
                <div>${(data.vocal_characteristics || []).map(tag => `<span class="tag !text-xs">${tag}</span>`).join(' ')}</div>
            </div>
            <p class="text-xs text-sky-300 mt-3 pt-3 border-t border-slate-700">
                <i class="fa-solid fa-circle-info"></i> <span class="font-bold">Lý do đề xuất:</span> ${data.justification || 'Không có'}
            </p>
        `;
        outputDiv.classList.remove('hidden');

    } catch (error) {
        showToast(`Lỗi khi lấy đề xuất giọng đọc: ${error.message}`, 'error');
        outputDiv.innerHTML = `<p class="text-red-400">Không thể xử lý đề xuất từ AI.</p>`;
        outputDiv.classList.remove('hidden');
    } finally {
        setButtonLoading(btn, false);
    }
}