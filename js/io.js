import { exportState, importState } from './state.js';

export function initIO() {
  document.getElementById('btn-export').addEventListener('click', doExport);
  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });
  document.getElementById('file-input').addEventListener('change', doImport);
}

function doExport() {
  const data = exportState();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `braindump-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function doImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.items || !data.canvasNodes) {
        alert('Ugyldig braindump-fil: mangler items eller canvasNodes');
        return;
      }
      importState(data);
    } catch (err) {
      alert('Kunne ikke læse JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}
