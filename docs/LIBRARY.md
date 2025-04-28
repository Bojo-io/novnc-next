# Using the noVNC JavaScript library

This document describes how to make use of the noVNC JavaScript library (specifically, the `novnc-next` fork) for
integration in your own VNC client application. If you wish to embed the more
complete noVNC application with its included user interface then please see
our [embedding documentation](EMBEDDING.md).

## API

The API of noVNC consists of a single core class called `RFB`. The formal
documentation for that object can be found in our [API documentation](API.md).

## Example Usage

The primary way to use this library is by importing the `RFB` class.

1.  **Installation:**
    ```bash
    npm install novnc-next
    # Or link locally for development (see main README.md)
    ```

2.  **Build:**
    This library requires a build step to generate distributable files if you are working directly from the source repository.
    ```bash
    # Within the novnc-next directory:
    npm install
    npm run build
    ```
    (This step is not needed if you installed the package from npm).

3.  **Import and Instantiate:**
    ```javascript
    import RFB from 'novnc-next';

    let rfb;
    const targetElement = document.getElementById('vnc-canvas'); // Your target canvas element
    const websocketUrl = 'ws://your-vnc-websocket-proxy:6080/';

    try {
      // See API.md for constructor options
      rfb = new RFB(targetElement, websocketUrl, {
        credentials: { password: 'your-vnc-password' },
      });

      // Add event listeners (see API.md)
      rfb.addEventListener('connect', () => { /* ... */ });
      rfb.addEventListener('disconnect', () => { /* ... */ });

    } catch (exc) {
      console.error('RFB initialization failed:', exc);
    }
    ```

`vnc_lite.html` in the main directory also provides a basic example, though it uses the library directly from the source without the standard import shown above.
