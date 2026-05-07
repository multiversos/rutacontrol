"use client";

import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { useEffect } from "react";

const MOBILE_ROOT_PATH = "/mobile";
const STATUS_BAR_COLOR = "#0F4A73";

function getMobileBackFallback(pathname: string) {
  if (pathname.startsWith("/mobile/register/expenses")) {
    return "/mobile/register";
  }

  if (pathname.startsWith("/mobile/register/debts")) {
    return "/mobile/register";
  }

  if (pathname.startsWith("/mobile/buses/")) {
    return "/mobile/buses";
  }

  return MOBILE_ROOT_PATH;
}

export function CapacitorSetup() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const root = document.documentElement;
    root.classList.add("native-capacitor");

    let listeners: PluginListenerHandle[] = [];
    let disposed = false;

    const setKeyboardOffset = (height: number) => {
      root.style.setProperty("--keyboard-offset", `${height}px`);
      root.classList.toggle("keyboard-open", height > 0);
    };

    const scrollFocusedElementIntoView = () => {
      const activeElement = document.activeElement;

      if (!(activeElement instanceof HTMLElement)) {
        return;
      }

      window.setTimeout(() => {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 90);
    };

    void (async () => {
      const [{ App }, { Keyboard, KeyboardResize }, { StatusBar, Style }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/keyboard"),
        import("@capacitor/status-bar"),
      ]);

      if (disposed) {
        return;
      }

      await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
      await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);
      await StatusBar.setBackgroundColor({ color: STATUS_BAR_COLOR }).catch(
        () => undefined,
      );
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(
        () => undefined,
      );

      listeners = [
        await Keyboard.addListener("keyboardWillShow", (event) => {
          setKeyboardOffset(event.keyboardHeight);
          scrollFocusedElementIntoView();
        }),
        await Keyboard.addListener("keyboardDidShow", scrollFocusedElementIntoView),
        await Keyboard.addListener("keyboardDidHide", () => {
          setKeyboardOffset(0);
        }),
        await App.addListener("backButton", async (event) => {
          const { pathname, search } = window.location;
          const isMobileLogin =
            pathname === "/login" &&
            new URLSearchParams(search).get("redirectTo")?.startsWith(MOBILE_ROOT_PATH);

          if (pathname.startsWith(MOBILE_ROOT_PATH) && pathname !== MOBILE_ROOT_PATH) {
            if (event.canGoBack) {
              window.history.back();
              return;
            }

            window.location.assign(getMobileBackFallback(pathname));
            return;
          }

          if (pathname === MOBILE_ROOT_PATH || isMobileLogin) {
            await App.minimizeApp().catch(() => App.exitApp());
            return;
          }

          if (event.canGoBack) {
            window.history.back();
            return;
          }

          await App.minimizeApp().catch(() => App.exitApp());
        }),
      ];
    })();

    return () => {
      disposed = true;
      root.classList.remove("keyboard-open", "native-capacitor");
      root.style.removeProperty("--keyboard-offset");
      listeners.forEach((listener) => {
        void listener.remove();
      });
    };
  }, []);

  return null;
}
