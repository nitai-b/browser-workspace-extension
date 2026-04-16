function TabRow({ tab, index, total, onMove, onRemove }) {
  return (
    <li className="saved-tab-item">
      <div className="saved-tab-main">
        <div className="saved-tab-title-row">
          {tab.favIconUrl ? <img className="favicon" src={tab.favIconUrl} alt="" /> : <span className="favicon fallback" />}
          <a className="saved-tab-title" href={tab.url} target="_blank" rel="noreferrer">
            {tab.title}
          </a>
        </div>
        <p className="saved-tab-url">{tab.url}</p>
      </div>

      <div className="saved-tab-actions">
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
        <button className="icon-button danger" onClick={() => onRemove(tab.id)} title="Remove tab">
          Remove
        </button>
      </div>
    </li>
  );
}

export default function ProjectDetails({
  project,
  notesDraft,
  onRename,
  onDelete,
  onArchiveToggle,
  onNotesChange,
  onSaveNotes,
  onSaveCurrentTab,
  onSaveCurrentWindow,
  onRestoreProject,
  onExport,
  onImport,
  onMoveTab,
  onRemoveTab,
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
      <div className="panel-header panel-header-tight">
        <div>
          <p className="eyebrow">{project.isArchived ? 'Archived project' : 'Active project'}</p>
          <h2>{project.name}</h2>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={onRename}>
            Rename
          </button>
          <button className="secondary-button" onClick={onArchiveToggle}>
            {project.isArchived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="danger-button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="toolbar">
        <button className="primary-button" onClick={onSaveCurrentTab}>
          Save current tab
        </button>
        <button className="secondary-button" onClick={onSaveCurrentWindow}>
          Save current window
        </button>
        <button className="secondary-button" onClick={onRestoreProject} disabled={!project.tabs.length}>
          Restore project
        </button>
        <button className="secondary-button" onClick={onExport}>
          Export JSON
        </button>
        <label className="secondary-button file-button">
          Import JSON
          <input type="file" accept="application/json" onChange={onImport} />
        </label>
      </div>

      <div className="content-grid">
        <section className="notes-panel">
          <div className="section-header">
            <h3>Notes</h3>
            <button className="secondary-button" onClick={onSaveNotes}>
              Save notes
            </button>
          </div>
          <textarea
            className="notes-input"
            value={notesDraft}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Add context, next steps, or reminders for this workspace."
          />
        </section>

        <section className="tabs-panel">
          <div className="section-header">
            <h3>Saved tabs</h3>
            <span className="count-pill">
              {project.tabs.length} {project.tabs.length === 1 ? 'tab' : 'tabs'}
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
                  onMove={onMoveTab}
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
      </div>
    </section>
  );
}
