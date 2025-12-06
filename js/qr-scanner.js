// QRコードスキャナー

let videoStream = null;
let scanningActive = false;
let currentLocation = null;

// カメラの初期化
async function initCamera() {
    const video = document.getElementById('video');
    const scanStatus = document.getElementById('scanStatus');

    try {
        // カメラへのアクセスを要求
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment' // 背面カメラを優先
            }
        });

        video.srcObject = videoStream;
        scanStatus.textContent = 'QRコードをスキャンしてください';

        // スキャン開始
        scanningActive = true;
        requestAnimationFrame(scanQRCode);

        // 位置情報の取得を試みる
        if (storage.settings.locationEnabled) {
            getLocationForScan();
        }

    } catch (error) {
        console.error('カメラの起動に失敗しました:', error);
        scanStatus.textContent = 'カメラへのアクセスが拒否されました';

        if (error.name === 'NotAllowedError') {
            scanStatus.textContent = 'カメラの使用が許可されていません。ブラウザの設定を確認してください。';
        } else if (error.name === 'NotFoundError') {
            scanStatus.textContent = 'カメラが見つかりませんでした';
        } else {
            scanStatus.textContent = `エラー: ${error.message}`;
        }
    }
}

// 位置情報の取得
async function getLocationForScan() {
    const locationStatus = document.getElementById('locationStatus');

    try {
        locationStatus.textContent = '位置情報を取得中...';
        currentLocation = await getLocation();
        locationStatus.textContent = `📍 位置情報取得完了`;
    } catch (error) {
        console.error('位置情報の取得に失敗しました:', error);
        locationStatus.textContent = '位置情報の取得に失敗しました';
        currentLocation = null;
    }
}

// QRコードのスキャン
function scanQRCode() {
    if (!scanningActive) return;

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const scanStatus = document.getElementById('scanStatus');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // キャンバスのサイズを動画に合わせる
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // jsQRを使用してQRコードを検出
        if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                // QRコードが検出された
                scanningActive = false;
                onQRCodeDetected(code.data);
                return;
            }
        }
    }

    // 次のフレームをスキャン
    requestAnimationFrame(scanQRCode);
}

// QRコード検出時の処理
function onQRCodeDetected(qrData) {
    const scanStatus = document.getElementById('scanStatus');
    const scanResult = document.getElementById('scanResult');
    const resultText = document.getElementById('resultText');

    scanStatus.textContent = 'QRコードを検出しました！';
    resultText.textContent = qrData;
    scanResult.style.display = 'block';

    // カメラを停止
    stopCamera();

    // 保存ボタンのイベント
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.onclick = () => {
        const saved = storage.addQRCode(qrData, currentLocation);
        if (saved) {
            alert('QRコードを保存しました');
            window.location.href = `detail.html?id=${saved.id}`;
        } else {
            alert('保存に失敗しました');
        }
    };

    // 再スキャンボタンのイベント
    const rescanBtn = document.getElementById('rescanBtn');
    rescanBtn.onclick = () => {
        scanResult.style.display = 'none';
        resultText.textContent = '';
        currentLocation = null;
        initCamera();
    };
}

// カメラの停止
function stopCamera() {
    scanningActive = false;

    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    const video = document.getElementById('video');
    if (video) {
        video.srcObject = null;
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('video')) {
        initCamera();
    }
});

// ページ離脱時にカメラを停止
window.addEventListener('beforeunload', () => {
    stopCamera();
});

// ページが非表示になったときにカメラを停止
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopCamera();
    } else if (document.getElementById('video') && !videoStream) {
        // ページが再び表示されたらカメラを再起動
        initCamera();
    }
});
