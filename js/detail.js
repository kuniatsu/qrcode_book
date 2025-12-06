// QRコード詳細画面

document.addEventListener('DOMContentLoaded', () => {
    // URLパラメータからIDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const qrId = urlParams.get('id');

    if (!qrId) {
        alert('QRコードが見つかりません');
        window.location.href = 'index.html';
        return;
    }

    // QRコードデータを取得
    const qrCode = storage.getQRCode(qrId);

    if (!qrCode) {
        alert('QRコードが見つかりません');
        window.location.href = 'index.html';
        return;
    }

    // QRコードを表示
    displayQRCode(qrCode);

    // イベントハンドラーを設定
    setupEventHandlers(qrCode);
});

// QRコードの表示
function displayQRCode(qrCode) {
    // QRコード画像を生成
    const qrDisplay = document.getElementById('qrDisplay');
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrDisplay, {
            text: qrCode.content,
            width: 300,
            height: 300,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // タイトルを表示
    const titleText = document.getElementById('titleText');
    if (qrCode.title) {
        titleText.value = qrCode.title;
    } else {
        // 既存データでタイトルがない場合は自動生成
        let autoTitle = qrCode.content;
        if (isURL(qrCode.content)) {
            try {
                const url = new URL(qrCode.content);
                autoTitle = url.hostname;
            } catch {
                autoTitle = qrCode.content.substring(0, 30);
            }
        } else {
            autoTitle = qrCode.content.substring(0, 30);
        }
        if (qrCode.content.length > 30) {
            autoTitle += '...';
        }
        titleText.value = autoTitle;
    }

    // 内容を表示
    const contentText = document.getElementById('contentText');
    contentText.textContent = qrCode.content;

    // URLの場合は「開く」ボタンを表示
    const openBtn = document.getElementById('openBtn');
    if (isURL(qrCode.content)) {
        openBtn.style.display = 'inline-block';
        openBtn.onclick = () => {
            window.open(qrCode.content, '_blank');
        };
    }

    // 登録日時を表示
    const createdAt = document.getElementById('createdAt');
    createdAt.textContent = formatDate(qrCode.createdAt);

    // 位置情報を表示
    const locationInfo = document.getElementById('locationInfo');
    const mapContainer = document.getElementById('mapContainer');

    if (qrCode.location) {
        const { latitude, longitude, accuracy } = qrCode.location;
        locationInfo.textContent = `緯度: ${latitude.toFixed(6)}, 経度: ${longitude.toFixed(6)}`;

        if (accuracy) {
            locationInfo.textContent += ` (精度: ${Math.round(accuracy)}m)`;
        }

        // Google Mapsリンクを設定
        const mapLink = document.getElementById('mapLink');
        mapLink.href = `https://www.google.com/maps?q=${latitude},${longitude}`;
        mapContainer.style.display = 'block';
    } else {
        locationInfo.textContent = '位置情報なし';
    }

    // メモを表示
    const memoText = document.getElementById('memoText');
    if (qrCode.memo) {
        memoText.value = qrCode.memo;
    }
}

// イベントハンドラーの設定
function setupEventHandlers(qrCode) {
    // タイトル保存ボタン
    const saveTitleBtn = document.getElementById('saveTitleBtn');
    const titleText = document.getElementById('titleText');

    saveTitleBtn.onclick = () => {
        const title = titleText.value.trim();
        if (!title) {
            alert('タイトルを入力してください');
            return;
        }

        const updated = storage.updateQRCode(qrCode.id, { title });

        if (updated) {
            const originalText = saveTitleBtn.textContent;
            saveTitleBtn.textContent = '保存しました!';
            saveTitleBtn.style.background = 'var(--success-color)';

            setTimeout(() => {
                saveTitleBtn.textContent = originalText;
                saveTitleBtn.style.background = '';
            }, 2000);
        } else {
            alert('タイトルの保存に失敗しました');
        }
    };

    // コピーボタン
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.onclick = () => {
        copyToClipboard(qrCode.content)
            .then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'コピーしました!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            })
            .catch((error) => {
                console.error('コピーに失敗しました:', error);
                alert('コピーに失敗しました');
            });
    };

    // メモ保存ボタン
    const saveMemoBtn = document.getElementById('saveMemoBtn');
    const memoText = document.getElementById('memoText');

    saveMemoBtn.onclick = () => {
        const memo = memoText.value.trim();
        const updated = storage.updateQRCode(qrCode.id, { memo });

        if (updated) {
            const originalText = saveMemoBtn.textContent;
            saveMemoBtn.textContent = '保存しました!';
            saveMemoBtn.style.background = 'var(--success-color)';

            setTimeout(() => {
                saveMemoBtn.textContent = originalText;
                saveMemoBtn.style.background = '';
            }, 2000);
        } else {
            alert('メモの保存に失敗しました');
        }
    };

    // 削除ボタン
    const deleteBtn = document.getElementById('deleteBtn');
    deleteBtn.onclick = () => {
        if (confirm('このQRコードを削除しますか？\nこの操作は取り消せません。')) {
            const deleted = storage.deleteQRCode(qrCode.id);

            if (deleted) {
                alert('削除しました');
                window.location.href = 'index.html';
            } else {
                alert('削除に失敗しました');
            }
        }
    };
}
