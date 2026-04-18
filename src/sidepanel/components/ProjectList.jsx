import { ExportIcon, ImportIcon } from './Icons.jsx';
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
  onToggleArchivedView,
}) {
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
        <div className="project-items">
          {projects.map((project) => (
            <button
              key={project.id}
              className={`project-item ${project.id === selectedProjectId ? 'is-active' : ''} ${
                project.id === activeProjectId ? 'has-current-tab' : ''
              }`}
              onClick={() => onSelect(project.id)}
            >
              <span className="project-title-row">
                <span className="project-name">{project.name}</span>
                {project.id === activeProjectId ? (
                  <span className="current-project-pill">Current tab</span>
                ) : null}
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
          ))}
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
