export interface Disposable {
  dispose(): Promise<void> | void;
}

export const CONFIG_DIR = Symbol("ConfigDir");
export const SETTINGS = Symbol("Settings");
