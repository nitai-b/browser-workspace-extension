import { useEffect, useMemo, useState } from 'react';
import ProjectDetails from './components/ProjectDetails.jsx';
import ProjectList from './components/ProjectList.jsx';
import {
  addTabsToProject,
  createProject,
  deleteProject,
  exportProjects,
  getState,
  importProjects,
  moveSavedTab,
  removeSavedTab,
  renameProject,
  selectProject,
  setProjectArchived,
  updateProjectNotes,
} from '../lib/storage.js';
import {
  getCurrentTab,
  getCurrentWindowTabs,
  getSaveableTabs,
  restoreProjectTabs,
} from '../lib/chromeTabs.js';
import { downloadJson } from '../lib/utils.js';

export default function App() {
  const [state, setState] = useState({ projects: [], selectedProjectId: null });
  const [loading, setLoading] = useState(true);
  const [notesDraft, setNotesDraft] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [feedback, setFeedback] = useState('');

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

      setState(changes.workspaceOrganizerState.newValue);
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

  async function handleRestoreProject() {
    if (!selectedProject) {
      return;
    }

    try {
      await restoreProjectTabs(selectedProject);
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
        projects={state.projects}
        selectedProjectId={state.selectedProjectId}
        showArchived={showArchived}
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
          onRemoveTab={handleRemoveTab}
        />
      </div>
    </main>
  );
}
