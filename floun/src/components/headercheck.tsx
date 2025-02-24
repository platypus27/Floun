// headercheck.tsx
interface CipherSuite {
  id?: number;
  name?: string;
}

interface EndpointDetails {
  tlsVersion?: string;
  cipherSuites?: CipherSuite[];
  certSignatureAlgorithm?: string;
}

interface Endpoint {
  details?: EndpointDetails;
}

interface SslLabsApiResponse {
  status: string;
  endpoints?: Endpoint[];
}

export async function performHeaderSecurityCheck(hostname: string): Promise<string> {
  try {
    const url = `https://api.ssllabs.com/api/v3/analyze?host=${hostname}`;
    console.log(`Fetching data from SSL Labs API for host: ${hostname}`);

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`Rate limit reached: ${response.status}`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SslLabsApiResponse = await response.json();
    if (data.status !== "READY") {
      return "Scanning in progress... ⏳";
    }

    let tlsVersion = "Unknown";
    let cipherSuites: string[] = [];
    let certAlgorithm = "Unknown";
    let tlsSafe = false;

    if (data.endpoints && data.endpoints.length > 0) {
      const endpoint = data.endpoints[0];
      tlsVersion = endpoint.details?.tlsVersion || "Unknown";
      certAlgorithm = endpoint.details?.certSignatureAlgorithm || "Unknown";
      cipherSuites = (endpoint.details?.cipherSuites || []).map(cs => cs.name || "Unknown");
      tlsSafe = tlsVersion === "TLSv1.3";
    }

    // Define known Post-Quantum and unsafe cipher suites.
    const pqcCiphers = [
      "TLS_KYBER", "TLS_NTRU", "TLS_SABER", "TLS_CLASSIC_MCELIECE",
      "TLS_BIKE", "TLS_FRODOKEM", "TLS_HQC", "TLS_NTRUPRIME",
      "TLS_DILITHIUM", "TLS_FALCON", "TLS_SPHINCS+",
      "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256",
      "TLS_AES_128_GCM_SHA256", "TLS_AES_128_CCM_8_SHA256", "TLS_AES_128_CCM_SHA256",
      "Kyber-based", "NTRU-based", "SABER-based", "Dilithium-based", "Falcon-based",
      "SPHINCS+-based", "Hybrid-PQC"
    ];

    const weakQuantumCiphers = [
      "TLS_RSA", "TLS_ECDHE_RSA", "TLS_ECDHE_ECDSA", "TLS_DHE_RSA",
      "TLS_RSA_WITH_AES_256_GCM_SHA384", "TLS_RSA_WITH_AES_128_GCM_SHA256",
      "TLS_RSA_WITH_AES_256_CBC_SHA256", "TLS_RSA_WITH_AES_128_CBC_SHA256",
      "TLS_RSA_WITH_AES_256_CBC_SHA", "TLS_RSA_WITH_AES_128_CBC_SHA",
      "TLS_RSA_WITH_CAMELLIA_256_CBC_SHA", "TLS_RSA_WITH_CAMELLIA_128_CBC_SHA",
      "TLS_RSA_WITH_3DES_EDE_CBC_SHA",
      "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
      "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384", "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
      "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA", "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
      "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384", "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
      "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384", "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
      "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA", "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
      "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
      "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
      "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384", "TLS_DHE_RSA_WITH_AES_128_GCM_SHA256",
      "TLS_DHE_RSA_WITH_AES_256_CBC_SHA256", "TLS_DHE_RSA_WITH_AES_128_CBC_SHA256",
      "TLS_DHE_RSA_WITH_AES_256_CBC_SHA", "TLS_DHE_RSA_WITH_AES_128_CBC_SHA",
      "TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA", "TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA",
      "TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA"
    ];

    let pqcLikely = cipherSuites.some(cs => 
      pqcCiphers.some(kw => cs.toLowerCase().includes(kw.toLowerCase()))
    );
    if (cipherSuites.some(cs =>
      weakQuantumCiphers.some(kw => cs.toLowerCase().includes(kw.toLowerCase()))
    )) {
      pqcLikely = false;
    }

    const strongCertAlgorithms = [
      "ECDSA_P256_SHA256", "ECDSA_P384_SHA384", "ECDSA_P521_SHA512",
      "Ed25519", "Dilithium", "SPHINCS+"
    ];
    const strongCert = strongCertAlgorithms.includes(certAlgorithm);

    let statusMessage = `TLS Status: `;
    statusMessage += tlsSafe ? "TLS 1.3 is used. " : "TLS 1.3 is NOT used. ";
    statusMessage += `Possible Post-Quantum Ciphers: ${pqcLikely ? "Likely" : "Unlikely"}. `;
    statusMessage += `Strong Certificate Algorithm: ${strongCert ? "Yes" : "No"}. `;
    statusMessage += ` (TLS: ${tlsVersion}, Ciphers: ${cipherSuites.join(", ")}, Cert: ${certAlgorithm})`;

    return statusMessage;
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    return `Error: ${error.message}`;
  }
}