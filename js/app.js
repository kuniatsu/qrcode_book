// QRコードブックマーク - メインアプリケーション

// LocalStorage キー
const STORAGE_KEY = 'qrcode_bookmarks';
const SETTINGS_KEY = 'qrcode_settings';

// デフォルト設定
const DEFAULT_SETTINGS = {
    locationEnabled: true,
    itemsPerPage: 20
};

// データ管理クラス
class QRCodeStorage {
    constructor() {
        this.data = this.loadData();
        this.settings = this.loadSettings();
    }

    // データの読み込み
    loadData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            return [];
        }
    }

    // データの保存
    saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
            return false;
        }
    }

    // 設定の読み込み
    loadSettings() {
        try {
            const settings = localStorage.getItem(SETTINGS_KEY);
            return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
        } catch (error) {
            console.error('設定の読み込みに失敗しました:', error);
            return DEFAULT_SETTINGS;
        }
    }

    // 設定の保存
    saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('設定の保存に失敗しました:', error);
            return false;
        }
    }

    // QRコードを追加
    addQRCode(content, location = null) {
        const qrCode = {
            id: Date.now().toString(),
            content: content,
            createdAt: new Date().toISOString(),
            location: location,
            memo: ''
        };

        this.data.unshift(qrCode); // 新しいものを先頭に追加
        this.saveData();
        return qrCode;
    }

    // QRコードを取得
    getQRCode(id) {
        return this.data.find(item => item.id === id);
    }

    // すべてのQRコードを取得
    getAllQRCodes() {
        return this.data;
    }

    // QRコードを更新
    updateQRCode(id, updates) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates };
            this.saveData();
            return true;
        }
        return false;
    }

    // QRコードを削除
    deleteQRCode(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // すべてのデータを削除
    clearAll() {
        this.data = [];
        this.saveData();
    }

    // データをエクスポート
    exportData() {
        return JSON.stringify({
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            data: this.data,
            settings: this.settings
        }, null, 2);
    }

    // データをインポート
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (imported.data && Array.isArray(imported.data)) {
                this.data = imported.data;
                if (imported.settings) {
                    this.settings = { ...DEFAULT_SETTINGS, ...imported.settings };
                    this.saveSettings();
                }
                this.saveData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('インポートに失敗しました:', error);
            return false;
        }
    }

    // ストレージ使用量を取得（KB単位）
    getStorageSize() {
        const data = localStorage.getItem(STORAGE_KEY) || '';
        const settings = localStorage.getItem(SETTINGS_KEY) || '';
        return ((data.length + settings.length) * 2 / 1024).toFixed(2);
    }
}

// グローバルインスタンス
const storage = new QRCodeStorage();

// ユーティリティ関数

// 日付のフォーマット
function formatDate(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// URLかどうかを判定
function isURL(text) {
    try {
        new URL(text);
        return true;
    } catch {
        return text.startsWith('http://') || text.startsWith('https://');
    }
}

// 位置情報を取得
function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('位置情報がサポートされていません'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// QRコードリストの表示（ホーム画面用）
function displayQRList() {
    const listContainer = document.getElementById('qrList');
    const emptyState = document.getElementById('emptyState');
    const qrCodes = storage.getAllQRCodes();

    if (qrCodes.length === 0) {
        if (listContainer) listContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (listContainer) listContainer.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    if (listContainer) {
        listContainer.innerHTML = qrCodes.map(qr => {
            const preview = qr.content.length > 50
                ? qr.content.substring(0, 50) + '...'
                : qr.content;

            const locationText = qr.location
                ? `📍 ${qr.location.latitude.toFixed(6)}, ${qr.location.longitude.toFixed(6)}`
                : '位置情報なし';

            return `
                <a href="detail.html?id=${qr.id}" class="qr-item">
                    <div class="qr-thumbnail">
                        <div id="qr-thumb-${qr.id}"></div>
                    </div>
                    <div class="qr-info">
                        <div class="qr-content">${escapeHtml(preview)}</div>
                        <div class="qr-meta">
                            <span>📅 ${formatDate(qr.createdAt)}</span>
                            <span>${locationText}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        // QRコードのサムネイルを生成
        qrCodes.forEach(qr => {
            const thumbElement = document.getElementById(`qr-thumb-${qr.id}`);
            if (thumbElement && typeof QRCode !== 'undefined') {
                new QRCode(thumbElement, {
                    text: qr.content,
                    width: 80,
                    height: 80,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            }
        });
    }
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// クリップボードにコピー
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    } else {
        // フォールバック
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success ? Promise.resolve() : Promise.reject();
    }
}
