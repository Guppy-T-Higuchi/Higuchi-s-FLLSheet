// ルールデータを読み込む
let rulesData = null;

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
    document.getElementById('missions-left').innerHTML = '';
    // 右カラムのミッションのみをクリア（固定セクションは残す）
    const missionsRight = document.getElementById('missions-right');
    const missions = missionsRight.querySelectorAll('.mission-section:not(.fixed-section):not(.score-result)');
    missions.forEach(mission => mission.remove());
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
        
        // すべての入力にイベントリスナーを追加
        document.addEventListener('input', handleInputChange);
        document.addEventListener('change', handleInputChange);
        
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
    
    // ミッションを左右に分ける（左：1-8、右：9-15）
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
            
            // 依存関係がある場合は、データ属性を設定
            if (criterion.dependsOn !== undefined) {
                console.log(`依存関係を設定: ミッション${index + 1}の基準${critIndex}は基準${criterion.dependsOn}に依存`);
                criterionDiv.dataset.dependsOn = criterion.dependsOn;
                criterionDiv.dataset.missionIndex = index;
                criterionDiv.dataset.criterionIndex = critIndex;
                // 初期状態で無効化スタイルを追加
                criterionDiv.classList.add('criterion-disabled');
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
                numberInput.value = criterion.min || 0;
                numberInput.dataset.pointsPerUnit = criterion.pointsPerUnit || 1;
                numberInput.dataset.maxPoints = criterion.maxPoints || (criterion.max * (criterion.pointsPerUnit || 1));
                
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

// 依存関係を初期化
function initializeDependencies() {
    console.log('依存関係を初期化中...');
    // すべての依存関係がある基準を確認
    const dependentCriteria = document.querySelectorAll('[data-depends-on]');
    console.log(`依存関係がある基準: ${dependentCriteria.length}個`);
    
    dependentCriteria.forEach(criterionDiv => {
        const dependsOnIndex = parseInt(criterionDiv.dataset.dependsOn);
        const missionIndex = parseInt(criterionDiv.dataset.missionIndex);
        const criterionIndex = parseInt(criterionDiv.dataset.criterionIndex);
        
        console.log(`ミッション${missionIndex + 1}の基準${criterionIndex}は基準${dependsOnIndex}に依存`);
        
        // 依存元の基準を取得
        const dependsOnRadioName = `mission-${missionIndex + 1}-criteria-${dependsOnIndex}`;
        const dependsOnRadios = document.querySelectorAll(`input[name="${dependsOnRadioName}"]`);
        
        console.log(`依存元のラジオボタン（${dependsOnRadioName}）: ${dependsOnRadios.length}個`);
        
        if (dependsOnRadios.length === 0) {
            console.error(`依存元のラジオボタンが見つかりません: ${dependsOnRadioName}`);
            return;
        }
        
        // 依存元のラジオボタンが変更されたときに、依存先を有効/無効化
        dependsOnRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                console.log(`依存元が変更されました: ${dependsOnRadioName}`);
                updateDependentCriterion(criterionDiv, dependsOnRadioName);
            });
        });
        
        // 初期状態を設定
        updateDependentCriterion(criterionDiv, dependsOnRadioName);
    });
    
    console.log('依存関係の初期化完了');
}

// 依存先の基準を更新（有効/無効化）
function updateDependentCriterion(criterionDiv, dependsOnRadioName) {
    const dependsOnRadio = document.querySelector(`input[name="${dependsOnRadioName}"]:checked`);
    const isParentYes = dependsOnRadio && dependsOnRadio.value !== '0';
    
    console.log(`依存関係チェック: ${dependsOnRadioName}, 親が「はい」: ${isParentYes}`);
    
    // 依存先の入力要素を取得
    const inputs = criterionDiv.querySelectorAll('input');
    
    console.log(`依存先の入力要素数: ${inputs.length}`);
    
    inputs.forEach(input => {
        if (isParentYes) {
            // 親が「はい」の場合、有効化
            console.log(`有効化: ${input.name || input.id}`);
            input.disabled = false;
            criterionDiv.classList.remove('criterion-disabled');
        } else {
            // 親が「いいえ」または未選択の場合、無効化
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
    const criterionIndex = parseInt(missionMatch[2]);
    
    // この基準に依存している基準を探す
    const dependentCriteria = document.querySelectorAll(`[data-mission-index="${missionIndex}"][data-depends-on="${criterionIndex}"]`);
    
    dependentCriteria.forEach(criterionDiv => {
        updateDependentCriterion(criterionDiv, element.name);
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
                    const value = parseInt(numberInput.value) || 0;
                    const pointsPerUnit = parseInt(numberInput.dataset.pointsPerUnit) || 1;
                    total += value * pointsPerUnit;
                }
            }
        });
    });
    
    // 精密トークン（変則的な採点方法）
    const precisionInput = document.getElementById('precision-tokens-input');
    if (precisionInput && rulesData && rulesData.precisionTokens) {
        const value = parseInt(precisionInput.value) || 0;
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

// コンテンツを自動的にスケーリングしてA4サイズに収める
function autoScaleContent() {
    const container = document.querySelector('.container');
    const mainContent = document.querySelector('.main-content');
    if (!container || !mainContent) {
        console.log('コンテナまたはメインコンテンツが見つかりません');
        return;
    }
    
    // 少し遅延させて正確なサイズを取得
    setTimeout(() => {
        // スケールをリセットして実際のサイズを測定
        container.style.transform = 'scale(1)';
        
        // 測定のためにさらに少し待つ
        setTimeout(() => {
            // A4横向きのサイズ
            const targetHeight = 794; // 210mm at 96dpi
            const targetWidth = 1123; // 297mm at 96dpi
            
            // 実際のコンテンツサイズを取得（パディング含む）
            const actualHeight = container.scrollHeight;
            const actualWidth = container.scrollWidth;
            
            console.log(`実際のサイズ: ${actualWidth}px × ${actualHeight}px`);
            console.log(`目標サイズ: ${targetWidth}px × ${targetHeight}px`);
            
            // スケール計算（余白を考慮して0.98倍）
            let scaleY = 1;
            let scaleX = 1;
            
            if (actualHeight > targetHeight) {
                scaleY = (targetHeight / actualHeight) * 0.98;
                console.log(`縦方向のスケール: ${(scaleY * 100).toFixed(1)}%`);
            }
            
            if (actualWidth > targetWidth) {
                scaleX = (targetWidth / actualWidth) * 0.98;
                console.log(`横方向のスケール: ${(scaleX * 100).toFixed(1)}%`);
            }
            
            // 小さい方のスケールを採用（縦横比を維持）
            const scale = Math.min(scaleY, scaleX);
            
            if (scale < 1) {
                container.style.transformOrigin = 'top left';
                container.style.transform = `scale(${scale})`;
                // bodyの高さを調整してスクロールバーを防ぐ
                document.body.style.minHeight = `${actualHeight * scale + 40}px`;
                console.log(`✓ 自動スケーリング適用: ${(scale * 100).toFixed(1)}%`);
            } else {
                container.style.transform = 'scale(1)';
                document.body.style.minHeight = '';
                console.log('✓ 自動スケーリング不要: コンテンツはA4サイズ内に収まっています');
            }
        }, 50);
    }, 100);
}

