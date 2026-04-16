import { STORAGE_KEY } from '../lib/constants.js';
import { normalizeState, saveState } from '../lib/storage.js';
import { isSaveableUrl } from '../lib/chromeTabs.js';

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    await clearLiveTabLinks();
  } catch (error) {
    console.error('Failed to enable side panel action behavior.', error);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    await clearLiveTabLinks();
  } catch (error) {
    console.error('Failed to restore side panel action behavior.', error);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url && !changeInfo.title && !changeInfo.favIconUrl && changeInfo.status !== 'complete') {
    return;
  }

  if (!isSaveableUrl(tab.url)) {
    return;
  }

  await syncSavedTabFromBrowserTab(tabId, tab);
});

chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  await moveLinkedSavedTabToTop(tabId, windowId);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await unlinkClosedBrowserTab(tabId);
});

async function readState() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return normalizeState(result[STORAGE_KEY]);
}

async function clearLiveTabLinks() {
  const state = await readState();
  let changed = false;

  const projects = state.projects.map((project) => ({
    ...project,
    tabs: project.tabs.map((savedTab) => {
      if (savedTab.browserTabId === null && savedTab.browserWindowId === null) {
        return savedTab;
      }

      changed = true;
      return {
        ...savedTab,
        browserTabId: null,
        browserWindowId: null,
      };
    }),
  }));

  if (changed) {
    await saveState({ ...state, projects });
  }
}

async function unlinkClosedBrowserTab(tabId) {
  const state = await readState();
  let changed = false;

  const projects = state.projects.map((project) => ({
    ...project,
    tabs: project.tabs.map((savedTab) => {
      if (savedTab.browserTabId !== tabId) {
        return savedTab;
      }

      changed = true;
      return {
        ...savedTab,
        browserTabId: null,
        browserWindowId: null,
      };
    }),
  }));

  if (changed) {
    await saveState({ ...state, projects });
  }
}

async function syncSavedTabFromBrowserTab(tabId, browserTab) {
  const state = await readState();
  let changed = false;
  const now = new Date().toISOString();

  const projects = state.projects.map((project) => ({
    ...project,
    tabs: project.tabs.map((savedTab) => {
      if (
        savedTab.browserTabId !== tabId ||
        savedTab.browserWindowId !== browserTab.windowId
      ) {
        return savedTab;
      }

      changed = true;
      return {
        ...savedTab,
        title: browserTab.title || browserTab.url || savedTab.title,
        url: browserTab.url,
        favIconUrl: browserTab.favIconUrl || '',
        updatedAt: now,
      };
    }),
  }));

  if (changed) {
    await saveState({ ...state, projects });
  }
}

async function moveLinkedSavedTabToTop(tabId, windowId) {
  const state = await readState();
  let changed = false;
  const now = new Date().toISOString();

  const projects = state.projects.map((project) => {
    const currentIndex = project.tabs.findIndex(
      (savedTab) =>
        savedTab.browserTabId === tabId &&
        savedTab.browserWindowId === windowId,
    );

    if (currentIndex <= 0) {
      return project;
    }

    changed = true;
    const tabs = [...project.tabs];
    const [moved] = tabs.splice(currentIndex, 1);

    return {
      ...project,
      updatedAt: now,
      tabs: [
        {
          ...moved,
          updatedAt: now,
        },
        ...tabs,
      ],
    };
  });

  if (changed) {
    await saveState({ ...state, projects });
  }
}
