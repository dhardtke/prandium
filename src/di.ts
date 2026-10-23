import { Container } from "@needle-di/core";

export const container = new Container();

export const CONFIG_DIR = Symbol.for("ConfigDir");
export const SETTINGS = Symbol.for("Settings");
