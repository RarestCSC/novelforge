import { invoke } from '@tauri-apps/api/core';

export type DesktopState = {
  novel: unknown;
  people: unknown[];
  world: unknown[];
  prelude: string;
  outline: string;
};

export async function isDesktopRuntime(): Promise<boolean> {
  try {
    await invoke('workspace_path');
    return true;
  } catch {
    return false;
  }
}

export async function loadDesktopState(): Promise<DesktopState | null> {
  try {
    return await invoke<DesktopState | null>('load_workspace');
  } catch {
    return null;
  }
}

export async function saveDesktopState(state: DesktopState): Promise<void> {
  try {
    await invoke('save_workspace', { state });
  } catch {
    // Browser preview continues to use localStorage.
  }
}

export async function exportNovelFile(title: string, content: string): Promise<string | null> {
  try {
    return await invoke<string>('export_novel', { title, content });
  } catch {
    return null;
  }
}

export async function backupWorkspace(): Promise<string | null> {
  try {
    return await invoke<string>('backup_workspace');
  } catch {
    return null;
  }
}
