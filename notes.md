# Widget API

This widget uses Martix features from MSC4039:
download_file

More details:
https://github.com/matrix-org/matrix-spec-proposals/pull/4039

Download file implementation from matrix-widget-api:
https://github.com/matrix-org/matrix-widget-api/pull/99
https://github.com/matrix-org/matrix-widget-api/pull/99/files

**Common usercase**

1. Require capabilities: 
`org.matrix.msc4039.download_file`

   2. Send postMessage:
   `widget.sendMessage({
                    api: "fromWidget", 
                    action: "org.matrix.msc4039.download_file",
                    requestId, // Unique requiestId
                    widgetId: widget.widgetId, // your widget ID
                    data: {
                           content_uri: mxcUrl,
                           timeout_ms: 20000
                    },
   });`