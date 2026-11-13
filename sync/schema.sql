-- Aula Personal: almacén privado de sincronización (D1)
-- No ejecutar sobre una base de datos existente sin revisar el esquema.
CREATE TABLE IF NOT EXISTS sync_objects (
  owner_id TEXT NOT NULL,
  object_key TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (owner_id, object_key)
);
CREATE INDEX IF NOT EXISTS sync_objects_owner_updated ON sync_objects(owner_id, updated_at);
