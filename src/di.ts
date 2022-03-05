export interface Disposable {
  dispose(): Promise<void> | void;
}

export const CONFIG_DIR = Symbol.for("ConfigDir");
export const SETTINGS = Symbol.for("Settings");
