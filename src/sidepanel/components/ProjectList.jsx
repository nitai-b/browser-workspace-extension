export default function ProjectList({
  projects,
  selectedProjectId,
  showArchived,
  searchQuery,
  searchResultCount,
  isSearching,
  searchInputRef,
  onSearchChange,
  onClearSearch,
  onSelect,
  onCreateProject,
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
              className={`project-item ${project.id === selectedProjectId ? 'is-active' : ''}`}
              onClick={() => onSelect(project.id)}
            >
              <span className="project-name">{project.name}</span>
              <span className="project-meta">
                {project.tabs.length} saved {project.tabs.length === 1 ? 'tab' : 'tabs'}
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
