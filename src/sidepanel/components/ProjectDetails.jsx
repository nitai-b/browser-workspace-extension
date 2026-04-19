import { useEffect, useRef, useState } from 'react';
import {
  ArchiveIcon,
  DeleteIcon,
  DragHandleIcon,
  EditIcon,
  PinIcon,
  PlusIcon,
  RestoreIcon,
  SaveIcon,
} from './Icons.jsx';
import { getFormattedJsonSize } from '../../lib/utils.js';

function TabRow({
  tab,
  draggedTabId,
  dropIndicator,
  isActive,
  isSearchMatch,
  registerTabElement,
  onDragEnd,
  onDragStart,
  onDropIndicatorChange,
  onDropTab,
  onOpen,
  onRemove,
}) {
  function openSavedTab() {
    onOpen(tab);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSavedTab();
    }
  }

  return (
    <li
      ref={(element) => registerTabElement(tab.id, element)}
      className={`saved-tab-item ${isActive ? 'is-current-tab' : ''} ${isSearchMatch ? 'is-search-match' : ''} ${tab.id === draggedTabId ? 'is-dragging' : ''
        } ${dropIndicator?.targetTabId === tab.id && dropIndicator?.placement === 'before' && tab.id !== draggedTabId
          ? 'is-drop-before'
          : ''
        } ${dropIndicator?.targetTabId === tab.id && dropIndicator?.placement === 'after' && tab.id !== draggedTabId
          ? 'is-drop-after'
          : ''
        }`}
      onClick={openSavedTab}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      title={`Open ${tab.title}`}
      draggable
      onDragStart={() => onDragStart(tab.id)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (draggedTabId === tab.id) {
          return;
        }

        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const placement = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';

        onDropIndicatorChange({
          targetTabId: tab.id,
          placement,
        });
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropTab(tab.id, dropIndicator?.placement);
      }}
    >
      <div className="saved-tab-main">
        <div className="saved-tab-title-row">
          {tab.favIconUrl ? <img className="favicon" src={tab.favIconUrl} alt="" /> : <span className="favicon fallback" />}
          <span className="saved-tab-title" title={tab.title}>
            {tab.title}
          </span>
          {isActive ? <span className="current-tab-pill">Current tab</span> : null}
        </div>
        <span className="saved-tab-url" title={tab.url}>
          {tab.url}
        </span>
      </div>

      <div className="saved-tab-actions" onClick={(event) => event.stopPropagation()}>
        <span className="drag-handle drag-handle-tab" aria-hidden="true" title="Drag to reorder">
          <DragHandleIcon />
        </span>
        <button
          className="icon-button danger icon-only-button"
          onClick={() => onRemove(tab.id)}
          title="Delete saved tab"
          aria-label="Delete saved tab"
        >
          <DeleteIcon />
        </button>
      </div>
    </li>
  );
}

function NoteCard({ note, onSave, onDelete }) {
  const [titleDraft, setTitleDraft] = useState(note.title);
  const [bodyDraft, setBodyDraft] = useState(note.body);

  useEffect(() => {
    setTitleDraft(note.title);
    setBodyDraft(note.body);
  }, [note.id, note.title, note.body]);

  const hasChanges = titleDraft !== note.title || bodyDraft !== note.body;

  function saveNote() {
    if (!hasChanges) {
      return;
    }

    onSave(note.id, {
      title: titleDraft,
      body: bodyDraft,
    });
  }

  function handleTitleKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveNote();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      saveNote();
    }
  }

  function handleBodyKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveNote();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveNote();
    }
  }

  return (
    <article className="note-item">
      <div className="note-title-row">
        <input
          className="note-title-input"
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          onKeyDown={handleTitleKeyDown}
          placeholder="Note title"
          aria-label="Note title"
        />
        <button
          className="icon-button danger icon-only-button"
          onClick={() => onDelete(note.id)}
          title="Delete note"
          aria-label="Delete note"
        >
          <DeleteIcon />
        </button>
      </div>
      <textarea
        className="notes-input"
        value={bodyDraft}
        onChange={(event) => setBodyDraft(event.target.value)}
        onKeyDown={handleBodyKeyDown}
        placeholder="Add context, next steps, or reminders for this workspace."
      />
      <div className="note-actions">
        <p className="note-shortcuts">Enter or Ctrl+S to save. Shift+Enter adds a line.</p>
        <button className="secondary-button" onClick={saveNote} disabled={!hasChanges}>
          <span className="button-label">
            Save Note
            <SaveIcon />
          </span>
        </button>
      </div>
    </article>
  );
}

export default function ProjectDetails({
  project,
  onBack,
  onRename,
  onPinToggle,
  onDelete,
  onArchiveToggle,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onSaveCurrentTab,
  onSaveCurrentWindow,
  onAddSiteUrl,
  onRestoreProject,
  onMoveTab,
  onOpenSavedTab,
  onRemoveTab,
  activeSavedTabId,
  searchQuery,
  searchTabIds,
}) {
  const [siteUrlDraft, setSiteUrlDraft] = useState('');
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState(null);
  const [tabDropIndicator, setTabDropIndicator] = useState(null);
  const tabElementsRef = useRef(new Map());
  const siteUrlInputRef = useRef(null);

  function focusSiteUrlInput({ select = false } = {}) {
    const input = siteUrlInputRef.current;

    if (!input) {
      return;
    }

    input.focus({ preventScroll: true });

    if (select) {
      input.select();
    }
  }

  useEffect(() => {
    if (!project) {
      return;
    }

    focusSiteUrlInput({ select: true });
    const focusTimeoutIds = [50, 150, 300].map((delay) =>
      window.setTimeout(() => focusSiteUrlInput({ select: true }), delay),
    );

    return () => {
      focusTimeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [project?.id]);

  useEffect(() => {
    if (!project) {
      return undefined;
    }

    function handleSiteUrlShortcut(event) {
      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusSiteUrlInput({ select: true });
        return;
      }

      if (
        event.key.length === 1 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !isEditable
      ) {
        event.preventDefault();
        setSiteUrlDraft(event.key);
        focusSiteUrlInput();
      }
    }

    window.addEventListener('keydown', handleSiteUrlShortcut);

    return () => {
      window.removeEventListener('keydown', handleSiteUrlShortcut);
    };
  }, [project]);

  async function handleAddSite(event) {
    event.preventDefault();

    if (isAddingSite) {
      return;
    }

    setIsAddingSite(true);
    const didAddSite = await onAddSiteUrl(siteUrlDraft);
    setIsAddingSite(false);

    if (didAddSite) {
      setSiteUrlDraft('');
    }
  }

  function handleTabDragStart(tabId) {
    setDraggedTabId(tabId);
  }

  function handleTabDragEnd() {
    setDraggedTabId(null);
    setTabDropIndicator(null);
  }

  function handleTabDrop(targetTabId, placement) {
    if (!draggedTabId || draggedTabId === targetTabId || !placement) {
      handleTabDragEnd();
      return;
    }

    onMoveTab(draggedTabId, targetTabId, placement);
    handleTabDragEnd();
  }

  function registerTabElement(tabId, element) {
    if (element) {
      tabElementsRef.current.set(tabId, element);
      return;
    }

    tabElementsRef.current.delete(tabId);
  }

  useEffect(() => {
    if (!activeSavedTabId) {
      return;
    }

    const activeTabElement = tabElementsRef.current.get(activeSavedTabId);

    activeTabElement?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [activeSavedTabId, project?.tabs]);

  if (!project) {
    return (
      <section className="project-details empty-panel">
        <div className="empty-state">
          <h2>No project selected</h2>
          <p>Create a new project or select one from the list to manage saved workspaces.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="project-details">
      <button className="link-button back-button" onClick={onBack}>
        ← Projects
      </button>
      <div className="panel-header panel-header-tight">
        <div>
          <p className="eyebrow">{project.isArchived ? 'Archived project' : 'Active project'}</p>
          <h2>{project.name}</h2>
          <p className="project-size-meta">
            Estimated storage: {getFormattedJsonSize(project)}
          </p>
        </div>
        <div className="header-actions">
          <button
            className={`secondary-button icon-only-button ${project.isPinned ? 'is-toggled' : ''}`}
            onClick={onPinToggle}
            title={project.isPinned ? 'Unpin project' : 'Pin project'}
            aria-label={project.isPinned ? 'Unpin project' : 'Pin project'}
          >
            <PinIcon filled={project.isPinned} />
          </button>
          <button
            className="secondary-button icon-only-button"
            onClick={onRename}
            title="Rename project"
            aria-label="Rename project"
          >
            <EditIcon />
          </button>
          <button
            className="secondary-button icon-only-button"
            onClick={onArchiveToggle}
            title={project.isArchived ? 'Unarchive project' : 'Archive project'}
            aria-label={project.isArchived ? 'Unarchive project' : 'Archive project'}
          >
            <ArchiveIcon />
          </button>
          <button
            className="danger-button icon-only-button"
            onClick={onDelete}
            title="Delete project"
            aria-label="Delete project"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      <div className="toolbar">
        <button className="primary-button" onClick={onSaveCurrentTab}>
          <span className="button-label">
            Current Tab
            <SaveIcon />
          </span>
        </button>
        <button className="secondary-button" onClick={onSaveCurrentWindow}>
          <span className="button-label">
            Current Window
            <SaveIcon />
          </span>
        </button>
        <button className="secondary-button" onClick={onRestoreProject} disabled={!project.tabs.length}>
          <span className="button-label">
            Open All Tabs
            <RestoreIcon />
          </span>
        </button>
      </div>

      <div className="add-site-section">
        <form className="add-site-form" onSubmit={handleAddSite}>
          <input
            ref={siteUrlInputRef}
            className="add-site-input"
            type="text"
            autoFocus
            inputMode="url"
            autoComplete="url"
            value={siteUrlDraft}
            onChange={(event) => setSiteUrlDraft(event.target.value)}
            placeholder="Search or enter URL"
            aria-label="Site URL"
          />
          <button className="primary-button" type="submit" disabled={isAddingSite || !siteUrlDraft.trim()}>
            <span className="button-label">
              {isAddingSite ? 'Adding...' : 'Add Site'}
              <PlusIcon />
            </span>
          </button>
        </form>
      </div>

      <div className="content-stack">
        <section className="tabs-panel">
          <div className="section-header">
            <h3>Saved tabs</h3>
            <span className="count-pill">
              {searchQuery
                ? `${searchTabIds.size} matching ${searchTabIds.size === 1 ? 'tab' : 'tabs'}`
                : `${project.tabs.length} ${project.tabs.length === 1 ? 'tab' : 'tabs'}`}
            </span>
          </div>

          {project.tabs.length ? (
            <ul className="saved-tab-list">
              {project.tabs.map((tab) => (
                <TabRow
                  key={tab.id}
                  tab={tab}
                  draggedTabId={draggedTabId}
                  dropIndicator={tabDropIndicator}
                  isActive={tab.id === activeSavedTabId}
                  isSearchMatch={searchTabIds.has(tab.id)}
                  registerTabElement={registerTabElement}
                  onDragStart={handleTabDragStart}
                  onDragEnd={handleTabDragEnd}
                  onDropIndicatorChange={setTabDropIndicator}
                  onDropTab={handleTabDrop}
                  onOpen={onOpenSavedTab}
                  onRemove={onRemoveTab}
                />
              ))}
            </ul>
          ) : (
            <div className="empty-state compact">
              <p>No saved tabs yet. Use the save buttons above to capture your current workspace.</p>
            </div>
          )}
        </section>

        <section className="notes-panel">
          <div className="section-header">
            <h3>Notes</h3>
            <button className="secondary-button" onClick={onAddNote}>
              <span className="button-label">
                Add Note
                <PlusIcon />
              </span>
            </button>
          </div>
          {project.notes.length ? (
            <div className="note-list">
              {project.notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onSave={onUpdateNote}
                  onDelete={onDeleteNote}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <p>No notes yet. Add a note to capture context for this project.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
