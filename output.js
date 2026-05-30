// File System Access output for matte: a persistent "save recordings here"
// folder. Owns the directory handle (single source of truth); main.js mirrors
// the name into a Tweakpane-bound display object. Imported by main.js.

export const HAS_FS_ACCESS = typeof window.showDirectoryPicker === 'function';

let outputDirHandle = null;
export function getOutputDir() { return outputDirHandle; }
export function setOutputDir(h) { outputDirHandle = h; }
export function outputDirName() { return outputDirHandle?.name || 'browser default'; }

async function getOutputDirHandleWithPermission() {
  if (!outputDirHandle) return null;
  try {
    let perm = await outputDirHandle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') perm = await outputDirHandle.requestPermission({ mode: 'readwrite' });
    return perm === 'granted' ? outputDirHandle : null;
  } catch { return null; }
}
async function saveBlobToOutputFolder(blob, filename) {
  const dir = await getOutputDirHandleWithPermission();
  if (!dir) return false;
  try {
    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (e) {
    console.error('[output folder save]', e);
    return false;
  }
}
