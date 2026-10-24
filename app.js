// ルールデータを読み込む
let rulesData = null;

// グローバルイベントリスナーフラグ
let eventListenersInitialized = false;

// ===== ドラムピッカー =====
let drumPickerTargetInput = null;

/** タッチデバイス（iPad/iPhone等）かどうかを判定 */
function isTouchDevice() {
    return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}

/** ドラムピッカーのHTML要素を生成してbodyに追加（1回だけ呼ぶ） */
function createDrumPicker() {
    if (document.getElementById('drum-picker-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'drum-picker-overlay';
    overlay.id = 'drum-picker-overlay';
    overlay.innerHTML = `
        <div class="drum-picker-container">
            <div class="drum-picker-header">
                <span class="drum-picker-cancel" id="drum-picker-cancel">キャンセル</span>
                <span class="drum-picker-title" id="drum-picker-title">数値を選択</span>
                <span class="drum-picker-done" id="drum-picker-done">完了</span>
            </div>
            <div class="drum-picker-wheel-container">
                <div class="drum-picker-wheel" id="drum-picker-wheel"></div>
                <div class="drum-picker-selection-indicator"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // 背景タップでキャンセル
    overlay.addEventListener('touchend', (e) => {
        if (e.target === overlay) hideDrumPicker(false);
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideDrumPicker(false);
    });

    document.getElementById('drum-picker-cancel').addEventListener('click', () => hideDrumPicker(false));
    document.getElementById('drum-picker-done').addEventListener('click', () => hideDrumPicker(true));
    document.getElementById('drum-picker-cancel').addEventListener('touchend', (e) => { e.preventDefault(); hideDrumPicker(false); });
    document.getElementById('drum-picker-done').addEventListener('touchend', (e) => { e.preventDefault(); hideDrumPicker(true); });
}

/** ドラムピッカーを表示する */
function showDrumPicker(inputEl) {
    drumPickerTargetInput = inputEl;

    const min = parseInt(inputEl.min) || 0;
    const max = parseInt(inputEl.max) || 10;
    const current = parseInt(inputEl.value);
    const currentVal = isNaN(current) ? min : Math.max(min, Math.min(max, current));

    const wheel = document.getElementById('drum-picker-wheel');
    wheel.innerHTML = '';

    // 上パディング
    const padTop = document.createElement('div');
    padTop.className = 'drum-picker-wheel-padding';
    wheel.appendChild(padTop);

    // 数値アイテムを生成
    for (let i = min; i <= max; i++) {
        const item = document.createElement('div');
        item.className = 'drum-picker-item';
        item.textContent = String(i);
        item.dataset.value = i;
        wheel.appendChild(item);
    }

    // 下パディング
    const padBottom = document.createElement('div');
    padBottom.className = 'drum-picker-wheel-padding';
    wheel.appendChild(padBottom);

    // ラベルを入力フィールドのlabelから取得（なければデフォルト）
    const titleEl = document.getElementById('drum-picker-title');
    const group = inputEl.closest('.number-input-group');
    if (group) {
        const lbl = group.querySelector('label');
        titleEl.textContent = lbl ? lbl.textContent + ' 数値を選択' : '数値を選択';
    } else {
        titleEl.textContent = '数値を選択';
    }

    // オーバーレイ表示
    const overlay = document.getElementById('drum-picker-overlay');
    overlay.classList.add('active');

    // 現在値の位置にスクロール
    const itemIndex = currentVal - min;
    // アニメーション後にスクロール
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            wheel.scrollTop = itemIndex * 44;
        });
    });
}

/** ドラムピッカーを閉じる。apply=trueなら値を確定する */
function hideDrumPicker(apply) {
    if (apply && drumPickerTargetInput) {
        const wheel = document.getElementById('drum-picker-wheel');
        const min = parseInt(drumPickerTargetInput.min) || 0;
        const max = parseInt(drumPickerTargetInput.max) || 10;
        const itemIndex = Math.round(wheel.scrollTop / 44);
        const value = Math.max(min, Math.min(max, min + itemIndex));

        drumPickerTargetInput.value = value;
        // スコア再計算をトリガー
        drumPickerTargetInput.dispatchEvent(new Event('input', { bubbles: true }));
        drumPickerTargetInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const overlay = document.getElementById('drum-picker-overlay');
    if (overlay) overlay.classList.remove('active');
    drumPickerTargetInput = null;
}

/** タッチデバイスで数値入力をタップしたときドラムピッカーを開くイベントを登録 */
function setupDrumPickerTouchHandlers() {
    if (!isTouchDevice()) return;

    document.addEventListener('touchstart', function(e) {
        const target = e.target;
        if (
            target.tagName === 'INPUT' &&
            target.type === 'number' &&
            !target.disabled
        ) {
            e.preventDefault();
            showDrumPicker(target);
        }
    }, { passive: false });
}
// ===== ドラムピッカー ここまで =====

// ===== comment.md 読み込み =====
/** Markdownテキストをごく簡易的にHTMLに変換（リンクと改行のみ） */
function simpleMarkdownToHtml(md) {
    let html = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    // [text](url) → <a>
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // 生URL → <a>
    html = html.replace(/(^|[\s>])(https?:\/\/[^\s<]+)/g,
        '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    // 改行
    html = html.replace(/\n/g, '<br>');
    return html;
}

/** comment.md を読み込んで右上に表示する */
async function loadAuthorComment() {
    const container = document.getElementById('author-comment');
    if (!container) return;

    try {
        const res = await fetch('comment.md');
        if (!res.ok) return;
        const md = (await res.text()).trim();
        if (!md) return;

        container.innerHTML = simpleMarkdownToHtml(md);

        // テキストがはみ出す場合は省略記号を付ける（max-height超過チェック）
        requestAnimationFrame(() => {
            if (container.scrollHeight > container.clientHeight) {
                container.classList.add('author-comment-overflow');
            }
        });
    } catch (e) {
        // comment.md が無い場合は何も表示しない
    }
}
// ===== comment.md ここまで =====

// ===== PDF保存 =====
/** スクリプトを1回だけ読み込む（PDF保存ボタンが押されたときに初めて読み込む） */
function loadScriptOnce(src) {
    loadScriptOnce.cache = loadScriptOnce.cache || {};
    if (!loadScriptOnce.cache[src]) {
        loadScriptOnce.cache[src] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => {
                delete loadScriptOnce.cache[src];
                reject(new Error(`スクリプトの読み込みに失敗しました: ${src}`));
            };
            document.head.appendChild(script);
        });
    }
    return loadScriptOnce.cache[src];
}

/** ファイル名に使えない文字・空白を「_」に置き換える */
function sanitizeFileNamePart(text) {
    return (text || '').trim().replace(/[\\/:*?"<>|\s]+/g, '_');
}

/** PDFのファイル名を作る（チームNo・ラウンドが空欄なら日時） */
function buildPdfFileName() {
    const parts = [
        sanitizeFileNamePart(document.getElementById('teamNo').value),
        sanitizeFileNamePart(document.getElementById('round').value)
    ].filter(part => part);

    if (parts.length === 0) {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        parts.push(`${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`);
    }
    return `FLL_${parts.join('_')}.pdf`;
}

/** html2canvasの複製に対する前処理（画像の差し替え・入力欄の置き換え） */
function prepareCloneForCapture(clonedDoc) {
    const clonedWindow = clonedDoc.defaultView;

    // file://で開いた場合に画像ファイルが別オリジン扱いになり画像化できないため、
    // 埋め込み画像（lib/pdf-images.js）に差し替える
    const embeddedImages = window.PDF_EMBEDDED_IMAGES;
    if (embeddedImages) {
        clonedDoc.querySelectorAll('.title-image').forEach(img => {
            img.src = embeddedImages.title;
        });
        clonedDoc.querySelectorAll('.penalty-icon').forEach(icon => {
            icon.style.backgroundImage = `url("${embeddedImages.penaltyIcon}")`;
        });
    }

    // html2canvasは入力欄の値を描画しないことがあるため、
    // テキスト・数値入力を同じ見た目のspanに置き換える
    clonedDoc.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        const style = clonedWindow.getComputedStyle(input);
        // 複製には入力後の値が引き継がれないため、元の入力欄から値を取得
        const original = input.id ? document.getElementById(input.id) : null;
        const span = clonedDoc.createElement('span');
        span.textContent = original ? original.value : input.value;
        span.className = input.className;
        Object.assign(span.style, {
            display: 'inline-block',
            boxSizing: 'border-box',
            width: `${input.offsetWidth}px`,
            height: `${input.offsetHeight}px`,
            lineHeight: `${input.clientHeight}px`,
            padding: `0 ${style.paddingRight} 0 ${style.paddingLeft}`,
            border: style.border,
            backgroundColor: style.backgroundColor,
            color: style.color,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            textAlign: style.textAlign,
            verticalAlign: 'middle',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
        });
        input.replaceWith(span);
    });
}

/** エラーにどの段階で失敗したかを付けて投げ直す */
function withStage(stage, fn) {
    return Promise.resolve().then(fn).catch(error => {
        const wrapped = new Error(`${stage}: ${error && error.name ? error.name + ': ' : ''}${error && error.message ? error.message : error}`);
        wrapped.cause = error;
        throw wrapped;
    });
}

/** 指定した倍率でスコアシートを画像化し、A4横1枚のPDFを作る */
async function createPdfAtScale(container, scale) {
    const PDF_PAGE_MARGIN_MM = 3; // 印刷時（styles.cssの@page）と同じ余白

    const canvas = await withStage('画像化', async () => {
        const result = await html2canvas(container, {
            scale: scale,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: prepareCloneForCapture
        });
        if (!result || !result.width || !result.height) {
            throw new Error('画像が空です');
        }
        return result;
    });

    try {
        return await withStage('PDF化', () => {
            // メモリ不足の場合、toDataURLは空のデータ（"data:,"）を返すため明示的に確認する
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl.length < 100) {
                throw new Error(`画像データを取得できません（${canvas.width}x${canvas.height}px、メモリ不足の可能性）`);
            }

            // A4横の余白内に、縦横比を保って収める（横方向は中央寄せ）
            const pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const maxWidth = pdf.internal.pageSize.getWidth() - PDF_PAGE_MARGIN_MM * 2;
            const maxHeight = pdf.internal.pageSize.getHeight() - PDF_PAGE_MARGIN_MM * 2;
            const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
            const imageWidth = canvas.width * ratio;
            const imageHeight = canvas.height * ratio;
            pdf.addImage(dataUrl, 'PNG',
                PDF_PAGE_MARGIN_MM + (maxWidth - imageWidth) / 2, PDF_PAGE_MARGIN_MM,
                imageWidth, imageHeight, undefined, 'FAST');
            return pdf;
        });
    } finally {
        // 次の倍率で再試行する前にメモリを解放する
        canvas.width = 0;
        canvas.height = 0;
    }
}

/** スコアシートを画像化し、A4横1枚のPDFとしてダウンロードする */
async function saveAsPdf() {
    // 画像化の倍率（3倍で約295dpi相当）。iPad等でメモリ不足により失敗した場合は順に下げて再試行する
    const CAPTURE_SCALES = [3, 2, 1.5];

    const button = document.getElementById('pdf-save-btn');
    const container = document.querySelector('.container');
    if (!button || !container) return;

    const originalLabel = button.textContent;
    const originalTransform = container.style.transform;
    button.disabled = true;
    button.textContent = 'PDF作成中...';

    const errors = [];
    try {
        await withStage('ライブラリ読み込み', () => Promise.all([
            loadScriptOnce('lib/html2canvas-pro.min.js'),
            loadScriptOnce('lib/jspdf.umd.min.js'),
            loadScriptOnce('lib/pdf-images.js')
        ]));

        // 最新の高さでカラムを振り分けてから、画面用の縮小表示を外して画像化
        refreshPrintLayout();
        container.style.transform = 'none';

        let pdf = null;
        for (const scale of CAPTURE_SCALES) {
            try {
                pdf = await createPdfAtScale(container, scale);
                console.log(`PDFを倍率${scale}で作成しました`);
                break;
            } catch (error) {
                console.warn(`倍率${scale}でのPDF作成に失敗しました:`, error);
                errors.push(`倍率${scale}: ${error.message}`);
            }
        }
        if (!pdf) {
            throw new Error('すべての倍率で失敗しました');
        }

        await withStage('保存', () => pdf.save(buildPdfFileName()));
    } catch (error) {
        console.error('PDFの作成に失敗しました:', error, errors);
        const details = errors.length > 0 ? errors.join('\n') : error.message;
        alert(`PDFの作成に失敗しました。\n\n${details}\n\n端末: ${navigator.userAgent}`);
    } finally {
        container.style.transform = originalTransform;
        button.disabled = false;
        button.textContent = originalLabel;
    }
}
// ===== PDF保存 ここまで =====

// ページ読み込み時にルールを読み込む
document.addEventListener('DOMContentLoaded', async () => {
    // JSON読み込みボタンのイベントリスナーを設定
    const jsonLoadBtn = document.getElementById('json-load-btn');
    const jsonFileInput = document.getElementById('json-file-input');
    
    jsonLoadBtn.addEventListener('click', () => {
        jsonFileInput.click();
    });
    
    jsonFileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const text = await file.text();
                rulesData = JSON.parse(text);
                // 既存のコンテンツをクリア
                clearContent();
                // 新しいルールで初期化
                initializeApp();
                alert('JSONファイルの読み込みに成功しました。');
            } catch (error) {
                console.error('JSONファイルの読み込みに失敗しました:', error);
                alert('JSONファイルの読み込みに失敗しました。ファイル形式を確認してください。');
            }
        }
    });
    
    // PDF保存ボタン
    document.getElementById('pdf-save-btn').addEventListener('click', saveAsPdf);

    // グローバルイベントリスナーを1回だけ設定
    if (!eventListenersInitialized) {
        // すべての入力にイベントリスナーを追加
        document.addEventListener('input', handleInputChange);
        document.addEventListener('change', handleInputChange);
        eventListenersInitialized = true;
    }
    
    // ページ読み込み時に固定セクションを右下に配置
    // 少し遅延させてDOMが完全に読み込まれた後に実行
    setTimeout(() => {
        moveFixedSectionsToBottom();
    }, 0);
    
    // ウィンドウリサイズ時にスケーリングを再計算
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            autoScaleContent();
        }, 250);
    });
    
    // ドラムピッカーを初期化（タッチデバイス用）
    createDrumPicker();
    setupDrumPickerTouchHandlers();

    // 製作者コメントを読み込み
    loadAuthorComment();

    // 初期読み込み（rules.json）
    loadRulesFile('rules.json');
});

// ルールファイルを読み込む関数
async function loadRulesFile(filename) {
    try {
        console.log(`ルールファイルを読み込み中: ${filename}`);
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        rulesData = await response.json();
        console.log('ルールファイルの読み込みに成功しました', rulesData);
        if (rulesData) {
            initializeApp();
        } else {
            console.error('ルールデータが空です');
        }
    } catch (error) {
        console.error('ルールファイルの読み込みに失敗しました:', error);
        console.error('エラー詳細:', error.message);
        console.error('注意: ローカルファイルを直接開いている場合、Webサーバー経由でアクセスしてください');
        // エラー時でもレイアウトは維持される（空の状態で表示）
        // 固定セクションを右下に配置（念のため再度実行）
        setTimeout(() => {
            moveFixedSectionsToBottom();
        }, 100);
    }
}

// コンテンツをクリアする関数
function clearContent() {
    document.getElementById('equipment-content').innerHTML = '';
    document.getElementById('precision-content').innerHTML = '';
    document.getElementById('gp-content').innerHTML = '';
    
    // 左カラムのミッションのみをクリア（装備の点検は残す）
    const missionsLeft = document.getElementById('missions-left');
    const leftMissions = missionsLeft.querySelectorAll('.mission-section:not(#equipment-inspection)');
    leftMissions.forEach(mission => mission.remove());
    
    // 右カラムのミッションのみをクリア（固定セクションは残す）
    const missionsRight = document.getElementById('missions-right');
    const rightMissions = missionsRight.querySelectorAll('.mission-section:not(.fixed-section):not(.score-result)');
    rightMissions.forEach(mission => mission.remove());
    
    // スコアをリセット
    const totalScoreElement = document.getElementById('total-score');
    if (totalScoreElement) {
        totalScoreElement.textContent = '0';
    }
}

// アプリケーションの初期化
function initializeApp() {
    if (!rulesData) {
        console.error('rulesDataがありません');
        return; // rulesDataがない場合は何もしない
    }
    
    console.log('アプリケーションを初期化中...', rulesData);
    console.log('ミッション数:', rulesData.missions ? rulesData.missions.length : 0);
    
    try {
        renderEquipmentInspection();
        console.log('装備の点検をレンダリング完了');
        
        renderMissions();
        console.log('ミッションをレンダリング完了');
        
        // ミッション生成後に固定セクションを右カラムの最後に移動
        moveFixedSectionsToBottom();
        console.log('固定セクションを移動完了');
        
        renderPrecisionTokens();
        console.log('精密トークンをレンダリング完了');
        
        renderGraciousProfessionalism();
        console.log('Gracious Professionalismをレンダリング完了');

        // 左右カラムの高さが揃うようにミッションを振り分け直し、印刷用縮小率を事前に計算
        refreshPrintLayout();

        // 依存関係を初期化（少し遅延させて確実にDOMに追加された後に実行）
        setTimeout(() => {
            initializeDependencies();
        }, 100);
        
        // コンテンツを自動的にスケーリング（複数回実行で確実に）
        autoScaleContent();
        setTimeout(() => autoScaleContent(), 300);
        setTimeout(() => autoScaleContent(), 600);
        
        console.log('アプリケーションの初期化が完了しました');
    } catch (error) {
        console.error('初期化中にエラーが発生しました:', error);
        console.error('エラースタック:', error.stack);
    }
}

// 固定セクションを右カラムの最後に移動
function moveFixedSectionsToBottom() {
    const rightContainer = document.getElementById('missions-right');
    if (!rightContainer) return;
    
    const precisionSection = document.getElementById('precision-tokens');
    const gpSection = document.getElementById('gracious-professionalism');
    const scoreSection = rightContainer.querySelector('.score-result') || document.querySelector('.score-result');
    
    // 既存のスペーサーを削除
    const existingSpacer = rightContainer.querySelector('.fixed-sections-spacer');
    if (existingSpacer) {
        existingSpacer.remove();
    }
    
    // すべてのミッションセクションを取得（固定セクション以外）
    const missions = Array.from(rightContainer.children).filter(child => 
        child.classList.contains('mission-section') && 
        !child.classList.contains('fixed-section') && 
        !child.classList.contains('score-result') &&
        !child.classList.contains('fixed-sections-spacer')
    );
    
    // 固定セクションを一旦削除
    if (precisionSection && precisionSection.parentNode === rightContainer) {
        rightContainer.removeChild(precisionSection);
    }
    if (gpSection && gpSection.parentNode === rightContainer) {
        rightContainer.removeChild(gpSection);
    }
    if (scoreSection && scoreSection.parentNode === rightContainer) {
        rightContainer.removeChild(scoreSection);
    }
    
    // スペーサー要素を作成（固定セクションを下部に押し下げるため）
    const spacer = document.createElement('div');
    spacer.className = 'fixed-sections-spacer';
    
    // ミッションの後にスペーサーと固定セクションを追加
    if (missions.length > 0) {
        // 最後のミッションの後にスペーサーを挿入
        const lastMission = missions[missions.length - 1];
        rightContainer.insertBefore(spacer, lastMission.nextSibling);
        // 固定セクションをスペーサーの後に追加
        if (precisionSection) rightContainer.insertBefore(precisionSection, spacer.nextSibling);
        if (gpSection) rightContainer.insertBefore(gpSection, precisionSection ? precisionSection.nextSibling : spacer.nextSibling);
        if (scoreSection) rightContainer.appendChild(scoreSection);
    } else {
        // ミッションがない場合は、スペーサーを最初に追加してから固定セクションを追加
        rightContainer.insertBefore(spacer, rightContainer.firstChild);
        if (precisionSection) rightContainer.appendChild(precisionSection);
        if (gpSection) rightContainer.appendChild(gpSection);
        if (scoreSection) rightContainer.appendChild(scoreSection);
    }
    
    // レイアウト変更後に自動スケーリングを適用（少し遅延）
    setTimeout(() => autoScaleContent(), 100);
}

// 左右カラムの高さが最も揃う位置でミッションを振り分ける（問題数の偏りでA4からはみ出すのを防ぐ）
function balanceMissionColumns() {
    const leftContainer = document.getElementById('missions-left');
    const rightContainer = document.getElementById('missions-right');
    if (!leftContainer || !rightContainer || !rulesData || !rulesData.missions) return;

    // ミッションを番号順に取得
    const sections = rulesData.missions
        .map((mission, index) => document.getElementById(`mission-${index + 1}`))
        .filter(section => section);
    if (sections.length === 0) return;

    const columnGap = parseFloat(getComputedStyle(leftContainer).rowGap) || 0;
    const heightOf = (el) => el ? el.offsetHeight + columnGap : 0;

    // 各カラムの固定部分の高さ（左：装備の点検、右：精密トークン・GP・採点結果）
    const leftBase = heightOf(document.getElementById('equipment-inspection'));
    const rightBase = heightOf(document.getElementById('precision-tokens')) +
        heightOf(document.getElementById('gracious-professionalism')) +
        heightOf(rightContainer.querySelector('.score-result'));

    const heights = sections.map(heightOf);
    const totalHeight = heights.reduce((sum, h) => sum + h, 0);

    // 高い方のカラムが最も低くなる分割位置を探す
    let bestSplit = 0;
    let bestMaxHeight = Infinity;
    let leftHeight = leftBase;
    for (let split = 0; split <= sections.length; split++) {
        if (split > 0) leftHeight += heights[split - 1];
        const rightHeight = rightBase + (totalHeight - (leftHeight - leftBase));
        const maxHeight = Math.max(leftHeight, rightHeight);
        if (maxHeight < bestMaxHeight) {
            bestMaxHeight = maxHeight;
            bestSplit = split;
        }
    }

    // 振り分け直す（右カラムはスペーサー・固定セクションの前に挿入）
    const rightAnchor = rightContainer.querySelector('.fixed-sections-spacer, .fixed-section, .score-result');
    sections.forEach((section, index) => {
        if (index < bestSplit) {
            leftContainer.appendChild(section);
        } else {
            rightContainer.insertBefore(section, rightAnchor);
        }
    });
    console.log(`カラム振り分け: 左 ミッション1-${bestSplit}、右 ミッション${bestSplit + 1}-${sections.length}`);
}

// 内容の高さを測り、A4横1枚に収まる印刷用縮小率を設定する
function updatePrintZoom() {
    const container = document.querySelector('.container');
    if (!container) return;

    const A4_LANDSCAPE_HEIGHT_MM = 210;
    const PRINT_PAGE_MARGIN_MM = 3;  // styles.cssの@pageのmarginと合わせること
    const MM_TO_PX = 96 / 25.4;
    const PRINTABLE_HEIGHT = Math.floor((A4_LANDSCAPE_HEIGHT_MM - PRINT_PAGE_MARGIN_MM * 2) * MM_TO_PX);
    const SAFETY_MARGIN = 10;        // ブラウザ差・丸め誤差用の余裕
    const PRINT_PADDING_DIFF = 8;    // 印刷時の.containerのpadding増加分（4px→8px、上下）
    const DEFAULT_ZOOM = 0.95;

    // min-heightの影響を除いた内容の高さを測る
    const originalMinHeight = container.style.minHeight;
    container.style.minHeight = '0';
    const contentHeight = container.offsetHeight + PRINT_PADDING_DIFF;
    container.style.minHeight = originalMinHeight;

    const zoom = Math.min(DEFAULT_ZOOM, (PRINTABLE_HEIGHT - SAFETY_MARGIN) / contentHeight);
    document.documentElement.style.setProperty('--print-zoom', zoom.toFixed(3));
    console.log(`印刷用縮小率: ${zoom.toFixed(3)}（内容の高さ: ${contentHeight}px）`);
}

// カラムの振り分けと印刷用縮小率をまとめて更新する
function refreshPrintLayout() {
    balanceMissionColumns();
    updatePrintZoom();
}

// beforeprintが発火しない環境（iPadのSafari等）でも正しい縮小率になるよう、
// 高さが変わりうるタイミングで事前に計算しておく
window.addEventListener('load', refreshPrintLayout);
if (document.fonts) {
    // Webフォント（Typekit）は後から読み込まれるため、読み込み完了のたびに再計算
    if (document.fonts.ready) document.fonts.ready.then(refreshPrintLayout);
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', refreshPrintLayout);
}
window.addEventListener('resize', () => {
    clearTimeout(refreshPrintLayout.timer);
    refreshPrintLayout.timer = setTimeout(refreshPrintLayout, 250);
});

// 印刷直前にも最新の高さで再計算する（発火する環境のみ）
window.addEventListener('beforeprint', refreshPrintLayout);

// 固定セクションを右カラムに挿入
function insertFixedSections() {
    const rightContainer = document.getElementById('missions-right');
    
    // 既存の固定セクションを削除（再読み込み時用）
    const existingPrecision = document.getElementById('precision-tokens');
    const existingGP = document.getElementById('gracious-professionalism');
    const existingScore = document.querySelector('.score-result');
    
    if (existingPrecision) existingPrecision.remove();
    if (existingGP) existingGP.remove();
    if (existingScore) existingScore.remove();
    
    // 精密トークンセクションを作成
    const precisionSection = document.createElement('section');
    precisionSection.className = 'mission-section fixed-section';
    precisionSection.id = 'precision-tokens';
    precisionSection.innerHTML = `
        <h2 class="mission-title">精密トークン</h2>
        <div class="mission-content" id="precision-content"></div>
    `;
    
    // Gracious Professionalismセクションを作成
    const gpSection = document.createElement('section');
    gpSection.className = 'mission-section fixed-section';
    gpSection.id = 'gracious-professionalism';
    gpSection.innerHTML = `
        <h2 class="mission-title">ロボットゲームで示されたGracious Professionalism®</h2>
        <div class="mission-content" id="gp-content"></div>
    `;
    
    // 採点結果セクションを作成
    const scoreSection = document.createElement('section');
    scoreSection.className = 'score-result';
    scoreSection.innerHTML = `
        <h2 class="mission-title">採点結果</h2>
        <div class="mission-content">
            <div class="score-display">
                <span class="score-value" id="total-score">0</span>
                <span class="score-label">点</span>
            </div>
            <div class="footer">
                <a href="https://fll.gupilab.net" target="_blank" rel="noopener noreferrer">https://fll.gupilab.net</a>
            </div>
        </div>
    `;
    
    // 右カラムに追加（ミッションの後、採点結果は最後）
    rightContainer.appendChild(precisionSection);
    rightContainer.appendChild(gpSection);
    rightContainer.appendChild(scoreSection);
}

// 装備の点検セクションをレンダリング
function renderEquipmentInspection() {
    const container = document.getElementById('equipment-content');
    const equipment = rulesData.equipmentInspection;
    
    const criterionDiv = document.createElement('div');
    criterionDiv.className = 'criterion';
    
    const label = document.createElement('div');
    label.className = 'criterion-label';
    label.textContent = equipment.description;
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'criterion-input';
    
    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';
    
    ['いいえ', 'はい'].forEach((option, index) => {
        const labelEl = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'equipment-inspection';
        radio.value = index === 0 ? '0' : equipment.points;
        radio.dataset.points = index === 0 ? '0' : equipment.points;
        
        labelEl.appendChild(radio);
        labelEl.appendChild(document.createTextNode(option));
        radioGroup.appendChild(labelEl);
    });
    
    inputGroup.appendChild(radioGroup);
    criterionDiv.appendChild(label);
    criterionDiv.appendChild(inputGroup);
    container.appendChild(criterionDiv);
}

// ミッションセクションをレンダリング
function renderMissions() {
    if (!rulesData || !rulesData.missions) {
        console.error('ミッションデータがありません');
        return;
    }
    
    const leftContainer = document.getElementById('missions-left');
    const rightContainer = document.getElementById('missions-right');
    
    if (!leftContainer || !rightContainer) {
        console.error('コンテナが見つかりません');
        return;
    }
    
    console.log('ミッションをレンダリング中...', rulesData.missions.length, '個のミッション');
    
    // ミッションを左右に分ける（仮配置。描画後にbalanceMissionColumns()で高さに応じて振り分け直す）
    const splitPoint = Math.ceil(rulesData.missions.length / 2);
    
    rulesData.missions.forEach((mission, index) => {
        const container = index < splitPoint ? leftContainer : rightContainer;
        const section = document.createElement('section');
        section.className = 'mission-section';
        section.id = `mission-${index + 1}`;
        
        const title = document.createElement('h2');
        title.className = 'mission-title';
        title.textContent = `ミッション${String(index + 1).padStart(2, '0')} ${mission.name}`;
        
        if (mission.hasPenalty) {
            const penaltyIcon = document.createElement('span');
            penaltyIcon.className = 'penalty-icon';
            title.appendChild(penaltyIcon);
        }
        
        const content = document.createElement('div');
        content.className = 'mission-content';
        
        mission.criteria.forEach((criterion, critIndex) => {
            const criterionDiv = document.createElement('div');
            criterionDiv.className = 'criterion';
            
            // 依存関係・排他関係がある場合は、ミッションと基準のインデックスを設定
            if (criterion.dependsOn !== undefined || criterion.exclusiveWith !== undefined) {
                criterionDiv.dataset.missionIndex = index;
                criterionDiv.dataset.criterionIndex = critIndex;
            }

            // 依存関係がある場合は、データ属性を設定
            if (criterion.dependsOn !== undefined) {
                console.log(`依存関係を設定: ミッション${index + 1}の基準${critIndex}は基準${criterion.dependsOn}に依存`);
                criterionDiv.dataset.dependsOn = criterion.dependsOn;
                // 初期状態で無効化スタイルを追加
                criterionDiv.classList.add('criterion-disabled');
            }

            // 排他関係（OR条件）がある場合は、データ属性を設定（数値または配列で指定）
            if (criterion.exclusiveWith !== undefined) {
                console.log(`排他関係を設定: ミッション${index + 1}の基準${critIndex}は基準${criterion.exclusiveWith}と排他`);
                criterionDiv.dataset.exclusiveWith = [].concat(criterion.exclusiveWith).join(',');
            }
            
            const label = document.createElement('div');
            label.className = 'criterion-label';
            label.textContent = criterion.description;
            
            const inputGroup = document.createElement('div');
            inputGroup.className = 'criterion-input';
            
            if (criterion.type === 'boolean') {
                // Yes/No ラジオボタン
                const radioGroup = document.createElement('div');
                radioGroup.className = 'radio-group';
                
                ['いいえ', 'はい'].forEach((option, optIndex) => {
                    const labelEl = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `mission-${index + 1}-criteria-${critIndex}`;
                    radio.value = optIndex === 0 ? '0' : criterion.points;
                    radio.dataset.points = optIndex === 0 ? '0' : criterion.points;
                    
                    // 依存関係がある場合、初期状態で無効化
                    if (criterion.dependsOn !== undefined) {
                        radio.disabled = true;
                    }
                    
                    labelEl.appendChild(radio);
                    labelEl.appendChild(document.createTextNode(option));
                    radioGroup.appendChild(labelEl);
                });
                
                inputGroup.appendChild(radioGroup);
            } else if (criterion.type === 'number') {
                // 数値入力
                const numberGroup = document.createElement('div');
                numberGroup.className = 'number-input-group';
                
                const labelEl = document.createElement('label');
                labelEl.textContent = '数:';
                
                const numberInput = document.createElement('input');
                numberInput.type = 'number';
                numberInput.className = 'number-input';
                numberInput.id = `mission-${index + 1}-criteria-${critIndex}`;
                numberInput.name = `mission-${index + 1}-criteria-${critIndex}`;
                numberInput.min = criterion.min || 0;
                numberInput.max = criterion.max || 10;
                numberInput.dataset.originalMax = criterion.max || 10; // 依存元の値で上限を絞った後の復元用
                numberInput.value = criterion.min || 0;
                numberInput.dataset.pointsPerUnit = criterion.pointsPerUnit || 1;
                numberInput.dataset.maxPoints = criterion.maxPoints || (criterion.max * (criterion.pointsPerUnit || 1));
                
                // 数値入力の制限を強制（オーバーフロー防止）
                numberInput.addEventListener('input', function(e) {
                    const min = parseInt(this.min) || 0;
                    const max = parseInt(this.max) || 10;
                    let value = parseInt(this.value) || 0;
                    
                    // 最小値・最大値の範囲内に制限
                    if (value < min) {
                        this.value = min;
                    } else if (value > max) {
                        this.value = max;
                    }
                });
                
                // 依存関係がある場合、初期状態で無効化
                if (criterion.dependsOn !== undefined) {
                    numberInput.disabled = true;
                }
                
                numberGroup.appendChild(labelEl);
                numberGroup.appendChild(numberInput);
                inputGroup.appendChild(numberGroup);
            }
            
            criterionDiv.appendChild(label);
            criterionDiv.appendChild(inputGroup);
            content.appendChild(criterionDiv);
        });
        
        section.appendChild(title);
        section.appendChild(content);
        
        // 右カラムの場合、固定セクションの前に挿入
        if (container === rightContainer) {
            const firstFixedSection = rightContainer.querySelector('.fixed-section, .score-result');
            if (firstFixedSection) {
                rightContainer.insertBefore(section, firstFixedSection);
            } else {
                rightContainer.appendChild(section);
            }
        } else {
            container.appendChild(section);
        }
        console.log(`ミッション${index + 1}を${container.id}に追加しました`);
    });
    
    console.log(`左カラムのミッション数: ${leftContainer.children.length}`);
    console.log(`右カラムのミッション数: ${rightContainer.children.length}`);
}

// 精密トークンセクションをレンダリング
function renderPrecisionTokens() {
    const container = document.getElementById('precision-content');
    const precision = rulesData.precisionTokens;
    
    const criterionDiv = document.createElement('div');
    criterionDiv.className = 'criterion';
    
    const label = document.createElement('div');
    label.className = 'criterion-label';
    label.textContent = precision.description;
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'criterion-input';
    
    const numberGroup = document.createElement('div');
    numberGroup.className = 'number-input-group';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = '数:';
    
    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.className = 'number-input';
    numberInput.id = 'precision-tokens-input';
    numberInput.min = precision.min || 0;
    numberInput.max = precision.max || 6;
    numberInput.value = precision.max || 6;
    numberInput.dataset.pointsPerUnit = precision.pointsPerUnit || 1;
    
    // 数値入力の制限を強制（オーバーフロー防止）
    numberInput.addEventListener('input', function(e) {
        const min = parseInt(this.min) || 0;
        const max = parseInt(this.max) || 6;
        let value = parseInt(this.value) || 0;
        
        // 最小値・最大値の範囲内に制限
        if (value < min) {
            this.value = min;
        } else if (value > max) {
            this.value = max;
        }
    });
    
    numberGroup.appendChild(labelEl);
    numberGroup.appendChild(numberInput);
    inputGroup.appendChild(numberGroup);
    
    criterionDiv.appendChild(label);
    criterionDiv.appendChild(inputGroup);
    container.appendChild(criterionDiv);
}

// Gracious Professionalismセクションをレンダリング
function renderGraciousProfessionalism() {
    const container = document.getElementById('gp-content');
    const gp = rulesData.graciousProfessionalism;
    
    const criterionDiv = document.createElement('div');
    criterionDiv.className = 'criterion';
    
    const label = document.createElement('div');
    label.className = 'criterion-label';
    label.textContent = gp.description;
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'criterion-input';
    
    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';
    
    gp.options.forEach((option) => {
        const labelEl = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'gracious-professionalism';
        radio.value = option.points;
        radio.dataset.points = option.points;
        
        labelEl.appendChild(radio);
        labelEl.appendChild(document.createTextNode(option.label));
        radioGroup.appendChild(labelEl);
    });
    
    inputGroup.appendChild(radioGroup);
    criterionDiv.appendChild(label);
    criterionDiv.appendChild(inputGroup);
    container.appendChild(criterionDiv);
}

// 入力変更時のハンドラー（依存関係チェックとスコア計算）
function handleInputChange(event) {
    // 依存関係をチェック
    checkDependencies(event.target);
    // スコアを再計算
    calculateTotalScore();
}

// 依存関係・排他関係を初期化
function initializeDependencies() {
    console.log('依存関係を初期化中...');
    // すべての依存関係・排他関係がある基準を確認
    const relatedCriteria = document.querySelectorAll('[data-mission-index]');
    console.log(`依存関係・排他関係がある基準: ${relatedCriteria.length}個`);

    // 初期状態を設定（変更時はhandleInputChange → checkDependenciesで更新される）
    relatedCriteria.forEach(criterionDiv => updateCriterionState(criterionDiv));

    console.log('依存関係の初期化完了');
}

// 指定した基準を獲得しているか（ラジオボタンは「はい」、数値入力は1以上）
function isCriterionEarned(missionIndex, criterionIndex) {
    const name = `mission-${missionIndex + 1}-criteria-${criterionIndex}`;
    const numberInput = document.querySelector(`input[type="number"][name="${name}"]`);
    if (numberInput) {
        return !numberInput.disabled && (parseInt(numberInput.value) || 0) > 0;
    }
    const radio = document.querySelector(`input[name="${name}"]:checked`);
    return !!radio && radio.value !== '0';
}

// 基準を更新（依存関係・排他関係による有効/無効化）
function updateCriterionState(criterionDiv) {
    const missionIndex = parseInt(criterionDiv.dataset.missionIndex);
    let isEnabled = true;
    let parentNumberValue = null; // 依存元が数値入力の場合、その値（依存先の数値入力の上限になる）

    // 依存関係：依存元が「はい」（数値入力の場合は1以上）でない場合は無効
    if (criterionDiv.dataset.dependsOn !== undefined) {
        const dependsOnRadioName = `mission-${missionIndex + 1}-criteria-${criterionDiv.dataset.dependsOn}`;
        const dependsOnNumberInput = document.querySelector(`input[type="number"][name="${dependsOnRadioName}"]`);
        let isParentYes;
        if (dependsOnNumberInput) {
            parentNumberValue = dependsOnNumberInput.disabled ? 0 : (parseInt(dependsOnNumberInput.value) || 0);
            isParentYes = parentNumberValue > 0;
        } else {
            const dependsOnRadio = document.querySelector(`input[name="${dependsOnRadioName}"]:checked`);
            isParentYes = dependsOnRadio && dependsOnRadio.value !== '0';
        }
        console.log(`依存関係チェック: ${dependsOnRadioName}, 親が「はい」: ${isParentYes}`);
        if (!isParentYes) isEnabled = false;
    }

    // 排他関係（OR条件）：指定した基準を獲得している場合は無効
    if (criterionDiv.dataset.exclusiveWith !== undefined) {
        criterionDiv.dataset.exclusiveWith.split(',').forEach(exclusiveIndex => {
            if (isCriterionEarned(missionIndex, parseInt(exclusiveIndex))) {
                console.log(`排他関係チェック: ミッション${missionIndex + 1}の基準${exclusiveIndex}を獲得済み`);
                isEnabled = false;
            }
        });
    }

    // 対象の入力要素を取得
    const inputs = criterionDiv.querySelectorAll('input');

    inputs.forEach(input => {
        if (isEnabled) {
            // 親が「はい」かつ排他の基準が未獲得の場合、有効化
            console.log(`有効化: ${input.name || input.id}`);
            input.disabled = false;
            criterionDiv.classList.remove('criterion-disabled');

            // 依存元が数値入力の場合、依存元で選択された数までしか選択できないようにする
            if (parentNumberValue !== null && input.type === 'number') {
                const originalMax = parseInt(input.dataset.originalMax) || 10;
                input.max = Math.min(originalMax, parentNumberValue);
                if ((parseInt(input.value) || 0) > parseInt(input.max)) {
                    input.value = input.max;
                }
            }
        } else {
            // 親が「いいえ」・未選択、または排他の基準を獲得済みの場合、無効化
            console.log(`無効化: ${input.name || input.id}`);
            input.disabled = true;
            criterionDiv.classList.add('criterion-disabled');
            
            // ラジオボタンの選択を解除
            if (input.type === 'radio' && input.checked) {
                input.checked = false;
            }
            // 数値入力をリセット
            if (input.type === 'number') {
                input.value = input.min || 0;
            }
        }
    });
}

// 依存関係をチェック（特定の入力要素が変更されたとき）
function checkDependencies(element) {
    if (!element || !element.name) return;
    
    // この入力要素に依存している基準を探す
    const missionMatch = element.name.match(/mission-(\d+)-criteria-(\d+)/);
    if (!missionMatch) return;
    
    const missionIndex = parseInt(missionMatch[1]) - 1;

    // 同じミッション内の依存関係・排他関係がある基準を更新
    const relatedCriteria = document.querySelectorAll(`[data-mission-index="${missionIndex}"]`);

    relatedCriteria.forEach(criterionDiv => {
        updateCriterionState(criterionDiv);
    });
}

// 合計スコアを計算
function calculateTotalScore() {
    let total = 0;
    
    // 装備の点検
    const equipmentRadio = document.querySelector('input[name="equipment-inspection"]:checked');
    if (equipmentRadio) {
        total += parseInt(equipmentRadio.dataset.points) || 0;
    }
    
    // ミッション
    rulesData.missions.forEach((mission, index) => {
        mission.criteria.forEach((criterion, critIndex) => {
            if (criterion.type === 'boolean') {
                const radio = document.querySelector(`input[name="mission-${index + 1}-criteria-${critIndex}"]:checked`);
                if (radio) {
                    total += parseInt(radio.dataset.points) || 0;
                }
            } else if (criterion.type === 'number') {
                const numberInput = document.getElementById(`mission-${index + 1}-criteria-${critIndex}`);
                if (numberInput) {
                    let value = parseInt(numberInput.value) || 0;
                    const min = parseInt(numberInput.min) || 0;
                    const max = parseInt(numberInput.max) || 10;
                    const pointsPerUnit = parseInt(numberInput.dataset.pointsPerUnit) || 1;
                    
                    // 念のため値を制限（オーバーフロー防止）
                    value = Math.max(min, Math.min(max, value));
                    
                    total += value * pointsPerUnit;
                }
            }
        });
    });
    
    // 精密トークン（変則的な採点方法）
    const precisionInput = document.getElementById('precision-tokens-input');
    if (precisionInput && rulesData && rulesData.precisionTokens) {
        let value = parseInt(precisionInput.value) || 0;
        const min = parseInt(precisionInput.min) || 0;
        const max = parseInt(precisionInput.max) || 6;
        
        // 念のため値を制限（オーバーフロー防止）
        value = Math.max(min, Math.min(max, value));
        
        // JSONからポイントテーブルを取得、なければデフォルト値を使用
        const pointsTable = rulesData.precisionTokens.pointsTable || {
            6: 50,
            5: 50,
            4: 35,
            3: 25,
            2: 15,
            1: 10,
            0: 0
        };
        // 文字列キーと数値キーの両方に対応
        total += pointsTable[value] || pointsTable[String(value)] || 0;
    }
    
    // Gracious Professionalismは採点に加算しない（表示のみ）
    
    // 合計スコアを表示
    document.getElementById('total-score').textContent = total;
}

// コンテンツを自動的にスケーリングしてA4サイズに収める（画面表示時は無効化）
function autoScaleContent() {
    const container = document.querySelector('.container');
    const mainContent = document.querySelector('.main-content');
    if (!container || !mainContent) {
        console.log('コンテナまたはメインコンテンツが見つかりません');
        return;
    }
    
    // 画面表示時は自動スケーリングを無効化（印刷時のみzoomで対応）
    console.log('✓ 画面表示: 自動スケーリングは無効（印刷時のみ適用）');
    container.style.transform = 'scale(1)';
    document.body.style.minHeight = '';
}

