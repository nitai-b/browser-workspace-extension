const RESTRICTED_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'brave://',
  'about:',
  'devtools://',
  'view-source:',
];

export function isSaveableUrl(url) {
  return Boolean(
    url &&
      !RESTRICTED_PREFIXES.some((prefix) => url.startsWith(prefix)),
  );
}

export function toSavedTab(tab) {
  return {
    id: crypto.randomUUID(),
    title: tab.title || tab.url || 'Untitled tab',
    url: tab.url,
    favIconUrl: tab.favIconUrl || '',
    browserTabId: typeof tab.id === 'number' ? tab.id : null,
    browserWindowId: typeof tab.windowId === 'number' ? tab.windowId : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function isSameBrowserTab(savedTab, browserTab) {
  return Boolean(
    browserTab &&
      savedTab.browserTabId === browserTab.id &&
      savedTab.browserWindowId === browserTab.windowId,
  );
}

export async function getCurrentTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs[0] || null;
}

export async function getCurrentWindowTabs() {
  return chrome.tabs.query({ currentWindow: true });
}

export async function getAllOpenTabs() {
  return chrome.tabs.query({});
}

export async function findOpenBrowserTabForSavedTab(savedTab) {
  if (typeof savedTab.browserTabId === 'number') {
    try {
      const linkedTab = await chrome.tabs.get(savedTab.browserTabId);

      if (
        linkedTab &&
        linkedTab.url === savedTab.url &&
        (typeof savedTab.browserWindowId !== 'number' ||
          linkedTab.windowId === savedTab.browserWindowId)
      ) {
        return linkedTab;
      }
    } catch (error) {
      // The linked browser tab no longer exists, so fall back to URL matching.
    }
  }

  const matchingTabs = await chrome.tabs.query({ url: savedTab.url });
  return matchingTabs[0] || null;
}

export async function focusBrowserTab(tab) {
  if (!tab || typeof tab.id !== 'number') {
    return null;
  }

  if (typeof tab.windowId === 'number') {
    await chrome.windows.update(tab.windowId, { focused: true });
  }

  return chrome.tabs.update(tab.id, { active: true });
}

export function getSaveableTabs(tabs) {
  return tabs.filter((tab) => isSaveableUrl(tab.url)).map(toSavedTab);
}

export async function restoreProjectTabs(project) {
  const restorableTabs = project.tabs.filter((tab) => isSaveableUrl(tab.url));
  const urls = restorableTabs.map((tab) => tab.url);

  if (!urls.length) {
    throw new Error('This project has no restorable tabs.');
  }

  const window = await chrome.windows.create({ url: urls });
  const createdTabs = window.tabs || [];

  return restorableTabs.map((savedTab, index) => ({
    savedTabId: savedTab.id,
    browserTab: createdTabs[index],
  }));
}
