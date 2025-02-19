/**
 * scanPage() performs your extended scan and returns a string with the results.
 */
export const scanPage = async (hostname: string): Promise<string> => {
  console.log("2")
  const certificate = await getCertificates(hostname);

  const results = {
    certificates: certificate,
    tokens: getTokens(),
    headers: getHeaders(),
    jsCrypto: getJavaScriptCrypto(),
    webSockets: getWebSockets(),
    dynamicCrypto: getDynamicCrypto(),
    contentSecurity: getContentSecurity(),
  };
  return JSON.stringify(results, null, 2);
};

const getCertificates = async (hostname: string): Promise<any> => {
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

const getTokens = (): any => {
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

const getHeaders = (): { [key: string]: string } => {
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

const getJavaScriptCrypto = (): any => {
  const scripts: any[] = [];
  const scriptElements = document.getElementsByTagName('script');

  for (let i = 0; i < scriptElements.length; i++) {
    const scriptElement = scriptElements[i];
    if (scriptElement.src) {
      // For external scripts, return a descriptor
      scripts.push(`External script: ${scriptElement.src}`);
    } else {
      // For inline scripts, add the content
      scripts.push(scriptElement.textContent || '');
    }
  }
  return scripts.length > 0 ? scripts : 'No JavaScript found';
};

const getWebSockets = (): any => {
  const webSockets: any[] = [];
  const scripts = document.getElementsByTagName('script');

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    if (script.textContent && script.textContent.includes('WebSocket')) {
      webSockets.push(script.textContent);
    }
  }
  return webSockets.length > 0 ? webSockets : 'No WebSocket usage found';
};

const getDynamicCrypto = (): any => {
  const dynamicCrypto: any[] = [];
  const scripts = document.getElementsByTagName('script');

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    if (script.textContent && script.textContent.includes('crypto')) {
      dynamicCrypto.push(script.textContent);
    }
  }
  return dynamicCrypto.length > 0 ? dynamicCrypto : 'No dynamic cryptographic behavior found';
};

const getContentSecurity = (): string => {
  const metaTags = document.getElementsByTagName('meta');
  for (let i = 0; i < metaTags.length; i++) {
    const metaTag = metaTags[i];
    if (metaTag.getAttribute('http-equiv') === 'Content-Security-Policy') {
      return metaTag.getAttribute('content') || 'No Content Security Policy found';
    }
  }
  return 'No Content Security Policy found';
};