const redirectUrls = [
    "https://myaccount.google.com/interstitials/birthday",
    "https://gds.google.com/web/recoveryoptions",
    "https://gds.google.com/web/homeaddress"
];



const createPopup = async (message) => {
  try {
    await sleep(4000);

    if (redirectUrls.includes(window.location.href)) {
      console.log("🔄 Page dans redirectUrls, redirection vers Gmail Inbox");
      window.location.href = "https://mail.google.com/mail/u/0/#inbox";
      return;
    }

    console.log("🚀 Démarrage du processus ...");

    // 🟪 Récupération des données de démarrage
    let processData;
    if (message && Object.keys(message).length > 0) {
      processData = message;
      console.groupCollapsed("%c📨 Données reçues avec startProcess", "color: blue; font-weight: bold;");
      console.log(JSON.stringify(processData, null, 2));
      console.groupEnd();
    } else {
      processData = await new Promise(resolve => {
        chrome.storage.local.get("startProcessData", res => resolve(res.startProcessData || {}));
      });
      console.groupCollapsed("%c📨 Données récupérées depuis chrome.storage.local", "color: purple; font-weight: bold;");
      console.log(JSON.stringify(processData, null, 2));
      console.groupEnd();
    }

    // 🟪 Actions déjà complétées
    const completedActions = await new Promise(resolve => {
      chrome.storage.local.get("completedActions", res => resolve(res.completedActions || {}));
    });

    // 🟪 Charger le scénario depuis JSON
    const scenario = await fetch(chrome.runtime.getURL("traitement.json"))
      .then(resp => resp.json())
      .then(data => {
        console.groupCollapsed("%c📦 Contenu de traitement.json", "color: teal; font-weight: bold;");
        console.log(JSON.stringify(data, null, 2));
        console.groupEnd();
        return data;
      })
      .catch(error => {
        console.error("%c❌ Erreur chargement traitement.json :", "color: red;", error);
        return [];
      });

    // 🟪 Charger et parser gmail_process.js
    const ispProcess = gmail_process || {};



    // 🟦 عرض المحتوى brut
    console.groupCollapsed("%c📂 Contenu brut de ispProcess", "color: orange; font-weight: bold;");
    console.log(ispProcess);
    console.log(JSON.stringify(ispProcess, null, 2));
    console.groupEnd();

    // 🔹 قبل الاستبدال
    console.groupCollapsed("%c🔹 ispProcess.login avant remplacement", "color: orange; font-weight: bold;");
    console.log(ispProcess.login);
    console.log(JSON.stringify(ispProcess.login, null, 2));
    console.groupEnd();

    // 🟪 Fonction de remplacement مع logs détaillés
    const replacePlaceholders = (obj) => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach(replacePlaceholders);
      } else if (typeof obj === "object") {
        for (let key in obj) {
          if (typeof obj[key] === "string") {
            if (obj[key] === "__email__") {
              console.log(`✏️ Remplacement clé [${key}] : __email__ ➝ ${processData.profile_email || "(vide)"}`);
              obj[key] = processData.profile_email || obj[key];
            }
            if (obj[key] === "__password__") {
              console.log(`✏️ Remplacement clé [${key}] : __password__ ➝ ${processData.profile_password || "(vide)"}`);
              obj[key] = processData.profile_password || obj[key];
            }
            if (obj[key] === "__recovry__") {
              console.log(`✏️ Remplacement clé [${key}] : __recovry__ ➝ ${processData.recovery_email || "(vide)"}`);
              obj[key] = processData.recovery_email || obj[key];
            }
          } else if (typeof obj[key] === "object") {
            replacePlaceholders(obj[key]);
          }
        }
      }
    };

    replacePlaceholders(ispProcess.login);

    // 🔹 بعد الاستبدال
    console.groupCollapsed("%c🔹 ispProcess.login après remplacement", "color: green; font-weight: bold;");
    console.log(ispProcess.login);
    console.log(JSON.stringify(ispProcess.login, null, 2));
    console.groupEnd();

    // 🟪 Exécuter scénario
    await ReportingProcess(scenario, ispProcess);

    // clearChromeStorageLocal();

    console.log("%c✅ Processus terminé avec succès.", "color: green; font-weight: bold;");

  } catch (error) {
    console.error("%c❌ Erreur lors de la création de la popup :", "color: red;", error);
  }
};





function clearChromeStorageLocal() {
    chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
            console.log("❌ Erreur lors de la suppression des données de chrome.storage.local :", chrome.runtime.lastError);
        } 
    });
}












async function waitForElement(xpath, timeout = 30) {
    const maxWait = timeout * 1000; 
    const interval = 1000; 
    let elapsed = 0;

    console.log(`⌛ Début de l'attente de l'élément avec XPath: ${xpath} (Max: ${timeout} secondes)`);

    try {
        while (elapsed < maxWait) {
            const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (element) {
                console.log(`✅ Élément trouvé: ${xpath}`);
                return true;
            }
            await sleep(interval);
            elapsed += interval;
        }
    } catch (error) {
        console.log(`❌ Erreur lors de la recherche de l'élément: ${error.message}`);
        return false;
    }

    console.log(`❌ Temps écoulé. Élément non trouvé après ${timeout} secondes.`);
    return false;
}





async function findElementByXPath(xpath, timeout = 10, obligatoire = false, type = undefined) {
    const maxWait = timeout * 1000;
    const interval = 500;
    let elapsed = 0;
    let secondsPassed = 0;

    console.log(`🔍 Recherche de l'élément avec XPath: ${xpath}... (Max: ${timeout} secondes)`);

    try {
        while (elapsed < maxWait) {
            const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (element) {
                console.log(`✅ Élément trouvé avec XPath: ${xpath}`);
                return element;
            }

            await sleep(interval);
            elapsed += interval;

            if (elapsed >= secondsPassed * 1000) {
                secondsPassed++;
                console.log(`⏳ Recherche... ${secondsPassed} seconde(s) écoulée(s)`);
            }
        }
    } catch (error) {
        console.log(`❌ Erreur lors de la recherche de l'élément: ${error.message}`);
        return null;
    }

    if (obligatoire) {
        console.log(`❗ L'élément obligatoire n'a pas été trouvé après ${timeout} secondes. XPath: ${xpath}`);
    } else {
        console.log(`❌ Élément non trouvé après ${timeout} secondes. XPath: ${xpath}`);
    }

    return null;
}









async function ReportingProcess(scenario, ispProcess) {
    console.log("📝 [ENTRÉE] Démarrage du processus avec les données suivantes :");

    console.log("📚 [SCÉNARIO] Structure du scénario :");
    console.log(JSON.stringify(scenario, null, 2));

    console.log("📦 [ISP PROCESS] Structure du process ISP :");
    console.log(JSON.stringify(ispProcess, null, 2));
    console.log("------------------------------------------------------------");

    let messagesProcessed = 0;
    console.log("🚀 Début du processus de reporting...");

    for (const process of scenario) {
        try {
            console.log(`🚨 Traitement du processus : '${process.process}'`);

            const currentURL = window.location.href;
            console.log(`🌐 [URL] URL actuelle : ${currentURL}`);

            // ✅ Condition : si ce n’est pas "login", arrêter complètement
            if (process.process !== "login") {
                console.log("⛔ Processus interrompu : la tâche n'est pas 'login'.");
                return; // arrêt complet
            }

            // ✅ Ignorer si c'est une page de login déjà détectée
            if (
                (
                    currentURL.includes("https://mail.google.com/mail") ||
                    currentURL.includes("https://myaccount.google.com/?pli=") ||
                    currentURL.startsWith("https://myaccount.google.com/")
                ) &&
                process.process === "login"
            ) {
                console.log("🔐 Page de login détectée. Processus ignoré.");
                continue;
            }

            // ✅ Exécution des actions
            console.log(`▶️ Exécution de l'action '${process.process}'...`);
            const result = await ReportingActions(ispProcess[process.process], process.process);

            // ✅ Si ReportingActions demande un arrêt complet
            if (result === "STOP_PROCESS") {
                console.log("🛑 Arrêt complet du processus demandé depuis ReportingActions.");
                return;
            }

        } catch (error) {
            console.log(`❌ [ERREUR] Processus '${process.process}' :`, error);
            return; // arrêter en cas d'erreur critique
        }
    }

    console.log(`🏁 Fin du processus de reporting. Total d’emails traités : ${messagesProcessed}`);
}







async function ReportingActions(actions, process) {

    console.log(`▶️ DÉBUT DU PROCESSUS : '${process}'`);
    console.log(`📦 Actions reçues :\n${JSON.stringify(actions, null, 2)}`);


    const completedActions = await new Promise((resolve) => {
        chrome.storage.local.get("completedActions", (result) => {
            resolve(result.completedActions || {});
        });
    });



    const currentProcessCompleted = completedActions[process] || [];




    const normalize = (obj) => {
        const sortedKeys = Object.keys(obj).sort();
        const normalizedObj = sortedKeys.reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {});
        return JSON.stringify(normalizedObj)
            .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
            .trim();
    };





    const isActionCompleted = (action) => {
        const normalizedAction = normalize({ ...action, sub_action: undefined });
        return currentProcessCompleted.some((completed) => {
            const normalizedCompleted = normalize({ ...completed, sub_action: undefined });
            return normalizedAction === normalizedCompleted;
        });
    };





    const addToCompletedActions = async (action, process) => {
        try {
            const completedAction = { ...action };
            delete completedAction.sub_action;
            currentProcessCompleted.push(completedAction);
            completedActions[process] = currentProcessCompleted;
            await new Promise((resolve) => {
                chrome.storage.local.set({ completedActions }, resolve);
            });
            console.log(`📥 [AJOUT ACTION COMPLÉTÉE] ${JSON.stringify(completedAction, null, 2)}`);
        } catch (error) {
            console.log(`❌ [ERREUR AJOUT ACTION] ${error.message}`);
        }
    };



    
    for (const action of actions) {

        if (redirectUrls.includes(window.location.href)) {
            window.location.href = "https://mail.google.com/mail/u/0/#inbox";
        }


        console.log(`➡️ Traitement de l'action : ${JSON.stringify(action, null, 2)}`);

        if (isActionCompleted(action)) {
            console.log(`⚠️ [ACTION DÉJÀ FAITE] : ${action.action}`);
            if (action.sub_action?.length > 0) {
                console.log("🔁 [RECURSION] Exécution des  sous-actions...");
                await ReportingActions(action.sub_action, process);
            } else {
                console.log("✔️ [AUCUNE ACTION] Aucune sous-action à traiter.");
            }
            continue;
        }

        await addToCompletedActions(action, process);

        try {
            if (action.action === "check_if_exist") {
                console.log("🔍 [VÉRIFICATION] Recherche de l'élément..."); 
                const elementExists = await waitForElement(action.xpath, action.wait);

                if (elementExists) {
                    console.log(`✅ [ÉLÉMENT TROUVÉ] ${action.xpath}`);
                

                    if (action.type) {
                        console.log(`📁 [DOWNLOAD] Type : ${action.type}`);
                        
                        return "STOP_PROCESS";

                    } else if (action.sub_action?.length > 0) {
                     

                        console.log("🔄 [SOUS-ACTIONS] Exécution...");
                        await ReportingActions(action.sub_action, process);


                    } else {
                        console.log("✔️ [AUCUNE ACTION] Pas de sous-actions.");
                    }

                } else {
                    console.log(`❌ [ABSENT] Élément introuvable : ${action.xpath}`);
                }

                // 2
                if (action.sleep) {
                    console.log(`👽👽👽👽 Démarrage de la pause de ${action.sleep / 1000} secondes...`);
                    await sleep(action.sleep);  
                }

            } else {
                await SWitchCase(action, process);
                if (action.sleep) {
                    console.log(`⏱️ [PAUSE] ${action.sleep}s...`);
                    await new Promise((resolve) => setTimeout(resolve, action.sleep * 1000));
                }
            }

        } catch (error) {
            console.log(`❌ [ERREUR ACTION] ${action.action} : ${error.message}`);
        }
    }

    console.log(`✅ FIN DU PROCESSUS : '${process}'\n`);
    return true;
}





async function sleep(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    for (let i = 1; i <= totalSeconds; i++) {
        console.log(`⏳ Attente... ${i} seconde(s) écoulée(s)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("✅ Pause terminée !");
}









async function SWitchCase(action, process){
      
        switch (action.action) {


            case "click":
                let clickElement;
                if (action.obligatoire) {
                    clickElement = await findElementByXPath(action.xpath, undefined, action.obligatoire, action.type);
                } else {
                    clickElement = await findElementByXPath(action.xpath);
                }
            
                if (clickElement) {
                    clickElement.click();
                    console.log(`✅ [CLICK] Clic effectué avec succès sur l'élément : ${action.xpath}`);
                } else {
                    console.log(`❌ [CLICK] Échec : élément introuvable pour XPath : ${action.xpath}`);
                }
                break;
                
            
            case "send_keys":
                let inputElement;
                if (action.obligatoire) {
                    inputElement = await findElementByXPath(action.xpath, action.wait , action.obligatoire, action.type);
                } else {
                    inputElement = await findElementByXPath(action.xpath ,  action.wait);
                }
            
                if (inputElement) {
                    inputElement.value = action.value;
                    console.log(`✅ [SEND KEYS] Texte "${action.value}" saisi dans l'élément : ${action.xpath}`);
                } else {
                    console.log(`❌ [SEND KEYS] Échec : Élément introuvable pour XPath "${action.xpath}"`);
                }
                break;
                
            
            case "press_keys":
                let pressElement;
                if (action.obligatoire) {
                    pressElement = await findElementByXPath(action.xpath, undefined, action.obligatoire, action.type);
                } else {
                    pressElement = await findElementByXPath(action.xpath ,  action.wait);
                }
            
                if (pressElement) {
                    pressElement.click();
                    console.log(`✅ [PRESS KEYS] Clic sur l'élément : ${action.xpath}`);
                } else {
                    console.log(`❌ [PRESS KEYS] Échec : Élément introuvable pour XPath : ${action.xpath}`);
                }
            
                if (action.sub_action?.length > 0) {
                    await ReportingActions(action.sub_action, process);
                } else {
                    console.log("✔️ [NO SUB-ACTIONS] Aucune sous-action pour press_keys.");
                }
                break;


            default:
                console.log(`⚠️ Action inconnue : ${action.action}`);
                                
        }
}










function genererIdUnique() {
    const timestamp = Date.now().toString(36); 
    const random = Math.random().toString(36).substring(2, 10); 
    const uniqueId = `${timestamp}-${random}`;
    return uniqueId;
}







function addUniqueIdsToActions(actions) {
    actions.forEach(action => {
        action.id = genererIdUnique();
        if (action.sub_action && Array.isArray(action.sub_action)) {
            addUniqueIdsToActions(action.sub_action); 
        }
    });
}












let processAlreadyRunning = false;


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    try {
        if (message.action === "startProcess") {
            console.groupCollapsed("%c📨 Données reçues avec startProcess", "color: green; font-weight: bold;");
            console.log(JSON.stringify(message, null, 2));
            console.groupEnd();

            const forbiddenPages = [
                "https://contacts.google.com",
                "https://www.google.com/maps",
                "https://trends.google.com/trends/",
                "https://news.google.com/home"
            ];
            if (forbiddenPages.some(url => window.location.href.startsWith(url))) {
                console.warn("⛔️ Le processus ne peut pas être démarré depuis cette page.");
                sendResponse({ status: "error", message: "Page interdite pour démarrer le processus." });
                return;
            }

            if (processAlreadyRunning) {
                console.warn("⚠️ Processus déjà en cours, demande ignorée.");
                sendResponse({ status: "error", message: "Le processus est déjà en cours." });
                return;
            }

            processAlreadyRunning = true;

            createPopup(message)
                .then(() => {
                    console.log("✅ Processus terminé avec succès.");
                    processAlreadyRunning = false;
                    sendResponse({ status: "success", message: "Le processus a été démarré avec succès." });
                })
                .catch(err => {
                    console.error("❌ Erreur lors du démarrage du processus :", err);
                    processAlreadyRunning = false;
                    sendResponse({ status: "error", message: err.message });
                });
        }
    } catch (err) {
        console.error("❌ Erreur générale :", err);
        processAlreadyRunning = false;
        sendResponse({ status: "error", message: err.message });
    }
    return true;
});


