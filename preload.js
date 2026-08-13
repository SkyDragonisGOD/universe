const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listProjects: () => ipcRenderer.invoke('list-projects'),
  createProject: (name) => ipcRenderer.invoke('create-project', name),
  openProject: (projectId) => ipcRenderer.invoke('open-project', projectId),
  saveProject: (projectId, data) => ipcRenderer.invoke('save-project', projectId, data),
  deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),
  exportProject: (projectId) => ipcRenderer.invoke('export-project', projectId),
  importProject: () => ipcRenderer.invoke('import-project'),
  renameProject: (projectId, newName) => ipcRenderer.invoke('rename-project', projectId, newName),

  getLLMConfig: () => ipcRenderer.invoke('get-llm-config'),
  setLLMConfig: (config) => ipcRenderer.invoke('set-llm-config', config),

  aiGenerate: (messages) => ipcRenderer.invoke('ai-generate', messages),
  aiGenerateStream: (messages) => ipcRenderer.invoke('ai-generate-stream', messages),

  aiGenerateSynopsis: (data) => ipcRenderer.invoke('ai-generate-synopsis', data),
  aiGenerateWorldview: (data) => ipcRenderer.invoke('ai-generate-worldview', data),
  aiSuggestDimensions: (data) => ipcRenderer.invoke('ai-suggest-dimensions', data),
  aiGenerateLocation: (data) => ipcRenderer.invoke('ai-generate-location', data),
  aiGenerateCharacter: (data) => ipcRenderer.invoke('ai-generate-character', data),
  aiGenerateFaction: (data) => ipcRenderer.invoke('ai-generate-faction', data),
  aiGenerateItem: (data) => ipcRenderer.invoke('ai-generate-item', data),
  aiGenerateTimelineEvents: (data) => ipcRenderer.invoke('ai-generate-timeline-events', data),
  aiGeneratePowerSystem: (data) => ipcRenderer.invoke('ai-generate-power-system', data),
  aiSuggestRules: (data) => ipcRenderer.invoke('ai-suggest-rules', data),
  aiConsistencyCheck: (data) => ipcRenderer.invoke('ai-consistency-check', data),
  aiGenerateRelations: (data) => ipcRenderer.invoke('ai-generate-relations', data),
  aiGenerateConstitution: (data) => ipcRenderer.invoke('ai-generate-constitution', data),
  aiGenerateOutline: (data) => ipcRenderer.invoke('ai-generate-outline', data),

  exportProjectZip: (projectId) => ipcRenderer.invoke('export-project-zip', projectId),
  importProjectZip: () => ipcRenderer.invoke('import-project-zip'),

  listBackups: (projectId) => ipcRenderer.invoke('list-backups', projectId),
  createBackup: (projectId, data) => ipcRenderer.invoke('create-backup', projectId, data),
  restoreBackup: (backupId, projectId) => ipcRenderer.invoke('restore-backup', backupId, projectId),
  deleteBackup: (backupId) => ipcRenderer.invoke('delete-backup', backupId),

  onAiStreamChunk: (callback) => { const handler = (_, chunk) => callback(chunk); ipcRenderer.on('ai-stream-chunk', handler); return () => ipcRenderer.removeListener('ai-stream-chunk', handler); },
  onAiStreamDone: (callback) => { const handler = () => callback(); ipcRenderer.on('ai-stream-done', handler); return () => ipcRenderer.removeListener('ai-stream-done', handler); },
  onAiStreamError: (callback) => { const handler = (_, err) => callback(err); ipcRenderer.on('ai-stream-error', handler); return () => ipcRenderer.removeListener('ai-stream-error', handler); }
});