import { useEffect, useState } from 'react';
import {
  ArchiveIcon,
  DeleteIcon,
  EditIcon,
  ExportIcon,
  ImportIcon,
  PlusIcon,
  RestoreIcon,
  SaveIcon,
} from './Icons.jsx';
import { getFormattedJsonSize } from '../../lib/utils.js';

function splitForMiddleEllipsis(text) {
  const value = text || '';
  const midpoint = Math.ceil(value.length / 2);

  return {
    start: value.slice(0, midpoint),
    end: value.slice(midpoint),
  };
}

function MiddleEllipsisText({ text, className = '' }) {
  const { start, end } = splitForMiddleEllipsis(text);

  return (
    <span className={`middle-ellipsis ${className}`} title={text}>
      <span className="middle-ellipsis-start">{start}</span>
      <span className="middle-ellipsis-dots">...</span>
      <span className="middle-ellipsis-end">{end}</span>
    </span>
  );
}

function TabRow({ tab, index, total, isActive, isSearchMatch, onMove, onOpen, onRemove }) {
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
      className={`saved-tab-item ${isActive ? 'is-current-tab' : ''} ${isSearchMatch ? 'is-search-match' : ''}`}
      onClick={openSavedTab}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      title={`Open ${tab.title}`}
    >
      <div className="saved-tab-main">
        <div className="saved-tab-title-row">
          {tab.favIconUrl ? <img className="favicon" src={tab.favIconUrl} alt="" /> : <span className="favicon fallback" />}
          <MiddleEllipsisText text={tab.title} className="saved-tab-title" />
          {isActive ? <span className="current-tab-pill">Current tab</span> : null}
        </div>
        <MiddleEllipsisText text={tab.url} className="saved-tab-url" />
      </div>

      <div className="saved-tab-actions" onClick={(event) => event.stopPropagation()}>
        <button
          className="icon-button"
          onClick={() => onMove(tab.id, 'up')}
          disabled={index === 0}
          title="Move up"
        >
          ↑
        </button>
        <button
          className="icon-button"
          onClick={() => onMove(tab.id, 'down')}
          disabled={index === total - 1}
          title="Move down"
        >
          ↓
        </button>
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
    onSave(note.id, {
      title: titleDraft,
      body: bodyDraft,
    });
  }

  return (
    <article className="note-item">
      <div className="note-title-row">
        <input
          className="note-title-input"
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
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
        placeholder="Add context, next steps, or reminders for this workspace."
      />
      <div className="note-actions">
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
  onDelete,
  onArchiveToggle,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onSaveCurrentTab,
  onSaveCurrentWindow,
  onRestoreProject,
  onExport,
  onImport,
  onMoveTab,
  onOpenSavedTab,
  onRemoveTab,
  activeSavedTabId,
  searchQuery,
  searchTabIds,
}) {
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
            Project
            <RestoreIcon />
          </span>
        </button>
        <button className="secondary-button" onClick={onExport}>
          <span className="button-label">
            JSON
            <ExportIcon />
          </span>
        </button>
        <label className="secondary-button file-button">
          <span className="button-label">
            JSON
            <ImportIcon />
          </span>
          <input type="file" accept="application/json" onChange={onImport} />
        </label>
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
              {project.tabs.map((tab, index) => (
                <TabRow
                  key={tab.id}
                  tab={tab}
                  index={index}
                  total={project.tabs.length}
                  isActive={tab.id === activeSavedTabId}
                  isSearchMatch={searchTabIds.has(tab.id)}
                  onMove={onMoveTab}
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
