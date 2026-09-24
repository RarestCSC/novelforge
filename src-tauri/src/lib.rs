#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
struct WorkspaceState {
    novel: serde_json::Value,
    people: Vec<serde_json::Value>,
    world: Vec<serde_json::Value>,
    prelude: String,
    outline: String,
}

#[tauri::command]
fn load_workspace(app: AppHandle) -> Result<Option<WorkspaceState>, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = dir.join("workspace.json");
    if !path.exists() { return Ok(None); }
    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_workspace(app: AppHandle, state: WorkspaceState) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let raw = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;
    fs::write(dir.join("workspace.json"), raw).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_novel(app: AppHandle, title: String, content: String) -> Result<String, String> {
    let dir = app.path().download_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let safe = title.chars().map(|c| if ['/', '\\', ':', '*', '?', '"', '<', '>', '|'].contains(&c) { '_' } else { c }).collect::<String>();
    let path = dir.join(format!("{}.md", if safe.is_empty() { "novel" } else { &safe }));
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![load_workspace, save_workspace, export_novel])
        .run(tauri::generate_context!())
        .expect("error while running NovelForge");
}
