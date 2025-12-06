// ホーム画面 - リスト/地図表示

let map = null;
let markers = [];
let currentView = 'list'; // 'list' or 'map'

document.addEventListener('DOMContentLoaded', () => {
    initializeHome();
    setupViewToggle();
});

// ホーム画面の初期化
function initializeHome() {
    displayQRList();
}

// ビュー切り替えの設定
function setupViewToggle() {
    const listViewBtn = document.getElementById('listViewBtn');
    const mapViewBtn = document.getElementById('mapViewBtn');

    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            switchView('list');
        });
    }

    if (mapViewBtn) {
        mapViewBtn.addEventListener('click', () => {
            switchView('map');
        });
    }
}

// ビューの切り替え
function switchView(view) {
    currentView = view;

    const listViewBtn = document.getElementById('listViewBtn');
    const mapViewBtn = document.getElementById('mapViewBtn');
    const qrList = document.getElementById('qrList');
    const mapContainer = document.getElementById('mapContainer');
    const emptyState = document.getElementById('emptyState');

    if (view === 'list') {
        // リスト表示
        listViewBtn.classList.add('active');
        mapViewBtn.classList.remove('active');

        if (qrList) qrList.style.display = 'grid';
        if (mapContainer) mapContainer.style.display = 'none';

        displayQRList();
    } else {
        // 地図表示
        listViewBtn.classList.remove('active');
        mapViewBtn.classList.add('active');

        if (qrList) qrList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (mapContainer) mapContainer.style.display = 'block';

        initMap();
    }
}

// 地図の初期化
function initMap() {
    const qrCodes = storage.getAllQRCodes();
    const qrCodesWithLocation = qrCodes.filter(qr => qr.location);

    // 位置情報付きのQRコードがない場合
    if (qrCodesWithLocation.length === 0) {
        const mapContainer = document.getElementById('mapContainer');
        mapContainer.innerHTML = `
            <div class="empty-state">
                <p>位置情報付きのQRコードがありません</p>
                <p>カメラでQRコードをスキャンすると、位置情報が自動的に記録されます</p>
            </div>
        `;
        return;
    }

    // 地図が既に初期化されている場合は再利用
    if (!map) {
        map = L.map('map');

        // OpenStreetMapタイルを追加
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
    }

    // 既存のマーカーをクリア
    markers.forEach(marker => marker.remove());
    markers = [];

    // マーカーを追加
    const bounds = [];
    qrCodesWithLocation.forEach(qr => {
        const { latitude, longitude } = qr.location;
        bounds.push([latitude, longitude]);

        // タイトルを取得（既存データ対応）
        let title = qr.title;
        if (!title) {
            if (isURL(qr.content)) {
                try {
                    const url = new URL(qr.content);
                    title = url.hostname;
                } catch {
                    title = qr.content.substring(0, 30);
                }
            } else {
                title = qr.content.substring(0, 30);
            }
            if (qr.content.length > 30) {
                title += '...';
            }
        }

        // マーカーを作成
        const marker = L.marker([latitude, longitude]).addTo(map);

        // ポップアップの内容
        const popupContent = `
            <div class="popup-content">
                <div class="popup-title">${escapeHtml(title)}</div>
                <div class="popup-date">📅 ${formatDate(qr.createdAt)}</div>
                <a href="detail.html?id=${qr.id}" class="popup-link">詳細を表示</a>
            </div>
        `;

        marker.bindPopup(popupContent);
        markers.push(marker);
    });

    // すべてのマーカーが表示されるように地図をフィット
    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }

    // 件数を更新
    const mapCount = document.getElementById('mapCount');
    if (mapCount) {
        mapCount.textContent = qrCodesWithLocation.length;
    }

    // 地図のサイズを再計算（レイアウト変更後に必要）
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
        }
    }, 100);
}
