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
    createdAt: new Date().toISOString(),
  };
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

export function getSaveableTabs(tabs) {
  return tabs.filter((tab) => isSaveableUrl(tab.url)).map(toSavedTab);
}

export async function restoreProjectTabs(project) {
  const urls = project.tabs
    .map((tab) => tab.url)
    .filter((url) => isSaveableUrl(url));

  if (!urls.length) {
    throw new Error('This project has no restorable tabs.');
  }

  await chrome.windows.create({ url: urls });
}
