#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
struct WorkspaceState {
    novel: serde_json::Value,
    people: Vec<serde_json::Value>,
    world: Vec<serde_json::Value>,
    prelude: String,
    outline: String,
}

fn workspace_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map_err(|e| e.to_string())
}

fn workspace_file(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(workspace_dir(app)?.join("workspace.json"))
}

#[tauri::command]
fn workspace_path(app: AppHandle) -> Result<String, String> {
    Ok(workspace_dir(&app)?.to_string_lossy().to_string())
}

#[tauri::command]
fn load_workspace(app: AppHandle) -> Result<Option<WorkspaceState>, String> {
    let path = workspace_file(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_workspace(app: AppHandle, state: WorkspaceState) -> Result<(), String> {
    let dir = workspace_dir(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let raw = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;
    let temp = dir.join("workspace.json.tmp");
    fs::write(&temp, raw).map_err(|e| e.to_string())?;
    fs::rename(&temp, dir.join("workspace.json")).map_err(|e| e.to_string())
}

#[tauri::command]
fn backup_workspace(app: AppHandle) -> Result<String, String> {
    let source = workspace_file(&app)?;
    if !source.exists() {
        return Err("当前还没有可备份的工作区".to_string());
    }
    let backup_dir = app.path().download_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
    let target = backup_dir.join("novelforge-workspace-backup.json");
    fs::copy(&source, &target).map_err(|e| e.to_string())?;
    Ok(target.to_string_lossy().to_string())
}

#[tauri::command]
fn export_novel(app: AppHandle, title: String, content: String) -> Result<String, String> {
    let dir = app.path().download_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let safe = title
        .chars()
        .map(|c| if ['/', '\\', ':', '*', '?', '"', '<', '>', '|'].contains(&c) { '_' } else { c })
        .collect::<String>();
    let file_name = if safe.is_empty() { "novel" } else { &safe };
    let path = dir.join(format!("{file_name}.md"));
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            workspace_path,
            load_workspace,
            save_workspace,
            backup_workspace,
            export_novel
        ])
        .run(tauri::generate_context!())
        .expect("error while running NovelForge");
}
