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
export const HeaderSecurityCheck = (jsonData: JsonData): string => {
  let tlsStatus = "❌ TLS <Unknown> [Vulnerable]"; // Default if TLS is not found
  let cipherStatus = "❌ CipherSuite [Vulnerable]"; // Default if no quantum-safe cipher suites are found

  // Validate if endpoints exist
  if (!jsonData?.endpoints || !Array.isArray(jsonData.endpoints)) {
    return "❌ No endpoints array found in JSON data.";
  }

  let supportsTLS13 = false;
  let foundQuantumSafeCipher = false;

  // Iterate through each endpoint
  jsonData.endpoints.forEach((endpoint) => {
    if (!endpoint.details) return;

    // Check if TLS 1.3 is supported
    if (endpoint.details.protocols && Array.isArray(endpoint.details.protocols)) {
      endpoint.details.protocols.forEach((protocol) => {
        if (protocol.version === "1.3") {
          supportsTLS13 = true;
        }
      });
    }

    // Check for quantum-safe ciphers
    if (endpoint.details.suites && Array.isArray(endpoint.details.suites)) {
      endpoint.details.suites.forEach((suiteObj) => {
        if (!suiteObj.list || !Array.isArray(suiteObj.list)) return;

        suiteObj.list.forEach((cipher) => {
          if (cipher.name) {
            if (Safe_PQCipher.some((pqc) => pqc.toLowerCase() === cipher.name.toLowerCase())) {
              foundQuantumSafeCipher = true;
            }
          }
        });
      });
    }
  });

  // Assign TLS status ✅ ❌ 
  tlsStatus = supportsTLS13 ? "TLS 1.3 [Safe]" : "TLS <1.2 or Lower> [Vulnerable]";

  // Assign Cipher Suite status
  cipherStatus = foundQuantumSafeCipher ? "CipherSuite [Safe]" : "CipherSuite [Vulnerable]";

  // Return formatted output
  //console.log("HeaderSecurityCheck Result:", ${ tlsStatus }, ${ cipherStatus });
  return `${tlsStatus}, ${cipherStatus} in SSL Header`;
};
