const getGeminiApiKey = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['apiKey'], (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result.apiKey);
        });
    });
};

export default getGeminiApiKey;
