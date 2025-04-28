/*
 * noVNC: HTML5 VNC client
 * Copyright (C) 2019 The noVNC authors
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for usage and integration instructions.
 *
 * Browser feature support detection
 */

import * as Log from './logging.js';
import Base64 from '../base64.js';

// --- SSR/Build-Safe Flags ---
let _isTouchDevice = false;
let _dragThreshold = 10;
let _supportsCursorURIs = false;
let _hasScrollbarGutter = true; // Default assumption
let _supportsWebCodecsH264Decode = false;
let _isMacOs = false;
let _isWindowsOs = false;
let _isIOSOs = false;
let _isAndroidOs = false;
let _isChromeOSOs = false;
let _isSafariBrowser = false;
let _isFirefoxBrowser = false;
let _isChromeBrowser = false;
let _isChromiumBrowser = false;
let _isOperaBrowser = false;
let _isEdgeBrowser = false;
let _isGeckoEngine = false;
let _isWebKitEngine = false;
let _isBlinkEngine = false;

// --- Client-Side Detection Logic ---
if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof navigator !== 'undefined') {
    // Touch detection
    _isTouchDevice = ('ontouchstart' in document.documentElement) ||
                    // required for Chrome debugger
                    (document.ontouchstart !== undefined) ||
                    // required for MS Surface
                    (navigator.maxTouchPoints > 0) ||
                    (navigator.msMaxTouchPoints > 0);

    window.addEventListener('touchstart', function onFirstTouch() {
        _isTouchDevice = true; // Update flag
        window.removeEventListener('touchstart', onFirstTouch, false);
    }, false);

    // Drag threshold
    _dragThreshold = 10 * (window.devicePixelRatio || 1);

    // Cursor URIs support
    try {
        const target = document.createElement('canvas');
        target.style.cursor = 'url("data:image/x-icon;base64,AAACAAEACAgAAAIAAgA4AQAAFgAAACgAAAAIAAAAEAAAAAEAIAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAA==\") 2 2, default';

        if (target.style.cursor.indexOf("url") === 0) {
            Log.Info("Data URI scheme cursor supported");
            _supportsCursorURIs = true;
        } else {
            Log.Warn("Data URI scheme cursor not supported");
        }
    } catch (exc) {
        Log.Error("Data URI scheme cursor test exception: " + exc);
    }

    // Scrollbar gutter detection
    _hasScrollbarGutter = true; // Assume true initially
    try {
        const container = document.createElement('div');
        container.style.visibility = 'hidden';
        container.style.width = '100px'; // Ensure it's not zero width
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.overflow = 'scroll'; // Force scrollbars
        document.body.appendChild(container);

        const child = document.createElement('div');
        child.style.width = '100%'; // Make child adapt to container width
        container.appendChild(child);

        // offsetWidth includes padding and borders, clientWidth includes padding but not borders or scrollbars
        // If offsetWidth > clientWidth, scrollbars are taking up space.
        // Using clientWidth as it's generally more reliable for this purpose.
        const scrollbarWidth = container.offsetWidth - container.clientWidth;

        document.body.removeChild(container);

        _hasScrollbarGutter = scrollbarWidth > 0;
        if (!_hasScrollbarGutter) {
            Log.Info("Scrollbar test indicates no gutter");
        } else {
            Log.Info("Scrollbar test indicates gutter present");
        }
    } catch (exc) {
        Log.Error("Scrollbar test exception: " + exc);
        _hasScrollbarGutter = true; // Fallback to assuming gutter if test fails
    }

    // Platform/Browser/Engine Detection
    const platform = navigator.platform || "";
    const userAgent = navigator.userAgent || "";

    /* OS */
    _isMacOs = !!(/mac/i).exec(platform);
    _isWindowsOs = !!(/win/i).exec(platform);
    _isIOSOs = (!!(/ipad/i).exec(platform) ||
               !!(/iphone/i).exec(platform) ||
               !!(/ipod/i).exec(platform));
    /* Android sets navigator.platform to Linux :/ */
    _isAndroidOs = !!userAgent.match('Android ');
    /* ChromeOS sets navigator.platform to Linux :/ */
    _isChromeOSOs = !!userAgent.match(' CrOS ');

    /* Browser */
    _isSafariBrowser = !!userAgent.match('Safari/...') &&
                       !userAgent.match('Chrome/...') &&
                       !userAgent.match('Chromium/...') &&
                       !userAgent.match('Epiphany/...') &&
                       !userAgent.match('Edg/...') && // Exclude Edge which might mimic Safari
                       !userAgent.match('OPR/...'); // Exclude Opera which might mimic Safari
    _isFirefoxBrowser = !!userAgent.match('Firefox/...') &&
                        !userAgent.match('Seamonkey/...');
    _isChromeBrowser = !!userAgent.match('Chrome/...') &&
                       !userAgent.match('Chromium/...') &&
                       !userAgent.match('Edg/...') &&
                       !userAgent.match('OPR/...');
    _isChromiumBrowser = !!userAgent.match('Chromium/...') &&
                         !userAgent.match('Edg/...'); // Exclude Edge which is based on Chromium
    _isOperaBrowser = !!userAgent.match('OPR/...');
    _isEdgeBrowser = !!userAgent.match('Edg/...');

    /* Engine */
    _isGeckoEngine = !!userAgent.match('Gecko/...') && !userAgent.match('like Gecko'); // Ensure it's Gecko, not pretending
    _isWebKitEngine = !!userAgent.match('AppleWebKit/...') &&
                      !userAgent.match('Chrome/...') && // Exclude Blink-based browsers
                      !userAgent.match('Edg/...');
    _isBlinkEngine = !!userAgent.match('Chrome/...') &&
                     !userAgent.match('OPR/...') && // Sometimes Opera includes Chrome string
                     !userAgent.match('Edg/...');   // Edge uses Blink but has its own identifier


    // --- Asynchronous Checks (WebCodecs) ---
    // Run this check only on the client-side
    async function _checkWebCodecsH264DecodeSupport() {
        if (!('VideoDecoder' in window)) {
            return false;
        }

        // We'll need to make do with some placeholders here
        const config = {
            codec: 'avc1.42401f',
            codedWidth: 1920,
            codedHeight: 1080,
            optimizeForLatency: true,
        };

        try {
            let support = await VideoDecoder.isConfigSupported(config);
            if (!support.supported) {
                return false;
            }

            // Firefox H.264 support check (Bugzilla 1932392, 1932566, 1932579)
            const data = new Uint8Array(Base64.decode(
                'AAAAAWdCwBTZnpuAgICgAAADACAAAAZB4oVNAAAAAWjJYyyAAAABBgX//4Hc' +
                'Rem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTY0IHIzMTA4IDMxZTE5Zjkg' +
                'LSBILjI2NC9NUEVHLTQgQVZDIGNvZGVjIC0gQ29weWxlZnQgMjAwMy0yMDIz' +
                'IC0gaHR0cDovL3d3dy52aWRlb2xhbi5vcmcveDI2NC5odG1sIC0gb3B0aW9u' +
                'czogY2FiYWM9MCByZWY9NSBkZWJsb2NrPTE6MDowIGFuYWx5c2U9MHgxOjB4' +
                'MTExIG1lPWhleCBzdWJtZT04IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4' +
                'ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0yIDh4' +
                'OGRjdD0wIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJv' +
                'bWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0x' +
                'IHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9' +
                'MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVz' +
                'PTAgd2VpZ2h0cD0wIGtleWludD1pbmZpbml0ZSBrZXlpbnRfbWluPTI1IHNj' +
                'ZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NTAgcmM9' +
                'YWJyIG1idHJlZT0xIGJpdHJhdGU9NDAwIHJhdGV0b2w9MS4wIHFjb21wPTAu' +
                'NjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFx' +
                'PTE6MS4wMACAAAABZYiEBrxmKAAPVccAAS044AA5DRJMnkycJk4TPw=='));

            let gotframe = false;
            let error = null;

            let decoder = new VideoDecoder({
                output: (frame) => { gotframe = true; frame.close(); },
                error: (e) => { error = e; },
            });
            let chunk = new EncodedVideoChunk({
                timestamp: 0,
                type: 'key',
                data: data,
            });

            decoder.configure(config);
            decoder.decode(chunk);
            try {
                await decoder.flush();
            } catch (e) {
                error = e; // Catch potential flush errors
            }

            if (!gotframe || error !== null) {
                Log.Warn("WebCodecs H.264 decode test failed (frame/error).");
                return false;
            }

            Log.Info("WebCodecs H.264 decode supported.");
            return true;

        } catch (e) {
            Log.Error("WebCodecs H.264 decode support check failed: " + e);
            return false;
        }
    }

    // Don't use top-level await, update the flag asynchronously
    _checkWebCodecsH264DecodeSupport().then(supported => {
        _supportsWebCodecsH264Decode = supported;
    });

} else {
    // --- SSR/Build Environment ---
    // Flags remain their default values (false, 10, etc.)
    Log.Info("Running outside browser environment, browser features disabled.");
}


// --- Exports ---
// Make flags available

export const isTouchDevice = _isTouchDevice;
export const dragThreshold = _dragThreshold;
export const supportsCursorURIs = _supportsCursorURIs;
export const hasScrollbarGutter = _hasScrollbarGutter;
export const supportsWebCodecsH264Decode = _supportsWebCodecsH264Decode; // Note: May update asynchronously

/*
 * The functions for detection of platforms and browsers below are exported
 * but the use of these should be minimized as much as possible.
 * It's better to use feature detection than platform detection.
 * These now return the pre-calculated values determined safely above.
 */

/* OS */
export function isMac() {
    return _isMacOs;
}
export function isWindows() {
    return _isWindowsOs;
}
export function isIOS() {
    return _isIOSOs;
}
export function isAndroid() {
    return _isAndroidOs;
}
export function isChromeOS() {
    return _isChromeOSOs;
}

/* Browser */
export function isSafari() {
    return _isSafariBrowser;
}
export function isFirefox() {
    return _isFirefoxBrowser;
}
export function isChrome() {
    return _isChromeBrowser;
}
export function isChromium() {
    return _isChromiumBrowser;
}
export function isOpera() {
    return _isOperaBrowser;
}
export function isEdge() {
    return _isEdgeBrowser;
}

/* Engine */
export function isGecko() {
    return _isGeckoEngine;
}
export function isWebKit() {
    return _isWebKitEngine;
}
export function isBlink() {
    return _isBlinkEngine;
}
