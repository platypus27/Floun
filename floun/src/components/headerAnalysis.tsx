// header information is sent from autoscan getHeaders(), just have to analyse the headers and retrieve
// this is very NOT easy
// the cryptographic algorithm is straight up told to you from the header/signature

// Experimental Post-Quantum Safe Cipher Suites
const Safe_PQCipher = [
  "ECDHE_KYBER512_RSA_WITH_AES_256_GCM_SHA384", "ECDHE_KYBER768_ECDSA_WITH_AES_256_GCM_SHA384",
  "ECDHE_SABER_ECDSA_WITH_AES_256_GCM_SHA384", "ECDHE_NTRU_HPS2048509_ECDSA_WITH_AES_256_GCM_SHA384",
  "ECDHE_BIKE1_L1_ECDSA_WITH_CHACHA20_POLY1305_SHA256", "ECDHE_HQC_128_ECDSA_WITH_AES_256_GCM_SHA384",
  "TLS_KYBER512", "TLS_KYBER768", "TLS_KYBER1024"
];

// TypeScript Interfaces
interface Cipher {
  name: string;
}

interface Suite {
  protocol: number; // TLS version ID (e.g., 771 = TLS 1.2, 772 = TLS 1.3)
  list: Cipher[];
}

interface Protocol {
  id: number;
  name: string;
  version: string; // Example: "1.3"
}

interface EndpointDetails {
  suites: Suite[];
  protocols?: Protocol[]; // Added protocols array
}

interface Endpoint {
  details?: EndpointDetails;
}

interface JsonData {
  endpoints: Endpoint[];
}

// Analyze Headers for Quantum-Safe Cipher Suites & TLS 1.3
export const HeaderSecurityCheck = (jsonData: JsonData): string[] => {
  if (!jsonData?.endpoints || !Array.isArray(jsonData.endpoints)) {
    return ["❌ No endpoints array found in JSON data."];
  }

  const results: string[] = [];

  // Iterate through each endpoint
  jsonData.endpoints.forEach((endpoint) => {
    if (!endpoint.details) return;

    let tlsVersion = "<Unknown>";
    let foundQuantumSafeCipher = false;
    const nonQuantumSafeCiphers: string[] = [];

    // Check the highest TLS version supported
    if (endpoint.details.protocols && Array.isArray(endpoint.details.protocols)) {
      const tls13Supported = endpoint.details.protocols.some(protocol => protocol.version === "1.3");
      tlsVersion = tls13Supported ? "1.3" : "<1.2 or Lower>";
    }

    // Check for cipher suites
    if (endpoint.details.suites && Array.isArray(endpoint.details.suites)) {
      endpoint.details.suites.forEach((suiteObj) => {
        if (!suiteObj.list || !Array.isArray(suiteObj.list)) return;

        suiteObj.list.forEach((cipher) => {
          if (cipher.name) {
            if (Safe_PQCipher.some((pqc) => pqc.toLowerCase() === cipher.name.toLowerCase())) {
              foundQuantumSafeCipher = true;
              results.push(`TLS ${tlsVersion} + ${cipher.name} [Safe] in SSL Header`);
            } else {
              nonQuantumSafeCiphers.push(cipher.name);
            }
          }
        });
      });
    }

    // If there are non-quantum-safe ciphers, mark them as vulnerable
    if (nonQuantumSafeCiphers.length > 0) {
      nonQuantumSafeCiphers.forEach(cipher => {
        results.push(`Found TLS ${tlsVersion} + ${cipher} [Vulnerable] in SSL Header`);
      });
    }
  });

  if (results.length > 0) {
    return results
  } else {
    return ["⚠️ No valid cipher suites found."]
  }
};
