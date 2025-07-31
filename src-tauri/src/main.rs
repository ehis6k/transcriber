// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Migration, MigrationKind, SqlitePool};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "Create initial tables",
            sql: "CREATE TABLE IF NOT EXISTS transcriptions (
                id TEXT PRIMARY KEY,
                audio_file_id TEXT NOT NULL,
                text TEXT NOT NULL,
                language TEXT NOT NULL,
                model_used TEXT NOT NULL,
                duration REAL NOT NULL,
                confidence REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS summaries (
                id TEXT PRIMARY KEY,
                transcription_id TEXT NOT NULL,
                summary TEXT NOT NULL,
                language TEXT NOT NULL,
                model_used TEXT NOT NULL,
                original_length INTEGER NOT NULL,
                summary_length INTEGER NOT NULL,
                compression_ratio REAL NOT NULL,
                processing_time INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transcription_id) REFERENCES transcriptions(id)
            );
            
            CREATE TABLE IF NOT EXISTS user_preferences (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at);
            CREATE INDEX IF NOT EXISTS idx_transcriptions_language ON transcriptions(language);
            CREATE INDEX IF NOT EXISTS idx_summaries_transcription_id ON summaries(transcription_id);",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::init_with_migrations(
            "sqlite:transcription_history.db",
            migrations,
        ))
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}