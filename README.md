# sse
Server-Sent-Events backend

This is a node service which is connected from browser for SSE connection and continously push the data in real time.
It accepts multiple connections from different browsers, continously reads messages from Redis and pushes them to browsers over SSE connections.
