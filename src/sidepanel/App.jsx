import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectDetails from './components/ProjectDetails.jsx';
import ProjectList from './components/ProjectList.jsx';
import {
  addProjectNote,
  addTabsToProject,
  createProject,
  deleteProjectNote,
  deleteProject,
  exportProjects,
  getState,
  importProjects,
  linkSavedTabToBrowserTab,
  linkRestoredTabsToProject,
  moveSavedTab,
  normalizeState,
  removeSavedTab,
  renameProject,
  selectProject,
  setProjectArchived,
  updateProjectNote,
} from '../lib/storage.js';
import {
  findOpenBrowserTabForSavedTab,
  focusBrowserTab,
  getAllOpenTabs,
  getCurrentTab,
  getCurrentWindowTabs,
  getSaveableTabs,
  isSaveableUrl,
  isSameBrowserTab,
  normalizeAddressBarUrl,
  restoreProjectTabs,
  toSavedTab,
} from '../lib/chromeTabs.js';
import { downloadJson } from '../lib/utils.js';
import { getSearchResults } from '../lib/search.js';

export default function App() {
  const [state, setState] = useState({ projects: [], selectedProjectId: null });
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [activeBrowserTab, setActiveBrowserTab] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeView, setActiveView] = useState('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const selectedProject = useMemo(
    () => state.projects.find((project) => project.id === state.selectedProjectId) || null,
    [state.projects, state.selectedProjectId],
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const nextState = await getState();

      if (!isMounted) {
        return;
      }

      setState(nextState);
      setLoading(false);
    }

    load();

    const handleChange = (changes, areaName) => {
      if (areaName !== 'local' || !changes.workspaceOrganizerState) {
        return;
      }

      setState(normalizeState(changes.workspaceOrganizerState.newValue));
    };

    chrome.storage.onChanged.addListener(handleChange);

    return () => {
      isMounted = false;
      chrome.storage.onChanged.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function refreshOpenTabs() {
      try {
        const tabs = await getAllOpenTabs();

        if (isMounted) {
          setOpenTabs(tabs.filter((tab) => isSaveableUrl(tab.url)));
        }
      } catch (error) {
        console.error('Failed to refresh open tabs.', error);
      }
    }

    function handleTabChanged() {
      refreshOpenTabs();
    }

    refreshOpenTabs();
    chrome.tabs.onActivated.addListener(handleTabChanged);
    chrome.tabs.onUpdated.addListener(handleTabChanged);
    chrome.tabs.onRemoved.addListener(handleTabChanged);
    chrome.windows.onFocusChanged.addListener(handleTabChanged);

    return () => {
      isMounted = false;
      chrome.tabs.onActivated.removeListener(handleTabChanged);
      chrome.tabs.onUpdated.removeListener(handleTabChanged);
      chrome.tabs.onRemoved.removeListener(handleTabChanged);
      chrome.windows.onFocusChanged.removeListener(handleTabChanged);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function refreshActiveBrowserTab() {
      let tab = null;

      try {
        tab = await getCurrentTab();
      } catch (error) {
        console.error('Failed to refresh active browser tab.', error);
      }

      if (isMounted) {
        setActiveBrowserTab(tab);
      }
    }

    function handleActivated() {
      refreshActiveBrowserTab();
    }

    function handleWindowFocusChanged() {
      refreshActiveBrowserTab();
    }

    function handleUpdated(tabId) {
      setActiveBrowserTab((currentTab) => {
        if (currentTab?.id === tabId) {
          refreshActiveBrowserTab();
        }

        return currentTab;
      });
    }

    refreshActiveBrowserTab();
    chrome.tabs.onActivated.addListener(handleActivated);
    chrome.tabs.onUpdated.addListener(handleUpdated);
    chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);

    return () => {
      isMounted = false;
      chrome.tabs.onActivated.removeListener(handleActivated);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      chrome.windows.onFocusChanged.removeListener(handleWindowFocusChanged);
    };
  }, []);

  const activeProjectMatch = useMemo(() => {
    if (!activeBrowserTab?.url) {
      return null;
    }

    const projects = Array.isArray(state.projects) ? state.projects : [];

    for (const project of projects) {
      const tabs = Array.isArray(project.tabs) ? project.tabs : [];
      const linkedSavedTab = tabs.find((tab) => isSameBrowserTab(tab, activeBrowserTab));

      if (linkedSavedTab) {
        return {
          projectId: project.id,
          tabId: linkedSavedTab.id,
        };
      }
    }

    for (const project of projects) {
      const tabs = Array.isArray(project.tabs) ? project.tabs : [];
      const matchingUrlTab = tabs.find((tab) => tab.url === activeBrowserTab.url);

      if (matchingUrlTab) {
        return {
          projectId: project.id,
          tabId: matchingUrlTab.id,
        };
      }
    }

    return null;
  }, [activeBrowserTab, state.projects]);

  const activeSavedTabId =
    activeProjectMatch && selectedProject?.id === activeProjectMatch.projectId
      ? activeProjectMatch.tabId
      : null;

  const searchResults = useMemo(
    () => getSearchResults(state.projects, searchQuery),
    [state.projects, searchQuery],
  );

  const visibleProjects = useMemo(() => {
    if (searchResults.query) {
      return searchResults.projects;
    }

    return state.projects.filter((project) =>
      showArchived ? project.isArchived : !project.isArchived,
    );
  }, [searchResults, showArchived, state.projects]);

  const selectedProjectSearchTabIds = useMemo(() => {
    if (!selectedProject || !searchResults.query) {
      return new Set();
    }

    return searchResults.tabIdsByProjectId.get(selectedProject.id) || new Set();
  }, [searchResults, selectedProject]);

  useEffect(() => {
    function focusSearchInput({ select = false } = {}) {
      const input = searchInputRef.current;

      if (!input) {
        return;
      }

      input.focus({ preventScroll: true });

      if (select) {
        input.select();
      }
    }

    function handleSearchShortcut(event) {
      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusSearchInput({ select: true });
        return;
      }

      if (activeView !== 'projects') {
        return;
      }

      if (event.key === '/' && !isEditable) {
        event.preventDefault();
        focusSearchInput();
        return;
      }

      if (event.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
        return;
      }

      if (
        event.key.length === 1 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !isEditable
      ) {
        setSearchQuery(event.key);
        focusSearchInput();
      }
    }

    window.addEventListener('keydown', handleSearchShortcut);

    return () => {
      window.removeEventListener('keydown', handleSearchShortcut);
    };
  }, [activeView]);

  useEffect(() => {
    if (!searchResults.query || !searchResults.projects.length) {
      return;
    }

    const selectedProjectIsVisible = searchResults.projectIds.has(state.selectedProjectId);

    if (!selectedProjectIsVisible) {
      selectProject(searchResults.projects[0].id);
    }
  }, [searchResults, state.selectedProjectId]);

  useEffect(() => {
    if (activeView !== 'projects' || loading) {
      return;
    }

    function focusProjectSearch() {
      const input = searchInputRef.current;

      if (!input) {
        return;
      }

      input.focus({ preventScroll: true });
      input.select();
    }

    focusProjectSearch();
    const focusTimeoutIds = [50, 150, 300].map((delay) =>
      window.setTimeout(focusProjectSearch, delay),
    );

    return () => {
      focusTimeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [activeView, loading]);

  function showMessage(message) {
    setFeedback(message);
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => setFeedback(''), 3000);
  }

  async function refreshState() {
    setState(await getState());
  }

  async function handleCreateProject() {
    const name = window.prompt('Project name');
    await createProject(name || '');
    showMessage('Project created.');
  }

  async function handleSelectProject(projectId) {
    await selectProject(projectId);
    setActiveView('project');
  }

  function handleBackToProjects() {
    setActiveView('projects');
  }

  async function handleRenameProject() {
    if (!selectedProject) {
      return;
    }

    const name = window.prompt('Rename project', selectedProject.name);

    if (name === null) {
      return;
    }

    await renameProject(selectedProject.id, name);
    showMessage('Project renamed.');
  }

  async function handleDeleteProject() {
    if (!selectedProject) {
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedProject.name}"?`);

    if (!confirmed) {
      return;
    }

    await deleteProject(selectedProject.id);
    showMessage('Project deleted.');
  }

  async function saveTabsToCurrentProject(tabs) {
    if (!selectedProject) {
      return;
    }

    const saveableTabs = getSaveableTabs(tabs);

    if (!saveableTabs.length) {
      showMessage('No saveable tabs found. Restricted browser pages are skipped.');
      return;
    }

    await addTabsToProject(selectedProject.id, saveableTabs);
    showMessage(`Saved ${saveableTabs.length} ${saveableTabs.length === 1 ? 'tab' : 'tabs'}.`);
  }

  async function handleSaveCurrentTab() {
    const tab = await getCurrentTab();

    if (!tab) {
      showMessage('No active tab found.');
      return;
    }

    await saveTabsToCurrentProject([tab]);
  }

  async function handleSaveCurrentWindow() {
    const tabs = await getCurrentWindowTabs();
    await saveTabsToCurrentProject(tabs);
  }

  async function handleAddSiteUrl(urlInput) {
    if (!selectedProject) {
      return false;
    }

    try {
      const url = normalizeAddressBarUrl(urlInput);
      const browserTab = await chrome.tabs.create({ url, active: true });
      const savedTab = toSavedTab({
        ...browserTab,
        title: browserTab.title || url,
        url: browserTab.url || url,
      });

      await addTabsToProject(selectedProject.id, [savedTab]);
      await linkSavedTabToBrowserTab(selectedProject.id, savedTab.id, browserTab);
      showMessage(`Added ${url} to this project.`);
      return true;
    } catch (error) {
      showMessage(error.message || 'Could not add that site.');
      return false;
    }
  }

  async function handleAddNote() {
    if (!selectedProject) {
      return;
    }

    await addProjectNote(selectedProject.id, {
      title: '',
      body: '',
    });
    showMessage('Note added.');
  }

  async function handleUpdateNote(noteId, updates) {
    if (!selectedProject) {
      return;
    }

    await updateProjectNote(selectedProject.id, noteId, updates);
    showMessage('Note saved.');
  }

  async function handleDeleteNote(noteId) {
    if (!selectedProject) {
      return;
    }

    const confirmed = window.confirm('Delete this note?');

    if (!confirmed) {
      return;
    }

    await deleteProjectNote(selectedProject.id, noteId);
    showMessage('Note deleted.');
  }

  async function handleArchiveToggle() {
    if (!selectedProject) {
      return;
    }

    await setProjectArchived(selectedProject.id, !selectedProject.isArchived);
    showMessage(selectedProject.isArchived ? 'Project restored to active.' : 'Project archived.');
  }

  async function handleRemoveTab(tabId) {
    if (!selectedProject) {
      return;
    }

    await removeSavedTab(selectedProject.id, tabId);
    showMessage('Saved tab removed.');
  }

  async function handleMoveTab(tabId, direction) {
    if (!selectedProject) {
      return;
    }

    await moveSavedTab(selectedProject.id, tabId, direction);
  }

  async function handleOpenSavedTab(tab) {
    if (!selectedProject) {
      return;
    }

    try {
      const existingBrowserTab = await findOpenBrowserTabForSavedTab(tab);
      const browserTab = existingBrowserTab || (await chrome.tabs.create({ url: tab.url, active: true }));
      const focusedBrowserTab = await focusBrowserTab(browserTab);

      await linkSavedTabToBrowserTab(selectedProject.id, tab.id, focusedBrowserTab || browserTab);
    } catch (error) {
      console.error('Failed to open saved tab.', error);
      showMessage('Could not open that saved tab.');
    }
  }

  async function handleFocusOpenTab(tab) {
    try {
      await focusBrowserTab(tab);
    } catch (error) {
      console.error('Failed to focus open tab.', error);
      showMessage('Could not focus that tab.');
    }
  }

  async function handleRestoreProject() {
    if (!selectedProject) {
      return;
    }

    try {
      const restoredTabLinks = await restoreProjectTabs(selectedProject);
      await linkRestoredTabsToProject(selectedProject.id, restoredTabLinks);
      showMessage('Project restored in a new window.');
    } catch (error) {
      showMessage(error.message);
    }
  }

  async function handleExport() {
    const exportData = await exportProjects();
    downloadJson('workspace-organizer-projects.json', exportData);
    showMessage('Projects exported.');
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { summary } = await importProjects(data);
      showMessage(
        `Imported ${summary.addedProjects} new ${summary.addedProjects === 1 ? 'project' : 'projects'} and merged ${summary.mergedProjects}.`,
      );
    } catch (error) {
      showMessage(error.message || 'Could not import that JSON file.');
    }
  }

  useEffect(() => {
    if (!selectedProject && state.projects.length && !loading) {
      refreshState();
    }
  }, [selectedProject, state.projects.length, loading]);

  if (loading) {
    return <div className="loading-screen">Loading workspace organizer…</div>;
  }

  return (
    <main className="app-shell">
      <div className="app-topbar">
        <div>
          <p className="eyebrow">Workspace Organizer</p>
          <h1>{activeView === 'project' ? selectedProject?.name || 'Project' : 'Workspace'}</h1>
        </div>
        <nav className="view-tabs" aria-label="Workspace views">
          <button
            className={`view-tab ${activeView !== 'openTabs' ? 'is-active' : ''}`}
            onClick={() => setActiveView('projects')}
          >
            Projects
          </button>
          <button
            className={`view-tab ${activeView === 'openTabs' ? 'is-active' : ''}`}
            onClick={() => setActiveView('openTabs')}
          >
            Open tabs
          </button>
        </nav>
      </div>

      {feedback ? <div className="feedback-banner">{feedback}</div> : null}

      {activeView === 'projects' ? (
        <ProjectList
          projects={visibleProjects}
          selectedProjectId={state.selectedProjectId}
          showArchived={showArchived}
          searchQuery={searchQuery}
          searchResultCount={searchResults.projects.length}
          isSearching={Boolean(searchResults.query)}
          searchInputRef={searchInputRef}
          activeProjectId={activeProjectMatch?.projectId || null}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          onSelect={handleSelectProject}
          onCreateProject={handleCreateProject}
          onToggleArchivedView={() => setShowArchived((value) => !value)}
        />
      ) : null}

      {activeView === 'openTabs' ? (
        <OpenTabsView
          tabs={openTabs}
          activeBrowserTab={activeBrowserTab}
          onFocusTab={handleFocusOpenTab}
        />
      ) : null}

      {activeView === 'project' ? (
        <div className="details-shell">
          <ProjectDetails
            project={selectedProject}
            onBack={handleBackToProjects}
            onRename={handleRenameProject}
            onDelete={handleDeleteProject}
            onArchiveToggle={handleArchiveToggle}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onSaveCurrentTab={handleSaveCurrentTab}
            onSaveCurrentWindow={handleSaveCurrentWindow}
            onAddSiteUrl={handleAddSiteUrl}
            onRestoreProject={handleRestoreProject}
            onExport={handleExport}
            onImport={handleImport}
            onMoveTab={handleMoveTab}
            onOpenSavedTab={handleOpenSavedTab}
            onRemoveTab={handleRemoveTab}
            activeSavedTabId={activeSavedTabId}
            searchQuery={searchResults.query}
            searchTabIds={selectedProjectSearchTabIds}
          />
        </div>
      ) : null}
    </main>
  );
}

function OpenTabsView({ tabs, activeBrowserTab, onFocusTab }) {
  return (
    <section className="open-tabs-view">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Browser</p>
          <h2>Open tabs</h2>
        </div>
        <span className="count-pill">
          {tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'}
        </span>
      </div>

      {tabs.length ? (
        <ul className="saved-tab-list">
          {tabs.map((tab) => (
            <li
              key={`${tab.windowId}-${tab.id}`}
              className={`saved-tab-item ${isSameOpenTab(tab, activeBrowserTab) ? 'is-current-tab' : ''}`}
              onClick={() => onFocusTab(tab)}
              role="link"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onFocusTab(tab);
                }
              }}
              title={`Go to ${tab.title || tab.url}`}
            >
              <div className="saved-tab-main">
                <div className="saved-tab-title-row">
                  {tab.favIconUrl ? <img className="favicon" src={tab.favIconUrl} alt="" /> : <span className="favicon fallback" />}
                  <span className="saved-tab-title">{tab.title || tab.url}</span>
                  {isSameOpenTab(tab, activeBrowserTab) ? <span className="current-tab-pill">Current tab</span> : null}
                </div>
                <span className="saved-tab-url">{tab.url}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state compact">
          <p>No open browser tabs are available to show.</p>
        </div>
      )}
    </section>
  );
}

function isSameOpenTab(tab, activeBrowserTab) {
  return Boolean(
    activeBrowserTab &&
      tab.id === activeBrowserTab.id &&
      tab.windowId === activeBrowserTab.windowId,
  );
}
