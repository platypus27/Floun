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

export const HeaderSecurityCheck = (headers: any): Record<string, string> | null => {
  // Final Results Object
  const Result: Record<string, string> = {};

  // If Certificates is missing or not an array
  if (!headers || !Array.isArray(headers.endpoints)) {
    Result["Status"] = "No Certificate found in JSON data.";
    return Result;
  }

  // All PQC Safe found across the endpoints
  const quantumSafeCiphers: string[] = [];

  // Track how many endpoints fully support TLS 1.3
  let endpointsWithTLS13 = 0;
  const totalEndpoints = headers.endpoints.length;

  // Looping through each endpoint
  for (let i = 0; i < totalEndpoints; i++) {
    const endpoint = headers.endpoints[i];
    if (!endpoint.details) continue;

    // Check if the endpoint supports TLS 1.3
    let hasTLS13 = false;
    const protocols = endpoint.details.protocols;
    if (Array.isArray(protocols)) {
      for (let p = 0; p < protocols.length; p++) {
        const protoObj = protocols[p];
        if (protoObj?.version === "1.3") {
          hasTLS13 = true;
          break;
        }
      }
    }
    if (hasTLS13) endpointsWithTLS13++;

    // Look for Experimental PQC Ciper Suites
    const suitesArray = endpoint.details.suites;
    if (!Array.isArray(suitesArray)) continue;

    // Loop through the suites array
    for (let j = 0; j < suitesArray.length; j++) {
      const suiteObj = suitesArray[j];
      if (!suiteObj.list || !Array.isArray(suiteObj.list)) {
        continue; // skip if no 'list' array
      }

      // Loop through each cipher item in suiteObj.list
      for (let k = 0; k < suiteObj.list.length; k++) {
        const cipherItem = suiteObj.list[k];
        if (!cipherItem?.name) continue;

        const cipherName = cipherItem.name; // e.g. "ECDHE_KYBER512_RSA_WITH_AES_256_GCM_SHA384"
        // Check if this cipher is in our known quantum-safe array (case-insensitive)
        const isQuantumSafe = Safe_PQCipher.some(
          (pqc) => pqc.toLowerCase() === cipherName.toLowerCase()
        );

        if (isQuantumSafe) {
          quantumSafeCiphers.push(cipherName);
        }
      }
    }
  }

  // Generate Result Output
  if (quantumSafeCiphers.length > 0) {
    Result["Signature Algorithm"] = `✅ Found ${quantumSafeCiphers.length} Experimental Quantum-Safe Cipher(s): ` +
      quantumSafeCiphers.join(", ");
  } else {
    Result["Signature Algorithm"] = '❌ No Experimental Quantum-Safe Cipher Suites Found.';
  }

  if (endpointsWithTLS13 === totalEndpoints) {
    Result["TLSVersionCheck"] = `✅ All ${totalEndpoints} endpoint(s) support TLS 1.3.`;
  } else {
    Result["TLSVersionCheck"] =
      `⚠️ ${endpointsWithTLS13}/${totalEndpoints} endpoint(s) support TLS 1.3.`;
  }

  console.log("HeaderSecurityCheck result:", Result);
  return Result;
};