import { updateState } from '../lib/storage.js';
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
  await syncLinkedSavedTabSelection(tabId, windowId);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await unlinkClosedBrowserTab(tabId);
});

async function clearLiveTabLinks() {
  await updateState((state) => {
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

    return changed ? { ...state, projects } : state;
  });
}

async function unlinkClosedBrowserTab(tabId) {
  await updateState((state) => {
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

    return changed ? { ...state, projects } : state;
  });
}

async function syncSavedTabFromBrowserTab(tabId, browserTab) {
  const now = new Date().toISOString();

  await updateState((state) => {
    let changed = false;

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

    return changed ? { ...state, projects } : state;
  });
}

async function syncLinkedSavedTabSelection(tabId, windowId) {
  const now = new Date().toISOString();

  await updateState((state) => {
    let changed = false;

    const projects = state.projects.map((project) => {
      let projectChanged = false;

      const tabs = project.tabs.map((savedTab) => {
        if (savedTab.browserTabId !== tabId || savedTab.browserWindowId !== windowId) {
          return savedTab;
        }

        changed = true;
        projectChanged = true;
        return {
          ...savedTab,
          updatedAt: now,
        };
      });

      return projectChanged
        ? {
            ...project,
            updatedAt: now,
            tabs,
          }
        : project;
    });

    return changed ? { ...state, projects } : state;
  });
}
