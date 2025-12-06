// 設定画面

document.addEventListener('DOMContentLoaded', () => {
    // 設定を読み込んで表示
    loadSettings();

    // 統計情報を表示
    displayStats();

    // イベントハンドラーを設定
    setupEventHandlers();
});

// 設定の読み込みと表示
function loadSettings() {
    const settings = storage.settings;

    // 位置情報の設定
    const locationToggle = document.getElementById('locationToggle');
    if (locationToggle) {
        locationToggle.checked = settings.locationEnabled;

        locationToggle.addEventListener('change', (e) => {
            storage.settings.locationEnabled = e.target.checked;
            storage.saveSettings();
        });
    }

    // 表示件数の設定
    const itemsPerPage = document.getElementById('itemsPerPage');
    if (itemsPerPage) {
        itemsPerPage.value = settings.itemsPerPage;

        itemsPerPage.addEventListener('change', (e) => {
            storage.settings.itemsPerPage = parseInt(e.target.value);
            storage.saveSettings();
        });
    }
}

// 統計情報の表示
function displayStats() {
    const totalQRs = document.getElementById('totalQRs');
    const storageUsed = document.getElementById('storageUsed');

    if (totalQRs) {
        totalQRs.textContent = storage.getAllQRCodes().length;
    }

    if (storageUsed) {
        storageUsed.textContent = storage.getStorageSize();
    }
}

// イベントハンドラーの設定
function setupEventHandlers() {
    // エクスポートボタン
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            try {
                const jsonData = storage.exportData();
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `qrcode-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert('データをエクスポートしました');
            } catch (error) {
                console.error('エクスポートに失敗しました:', error);
                alert('エクスポートに失敗しました');
            }
        };
    }

    // インポートボタン
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');

    if (importBtn && importFile) {
        importBtn.onclick = () => {
            importFile.click();
        };

        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const success = storage.importData(event.target.result);

                    if (success) {
                        alert('データをインポートしました');
                        displayStats();
                        loadSettings();
                    } else {
                        alert('インポートに失敗しました。ファイルの形式を確認してください。');
                    }
                } catch (error) {
                    console.error('インポートに失敗しました:', error);
                    alert('インポートに失敗しました');
                }

                // ファイル選択をリセット
                importFile.value = '';
            };

            reader.onerror = () => {
                alert('ファイルの読み込みに失敗しました');
                importFile.value = '';
            };

            reader.readAsText(file);
        });
    }

    // 全削除ボタン
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.onclick = () => {
            const qrCount = storage.getAllQRCodes().length;

            if (qrCount === 0) {
                alert('削除するデータがありません');
                return;
            }

            const confirmMessage = `すべてのQRコードデータ（${qrCount}件）を削除しますか？\n\nこの操作は取り消せません。\n削除前にエクスポートすることをお勧めします。`;

            if (confirm(confirmMessage)) {
                if (confirm('本当に削除しますか？')) {
                    storage.clearAll();
                    alert('すべてのデータを削除しました');
                    displayStats();
                }
            }
        };
    }
}
