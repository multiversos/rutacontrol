import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const DEFAULT_SERVER_URL = "https://rutacontrol.vercel.app/mobile";
const STATUS_BAR_COLOR = "#0F4A73";

const configuredServerUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || DEFAULT_SERVER_URL;
const normalizedServerUrl = new URL(configuredServerUrl);
const serverStartPath =
  normalizedServerUrl.pathname === "/" ? "/mobile" : normalizedServerUrl.pathname;
const serverAppStartPath = `${serverStartPath}${normalizedServerUrl.search}`;

const config: CapacitorConfig = {
  appId: "com.multiversos.rutacontrol",
  appName: "RutaControl",
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    StatusBar: {
      backgroundColor: STATUS_BAR_COLOR,
      overlaysWebView: false,
      style: "DARK",
    },
  },
  server: {
    allowNavigation: [normalizedServerUrl.hostname],
    appStartPath: serverAppStartPath,
    cleartext: normalizedServerUrl.protocol === "http:",
    errorPath: "index.html",
    url: normalizedServerUrl.origin,
  },
  webDir: "capacitor-shell",
};

export default config;
