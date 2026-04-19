import { useMemo, useState } from 'react';
import { ExportIcon, ImportIcon, PinIcon } from './Icons.jsx';
import { getFormattedJsonSize } from '../../lib/utils.js';

export default function ProjectList({
  projects,
  selectedProjectId,
  showArchived,
  searchQuery,
  searchResultCount,
  isSearching,
  searchInputRef,
  activeProjectId,
  onSearchChange,
  onClearSearch,
  onSelect,
  onCreateProject,
  onExport,
  onImport,
  onPinToggle,
  onMoveProject,
  onToggleArchivedView,
}) {
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [dropTargetProjectId, setDropTargetProjectId] = useState(null);

  const pinnedProjects = useMemo(
    () => projects.filter((project) => project.isPinned),
    [projects],
  );
  const otherProjects = useMemo(
    () => projects.filter((project) => !project.isPinned),
    [projects],
  );

  function handleDragStart(projectId) {
    if (isSearching) {
      return;
    }

    setDraggedProjectId(projectId);
    setDropTargetProjectId(projectId);
  }

  function handleDragEnd() {
    setDraggedProjectId(null);
    setDropTargetProjectId(null);
  }

  function handleDrop(targetProjectId) {
    if (!draggedProjectId || draggedProjectId === targetProjectId) {
      handleDragEnd();
      return;
    }

    onMoveProject(draggedProjectId, targetProjectId);
    handleDragEnd();
  }

  return (
    <aside className="project-list">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h1>Workspace Organizer</h1>
        </div>
        <button className="secondary-button" onClick={onCreateProject}>
          New project
        </button>
      </div>

      <div className="search-box">
        <input
          ref={searchInputRef}
          className="search-input"
          type="search"
          autoFocus
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects, tabs, URLs..."
          aria-label="Search projects and saved tabs"
        />
        <span className="search-shortcut">/</span>
      </div>

      <div className="project-list-tools">
        <button className="link-button" onClick={onToggleArchivedView} disabled={isSearching}>
          {showArchived ? 'Show active projects' : 'Show archived projects'}
        </button>
        {isSearching ? (
          <button className="link-button" onClick={onClearSearch}>
            Clear search
          </button>
        ) : null}
        <div className="global-data-actions">
          <button className="secondary-button" onClick={onExport}>
            <span className="button-label">
              Export All
              <ExportIcon />
            </span>
          </button>
          <label className="secondary-button file-button">
            <span className="button-label">
              Import JSON
              <ImportIcon />
            </span>
            <input type="file" accept="application/json" onChange={onImport} />
          </label>
        </div>
      </div>

      {isSearching ? (
        <p className="search-summary">
          {searchResultCount} matching {searchResultCount === 1 ? 'project' : 'projects'}
        </p>
      ) : null}

      {projects.length ? (
        <div className="project-list-sections">
          <ProjectSection
            title="Pinned"
            projects={pinnedProjects}
            draggedProjectId={draggedProjectId}
            dropTargetProjectId={dropTargetProjectId}
            selectedProjectId={selectedProjectId}
            activeProjectId={activeProjectId}
            isSearching={isSearching}
            onSelect={onSelect}
            onPinToggle={onPinToggle}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragEnter={setDropTargetProjectId}
            onDrop={handleDrop}
          />
          <ProjectSection
            title={pinnedProjects.length ? 'Other projects' : 'Projects'}
            projects={otherProjects}
            draggedProjectId={draggedProjectId}
            dropTargetProjectId={dropTargetProjectId}
            selectedProjectId={selectedProjectId}
            activeProjectId={activeProjectId}
            isSearching={isSearching}
            onSelect={onSelect}
            onPinToggle={onPinToggle}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragEnter={setDropTargetProjectId}
            onDrop={handleDrop}
          />
        </div>
      ) : (
        <div className="empty-state compact">
          <p>
            {isSearching
              ? 'No projects, notes, tab titles, or URLs matched that search.'
              : showArchived
                ? 'No archived projects yet.'
                : 'Create a project to start saving tabs.'}
          </p>
        </div>
      )}
    </aside>
  );
}

function ProjectSection({
  title,
  projects,
  draggedProjectId,
  dropTargetProjectId,
  selectedProjectId,
  activeProjectId,
  isSearching,
  onSelect,
  onPinToggle,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDrop,
}) {
  if (!projects.length) {
    return null;
  }

  return (
    <section className="project-section">
      <div className="project-section-header">
        <h2 className="project-section-title">{title}</h2>
        {!isSearching ? <span className="count-pill">{projects.length}</span> : null}
      </div>
      <div className="project-items">
        {projects.map((project) => (
          <article
            key={project.id}
            className={`project-card ${project.id === draggedProjectId ? 'is-dragging' : ''} ${
              project.id === dropTargetProjectId && project.id !== draggedProjectId ? 'is-drop-target' : ''
            }`}
            draggable={!isSearching}
            onDragStart={() => onDragStart(project.id)}
            onDragEnd={onDragEnd}
            onDragOver={(event) => {
              if (draggedProjectId === project.id) {
                return;
              }

              event.preventDefault();
            }}
            onDragEnter={() => {
              if (draggedProjectId && draggedProjectId !== project.id) {
                onDragEnter(project.id);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              onDrop(project.id);
            }}
          >
            <button
              className={`project-item ${project.id === selectedProjectId ? 'is-active' : ''} ${
                project.id === activeProjectId ? 'has-current-tab' : ''
              }`}
              onClick={() => onSelect(project.id)}
            >
              <span className="project-title-row">
                <span className="project-name">{project.name}</span>
                <span className="project-badges">
                  {project.isPinned ? <span className="pin-pill">Pinned</span> : null}
                  {project.id === activeProjectId ? (
                    <span className="current-project-pill">Current tab</span>
                  ) : null}
                </span>
              </span>
              <span className="project-meta">
                {project.tabs.length} saved {project.tabs.length === 1 ? 'tab' : 'tabs'}
                <span aria-hidden="true"> · </span>
                {getFormattedJsonSize(project)}
              </span>
              {project.searchMatches?.length ? (
                <span className="project-search-meta">
                  Matched {project.searchMatches.join(', ')}
                </span>
              ) : null}
            </button>
            <div className="project-item-actions">
              <button
                className={`icon-button icon-only-button ${project.isPinned ? 'is-toggled' : ''}`}
                onClick={() => onPinToggle(project)}
                title={project.isPinned ? 'Unpin project' : 'Pin project'}
                aria-label={project.isPinned ? 'Unpin project' : 'Pin project'}
              >
                <PinIcon filled={project.isPinned} />
              </button>
              {!isSearching ? <span className="drag-hint" aria-hidden="true">Drag</span> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
