/**
 * Internal scanning functions used by runAllScans.
 */

import { analyzeCryptoInJavascript } from "./javascriptanalysis";
import { analyzeCertificate } from "./certificateanalysis";

const getCertificates = async (url: URL): Promise<any | null> => {
  try {
    if (url.protocol == "https:") {
      const domain = url.hostname;
      const response = await fetch(
        `https://ssl-checker.io/api/v1/check/${domain}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      console.log(data);
      console.log(data["result"]);
      console.log(data["result"]["cert_alg"]);

      if (data.length === 0) {
        throw new Error("No certificate found for this domain.");
      }

      return data; // Return the JSON data directly
    } else {
      console.error("No certificate found for this domain. (http)");
      return false;
    }
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return null; // Handle errors gracefully by returning null
  }
};

const getTokens = (): any => {
  const tokens: any[] = [];
  const regex = /([a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+)/g;

  // Scan document text
  const elements = document.getElementsByTagName("*");
  for (let i = 0; i < elements.length; i++) {
    const text = elements[i].textContent || "";
    const matches = text.match(regex);
    if (matches) tokens.push(...matches);
  }

  // Scan cookies, localStorage, and sessionStorage
  document.cookie.split(";").forEach((cookie) => {
    const matches = cookie.trim().match(regex);
    if (matches) tokens.push(...matches);
  });
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = key ? localStorage.getItem(key) || "" : "";
    const matches = value.match(regex);
    if (matches) tokens.push(...matches);
  }
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = key ? sessionStorage.getItem(key) || "" : "";
    const matches = value.match(regex);
    if (matches) tokens.push(...matches);
  }

  return tokens.length > 0 ? tokens : "No tokens found";
};

const getHeaders = (): { [key: string]: string } => {
  const headers: { [key: string]: string } = {};
  const metaTags = document.getElementsByTagName("meta");
  for (let i = 0; i < metaTags.length; i++) {
    const metaTag = metaTags[i];
    const name =
      metaTag.getAttribute("name") || metaTag.getAttribute("http-equiv");
    const content = metaTag.getAttribute("content");
    if (name && content) headers[name] = content;
  }
  headers["Content-Type"] = document.contentType || "Not available";
  headers["Content-Language"] =
    document.documentElement.lang || "Not available";
  return headers;
};

const getJavaScript = async (): Promise<any> => {
  const scripts: any[] = [];
  const scriptElements = document.getElementsByTagName("script");

  // Process existing <script> elements
  for (let i = 0; i < scriptElements.length; i++) {
    const scriptElement = scriptElements[i];
    if (scriptElement.src) {
      // For external scripts, fetch the content (if allowed by CORS)
      try {
        const response = await fetch(scriptElement.src);
        const content = await response.text();
        scripts.push({
          type: "external",
          src: scriptElement.src,
          content: content,
        });
      } catch (error) {
        // If fetching fails, log the URL only
        scripts.push({
          type: "external",
          src: scriptElement.src,
          content: "Unable to fetch content due to CORS restrictions",
        });
      }
    } else {
      // For inline scripts, add the content
      scripts.push({
        type: "inline",
        content: scriptElement.textContent || "",
      });
    }
  }

  // Capture dynamically injected scripts (optional)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === "SCRIPT") {
          const scriptElement = node as HTMLScriptElement;
          if (scriptElement.src) {
            scripts.push({
              type: "dynamic-external",
              src: scriptElement.src,
              content: "Dynamically injected external script",
            });
          } else {
            scripts.push({
              type: "dynamic-inline",
              content: scriptElement.textContent || "",
            });
          }
        }
      });
    });
  });

  // Start observing the document for changes
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return scripts.length > 0 ? scripts : "No JavaScript found";
};

/**
 * Aggregates all scans including certificate, token, header, and JavaScript scans.
 * Also calls analyzeCryptoInJavaScript from javascriptanalysis.tsx.
 */
export const runAllScans = async (url: URL): Promise<any> => {
  console.log(url);
  try {
    const [certificates, tokens, headers, jsScripts] = await Promise.all([
      getCertificates(url),
      Promise.resolve(getTokens()),
      Promise.resolve(getHeaders()),
      getJavaScript(),
    ]);

    if (jsScripts === "No JavaScript found") {
      throw new Error("No JavaScript detected on the page.");
    }

    if (certificates != null && certificates != false) {
      const analysisResult = analyzeCertificate(certificates);
      console.log(analysisResult);
    }

    const cryptoAnalysis = analyzeCryptoInJavascript(jsScripts);
    return {
      certificates,
      tokens,
      headers,
      jsScripts,
      cryptoAnalysis,
    };
  } catch (error) {
    console.error("Error running all scans:", error);
    return {
      error: (error as Error).message,
    };
  }
};
