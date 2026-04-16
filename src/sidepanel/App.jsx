import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectDetails from './components/ProjectDetails.jsx';
import ProjectList from './components/ProjectList.jsx';
import {
  addTabsToProject,
  createProject,
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
  updateProjectNotes,
} from '../lib/storage.js';
import {
  findOpenBrowserTabForSavedTab,
  focusBrowserTab,
  getCurrentTab,
  getCurrentWindowTabs,
  getSaveableTabs,
  isSameBrowserTab,
  restoreProjectTabs,
} from '../lib/chromeTabs.js';
import { downloadJson } from '../lib/utils.js';
import { getSearchResults } from '../lib/search.js';

export default function App() {
  const [state, setState] = useState({ projects: [], selectedProjectId: null });
  const [loading, setLoading] = useState(true);
  const [notesDraft, setNotesDraft] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [activeBrowserTab, setActiveBrowserTab] = useState(null);
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
    setNotesDraft(selectedProject?.notes || '');
  }, [selectedProject?.id, selectedProject?.notes]);

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
    function handleSearchShortcut(event) {
      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === '/' && !isEditable) {
        event.preventDefault();
        searchInputRef.current?.focus();
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
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleSearchShortcut);

    return () => {
      window.removeEventListener('keydown', handleSearchShortcut);
    };
  }, []);

  useEffect(() => {
    if (!searchResults.query || !searchResults.projects.length) {
      return;
    }

    const selectedProjectIsVisible = searchResults.projectIds.has(state.selectedProjectId);

    if (!selectedProjectIsVisible) {
      selectProject(searchResults.projects[0].id);
    }
  }, [searchResults, state.selectedProjectId]);

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

  async function handleSaveNotes() {
    if (!selectedProject) {
      return;
    }

    await updateProjectNotes(selectedProject.id, notesDraft);
    showMessage('Notes saved.');
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
      await importProjects(data);
      showMessage('Projects imported.');
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

      <div className="details-shell">
        {feedback ? <div className="feedback-banner">{feedback}</div> : null}
        <ProjectDetails
          project={selectedProject}
          notesDraft={notesDraft}
          onRename={handleRenameProject}
          onDelete={handleDeleteProject}
          onArchiveToggle={handleArchiveToggle}
          onNotesChange={setNotesDraft}
          onSaveNotes={handleSaveNotes}
          onSaveCurrentTab={handleSaveCurrentTab}
          onSaveCurrentWindow={handleSaveCurrentWindow}
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
    </main>
  );
}
