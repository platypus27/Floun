// header information is sent from autoscan getHeaders(), just have to analyse the headers and retrieve
// this is very NOT easy
// the cryptographic algorithm is straight up told to you from the header/signature

// Experimental Post-Quantum Safe Cipher Suites
const Safe_PQCipher = [
"ECDHE_KYBER512_RSA_WITH_AES_256_GCM_SHA384", "ECDHE_KYBER768_ECDSA_WITH_AES_256_GCM_SHA384", // Found from OpenQuantumSafe (liboqs) library
"ECDHE_SABER_ECDSA_WITH_AES_256_GCM_SHA384", "ECDHE_NTRU_HPS2048509_ECDSA_WITH_AES_256_GCM_SHA384",
"ECDHE_BIKE1_L1_ECDSA_WITH_CHACHA20_POLY1305_SHA256", "ECDHE_HQC_128_ECDSA_WITH_AES_256_GCM_SHA384",
"TLS_KYBER512", "TLS_KYBER768", "TLS_KYBER1024" // Not an Official Naming Convention but some websites are using it as a experimental cipher suite
]; 

// TypeScript Interfaces
interface Cipher {
  name: string;
}

interface Suite {
  list: Cipher[];
}

interface EndpointDetails {
  suites: Suite[];
}

interface Endpoint {
  details?: EndpointDetails;
}

interface JsonData {
  endpoints: Endpoint[];
}

// Function to Analyze Headers for Quantum-Safe Cipher Suites
export const HeaderSecurityCheck = (jsonData: JsonData): Record<string, string> => {
  const Result: Record<string, string> = {};
  const quantumSafeCiphers: string[] = [];
  const nonQuantumSafeCiphers: string[] = [];

  // Validate if endpoints exist
  if (!jsonData?.endpoints || !Array.isArray(jsonData.endpoints)) {
    Result["Status"] = "❌ No endpoints array found in JSON data.";
    return Result;
  }

  console.log("Valid endpoints found:", jsonData.endpoints.length);
  console.log("Type of endpoints:", typeof jsonData.endpoints);
  console.log("Is endpoints an array?", Array.isArray(jsonData.endpoints));


  // Iterate through each endpoint
  jsonData.endpoints.forEach((endpoint) => {
    if (!endpoint.details?.suites || !Array.isArray(endpoint.details.suites)) return;

    // Iterate through each suite object
    endpoint.details.suites.forEach((suiteObj) => {
      if (!suiteObj.list || !Array.isArray(suiteObj.list)) return;

      // Iterate through each cipher suite
      suiteObj.list.forEach((cipher) => {
        if (cipher.name) {
          // Convert both to lowercase for case-insensitive matching
          if (Safe_PQCipher.some((pqc) => pqc.toLowerCase() === cipher.name.toLowerCase())) {
            quantumSafeCiphers.push(cipher.name);
          } else {
            nonQuantumSafeCiphers.push(cipher.name);
          }
        }
      });
    });
  });

  // Generate Result Output
  if (quantumSafeCiphers.length > 0) {
    Result["Quantum-Safe Cipher Suites"] = `✅ Found ${quantumSafeCiphers.length} quantum-safe ciphers: ${quantumSafeCiphers.join(", ")}`;
  } else {
    Result["Quantum-Safe Cipher Suites"] = "❌ No quantum-safe cipher suites found.";
  }

  if (nonQuantumSafeCiphers.length > 0) {
    Result["Non-Quantum-Safe Cipher Suites"] = `⚠️ Found ${nonQuantumSafeCiphers.length} non-quantum-safe ciphers: ${nonQuantumSafeCiphers.join(", ")}`;
  }

  console.log("HeaderSecurityCheck Result:", Result);
  return Result;
};