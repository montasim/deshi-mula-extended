document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById(
        'apiKeyInput'
    ) as HTMLInputElement;
    const aboutBtn = document.getElementById('about') as HTMLButtonElement;
    const saveBtn = document.getElementById('saveKey') as HTMLButtonElement;
    const statusDiv = document.getElementById('saveStatus') as HTMLElement;
    const apiKeyStatus = document.getElementById('apiKeyStatus') as HTMLElement;
    const fetchBtn = document.getElementById('fetchData') as HTMLButtonElement;

    // Restore saved key
    chrome.storage.local.get('apiKey', (data) => {
        if (data.apiKey) apiKeyInput.value = data.apiKey as string;
    });

    // About button
    aboutBtn.addEventListener('click', () => {});

    // Save button
    saveBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            statusDiv.textContent = 'Key cannot be empty';
            statusDiv.style.color = 'red';
            return;
        }
        chrome.storage.local.set({ apiKey: key }, () => {
            statusDiv.textContent = 'API Key saved!';
            statusDiv.style.color = 'green';
            setTimeout(() => (statusDiv.textContent = ''), 2000);
        });
    });

    // Fetch-data button
    fetchBtn.addEventListener('click', async () => {
        apiKeyStatus.textContent = 'Fetching data…';
        chrome.storage.local.get('apiKey', async (data) => {
            const apiKey = data.apiKey as string | undefined;
            if (!apiKey) {
                apiKeyStatus.textContent = 'No API Key set.';
                return;
            }

            try {
                const res = await fetch('https://api.example.com/some-data', {
                    headers: { 'X-API-Key': apiKey },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const result = await res.json();
                apiKeyStatus.textContent = 'Success: ' + JSON.stringify(result);
            } catch (err) {
                apiKeyStatus.textContent = 'Error: ' + (err as Error).message;
            }
        });
    });
});
