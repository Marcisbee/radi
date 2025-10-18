import { originalPositionFor, TraceMap } from "npm:@jridgewell/trace-mapping";

function decodeBase64ToUtf8(b64: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf8");
  }
  // Browser fallback using atob
  if (typeof atob === "function") {
    const binary = atob(b64);
    // If TextDecoder is available, build Uint8Array for potential future use (could be extended)
    let result = "";
    for (let i = 0; i < binary.length; i++) {
      result += String.fromCharCode(binary.charCodeAt(i));
    }
    return result;
  }
  // Last resort: manual base64 decode (very minimal) - not full implementation, returns empty string
  return "";
}

Error.prepareStackTrace = (err: Error, callSites: any[]) => {
  return `${err.message}\n` +
    callSites.map((cs) => {
      const trace = "  at " + cs.toString();
      const fileName = cs.getFileName();
      const genLine = cs.getLineNumber();
      const genCol = cs.getColumnNumber();

      const currentFile = `${fileName}:${genLine}:${genCol}`;

      if (typeof fileName === "string" && fileName.startsWith("data:")) {
        try {
          // Attempt to decode percent-encodings so the sourceMappingURL is visible
          const decoded = decodeURIComponent(fileName);

          // Find base64 sourcemap in the data URL
          const mapMatch = decoded.match(
            /sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+\/=]+)/,
          );
          if (mapMatch) {
            const base64Map = mapMatch[1];
            const jsonStr = decodeBase64ToUtf8(base64Map);
            const map = JSON.parse(jsonStr);

            const TraceMapCtor = TraceMap;

            let traceMapInstance: any = map;
            if (typeof TraceMapCtor === "function") {
              traceMapInstance = new TraceMapCtor(map);
            }

            const originalPos = originalPositionFor(traceMapInstance, {
              line: genLine,
              column: genCol,
            });

            const src = originalPos.source;
            // originalPositionFor typically returns 1-based line; ensure sensible fallbacks
            const outLine = originalPos.line || 1;
            const outCol = typeof originalPos.column === "number"
              ? Math.max(1, originalPos.column)
              : 1;
            return trace.replace(currentFile, `${src}:${outLine}:${outCol}`);
          }
        } catch {
          // any error, fall through to default formatting below
        }
      }

      return trace;
    }).join("\n");
};
