/**
 * scanPage() performs your extended scan and returns a string with the results.
 */

export const getCertificates = async (hostname: string): Promise<any> => {
  try {
    const response = await fetch(`https://crt.sh/?q=${hostname}&output=json`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const certificates = await response.json();
    return certificates;
  } catch (error: any) {
    return `Error fetching certificates: ${error.message}`;
  }
};

export const getTokens = (): any => {
  const tokens: any[] = [];
  const regex = /([a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+)/g; // Regex to match JWTs

  // Scan the entire document for tokens
  const elements = document.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const textContent = element.textContent || '';
    const matches = textContent.match(regex);
    if (matches) {
      tokens.push(...matches);
    }
  }

  // Scan cookies for tokens
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    const matches = cookie.match(regex);
    if (matches) {
      tokens.push(...matches);
    }
  }

  // Scan localStorage for tokens
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      const matches = value.match(regex);
      if (matches) {
        tokens.push(...matches);
      }
    }
  }

  // Scan sessionStorage for tokens
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      const value = sessionStorage.getItem(key) || '';
      const matches = value.match(regex);
      if (matches) {
        tokens.push(...matches);
      }
    }
  }
  return tokens.length > 0 ? tokens : 'No tokens found';
};

export const getHeaders = (): { [key: string]: string } => {
  const headers: { [key: string]: string } = {};

  // Retrieve meta tags as headers
  const metaTags = document.getElementsByTagName('meta');
  for (let i = 0; i < metaTags.length; i++) {
    const metaTag = metaTags[i];
    const name = metaTag.getAttribute('name') || metaTag.getAttribute('http-equiv');
    const content = metaTag.getAttribute('content');
    if (name && content) {
      headers[name] = content;
    }
  }

  headers['Content-Type'] = document.contentType || 'Not available';
  headers['Content-Language'] = document.documentElement.lang || 'Not available';

  return headers;
};

export const getJavaScript = async (): Promise<any> => {
  const scripts: any[] = [];
  const scriptElements = document.getElementsByTagName('script');

  // Process existing <script> elements
  for (let i = 0; i < scriptElements.length; i++) {
    const scriptElement = scriptElements[i];
    if (scriptElement.textContent) {
      scripts.push({
        type: 'inline',
        content: scriptElement.textContent,
      });
    }
  }

  // Observe the document for dynamically added script elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName.toLowerCase() === 'script') {
            const scriptElement = element as HTMLScriptElement;
            scripts.push({
              type: 'dynamic-inline',
              content: scriptElement.textContent || '',
            });
          }
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return scripts.length > 0 ? scripts : 'No JavaScript found';
};

// all kiv for future implementation
// export const getWebSockets = (): any => {
//   // implementation...
// };
// export const getDynamicCrypto = (): any => {
//   // implementation...
// };
// export const getContentSecurity = (): any => {
//   // implementation...
// };