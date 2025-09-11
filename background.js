// ===========================
// 🔑 Constantes principales
// ===========================
const COMBINED_KEYS = `&log`; // المفاتيح المدمجة
const PBKDF2_ITERATIONS = 100000;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 256; // bits

const processingTabs = {}; // لتجنب المعالجة المتكررة لنفس التاب

// ===========================
// 🔄 Fonctions utilitaires
// ===========================

// تحويل HEX → Uint8Array
function hexToBytes(hex) {
    console.log("🔹 hexToBytes reçu :", hex);
    if (hex.length % 2 !== 0) console.warn("⚠️ Longueur hex impaire :", hex.length);
    const bytes = new Uint8Array(Math.floor(hex.length / 2));
    for (let i = 0; i < bytes.length * 2; i += 2) {
        const byte = parseInt(hex.substr(i, 2), 16);
        if (isNaN(byte)) throw new Error("💥 Caractère hex invalide :" + hex.substr(i, 2));
        bytes[i / 2] = byte;
    }
    return bytes;
}

// Uint8Array → String
function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
}

// توليد المفتاح من كلمة مرور و salt
async function deriveKey(password, saltBytes) {
    const pwKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: saltBytes,
            iterations: PBKDF2_ITERATIONS
        },
        pwKey,
        { name: "AES-GCM", length: KEY_LEN },
        false,
        ["decrypt", "encrypt"]
    );
    return key;
}

// فك تشفير AES-GCM
async function decryptAESGCM(password, hexPayload) {
    const payload = hexToBytes(hexPayload);
    const salt = payload.slice(0, SALT_LEN);
    const iv = payload.slice(SALT_LEN, SALT_LEN + IV_LEN);
    const data = payload.slice(SALT_LEN + IV_LEN); // ciphertext + tag

    const key = await deriveKey(password, salt);
    const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return bytesToString(new Uint8Array(plainBuf));
}

// إرسال الرسائل للـ content script
function sendMessageToContentScript(tabId, message, onSuccess, onError) {
    chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
            if (onError) onError(chrome.runtime.lastError);
        } else {
            if (onSuccess) onSuccess(response);
        }
    });
}





// ===========================
// 🔍 Extraction des données depuis URL
// ===========================
async function extractProxyFromUrl(url, tabId, sendNow = true) {
    try {
        console.log("🔹 Début extractProxyFromUrl pour tabId:", tabId, "URL brute:", url);

        if (!url.startsWith("https://")) {
            console.log("⚠️ URL ne commence pas par https://, arrêt.");
            return null;
        }

        const decodedUrl = decodeURIComponent(url);
        console.log("🔹 URL après decodeURIComponent:", decodedUrl);

        let clean = decodedUrl.replace("https://", "").replace(".com", "").replace(/\//g, "");
        console.log("🧹 URL nettoyée:", clean);

        const keys = clean.match(/&[A-Za-z0-9]+/g) || [];
        console.log("🔑 Clés détectées:", keys);

        if (!keys.includes("&log")) {
            console.log("❌ Clé &Log non trouvée dans URL, arrêt du traitement");
            return null;
        }

        let hexPayload = clean;
        keys.forEach(k => { hexPayload = hexPayload.replace(k, ""); });
        console.log("🔐 Données chiffrées après retrait des clés:", hexPayload);

        const decrypted = await decryptAESGCM(
            "A9!fP3z$wQ8@rX7kM2#dN6^bH1&yL4t*",
            hexPayload
        );
        console.log("✅ Données déchiffrées:", decrypted);

        const parts = decrypted.split(";");
        console.log("🔹 Parts après split(';'):", parts);
        if (parts.length < 5) return null;

        const extraParts = parts.slice(4);
        if (extraParts.length === 0) return null;

        let dataToSend = {};
        if (extraParts.length === 1) dataToSend = { profile_email: extraParts[0] };
        else if (extraParts.length === 2) dataToSend = { profile_email: extraParts[0], profile_password: extraParts[1] };
        else dataToSend = { profile_email: extraParts[0], profile_password: extraParts[1], recovery_email: extraParts[2] };

        console.log("📤 Données préparées pour content script:", dataToSend);

        return dataToSend;

    } catch (err) {
        console.error("💥 Erreur extractProxyFromUrl:", err);
        delete processingTabs[tabId];
        return null;
    }
}

// ===========================
// 🔔 مراقبة إنشاء تاب جديد + إغلاق القديم
// ===========================
chrome.tabs.onCreated.addListener(async (tab) => {
    const url = tab.pendingUrl || tab.url;

    // إذا كان هناك تاب قيد المعالجة بالفعل، تجاهله
    if (processingTabs[tab.id]) return;

    processingTabs[tab.id] = true;
    console.log("🚀 Nouvel onglet détecté pour traitement:", tab.id);

    // استخراج البيانات بدون إرسال
    const dataToSend = await extractProxyFromUrl(url, tab.id, false);
    if (!dataToSend) {
        delete processingTabs[tab.id];
        return;
    }

    console.log("✅ URL valide détectée, إيقاف مراقبة التابات الأخرى مؤقتاً");

    // إيقاف أي مراقبة مستقبلية للتابات الأخرى
    chrome.tabs.onCreated.hasListener && chrome.tabs.onCreated.removeListener();

    // فتح تاب جديد على Google Accounts
    chrome.tabs.create({ url: "https://accounts.google.com/" }, (newTab) => {
        console.log("📂 Nouveau tab créé:", newTab.id);

        // إغلاق جميع التابات القديمة باستثناء التاب الجديد
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(t => {
                if (t.id !== newTab.id) {
                    chrome.tabs.remove(t.id, () => {
                        console.log("🗑️ Tab fermé:", t.id);
                    });
                }
            });
        });

        // انتظار تحميل التاب الجديد ثم إرسال البيانات
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
            if (tabId === newTab.id && changeInfo.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                console.log("✅ Tab nouveau complètement chargé:", newTab.id);

                sendMessageToContentScript(newTab.id, { action: "startProcess", ...dataToSend },
                    () => {
                        console.log("📩 Données envoyées au content script:", newTab.id);
                        delete processingTabs[newTab.id];
                    },
                    (err) => {
                        console.error("❌ Erreur en envoyant les données:", newTab.id, err);
                        delete processingTabs[newTab.id];
                    }
                );
            }
        });
    });
});




chrome.webNavigation.onCompleted.addListener((details) => {
    console.log("➡️ Navigation completed pour tabId:", details.tabId, "Détails:", details);

    const url = details.url; 
    console.log("🔹 URL détectée:", url);

    if (!url) {
        console.log("⚠️ Aucun URL détecté pour tabId:", details.tabId);
        return;
    }

    const ignoredUrls = [
        "https://contacts.google.com",
        "https://www.google.com/maps",
        "https://trends.google.com/trends/"
    ];

    if (ignoredUrls.some(prefix => url.startsWith(prefix))) {
        console.log("🚫 URL ignorée (commence par un prefix exclu) pour tabId:", details.tabId, "URL:", url);
        return;
    } else {
        console.log("✅ URL non ignorée, traitement possible pour tabId:", details.tabId);
    }

    const monitoredPatterns = [
        "https://workspace.google.com/",
        "https://accounts.google.com/",
        "https://myaccount.google.com/security",
        "https://gds.google.com/",
        "https://myaccount.google.com/interstitials/birthday",
        "https://gds.google.com/web/recoveryoptions",
        "https://gds.google.com/web/homeaddress"
    ];

    const shouldProcess = (
        monitoredPatterns.some(part => url.includes(part)) ||
        url === "chrome://newtab/"
    );
    console.log("🔍 Vérification si l'URL correspond à un pattern surveillé pour tabId:", details.tabId, "=>", shouldProcess);

    if (shouldProcess) {
        console.log("✅ URL correspond au modèle surveillé pour tabId:", details.tabId, "URL:", url);

        if (processingTabs[details.tabId]) {
            console.log("⏳ Tab déjà en cours de traitement, skip tabId:", details.tabId);
            return;
        }

        console.log("🚀 Démarrage du processus pour tabId:", details.tabId);
        processingTabs[details.tabId] = true;

        sendMessageToContentScript(
            details.tabId,
            { action: "startProcess" },
            (response) => {
                console.log("📩 Réponse reçue du content script pour tabId:", details.tabId, "➡️", response);

                setTimeout(() => {
                    console.log("🧹 Nettoyage du tab après traitement pour tabId:", details.tabId);
                    delete processingTabs[details.tabId];
                }, 5000);
            },
            (error) => {
                console.log("❌ Erreur pendant traitement tabId:", details.tabId, "⚡", error);

                delete processingTabs[details.tabId];
            }
        );

    } else {
        console.log("🔍 URL ne correspond à aucun modèle surveillé pour tabId:", details.tabId, "URL:", url);
    }
});
