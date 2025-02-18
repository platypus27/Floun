// header information is sent from autoscan getHeaders(), just have to analyse the headers and retrieve
// this is very not easy
// the cryptographic algorithm is straight up told to you from the header/signature
// 1. Check TLS Version (TLS 1.3 and Above = Safe)
// 2. Cipher Suite (RSA/ECDHE = Unsafe) (Hybrid key exchanges such as Kyber + X25519 is safe)
// 3. Post Quantum Cryptography (PQC) Algorithm (Kyber, Dilithium, SPHINCS+, Falcon = Safe)
// 4. Certificate Signature Algorithm (Public Key Pins, Strict Transport Security headers = Safe)

import React, { useState, useEffect } from 'react';

interface CipherSuite {
  id?: number;
  name?: string;
}

interface EndpointDetails {
  tlsVersion?: string;
  cipherSuites?: CipherSuite[];
  certSignatureAlgorithm?: string; // Certificate Algorithm
}

interface Endpoint {
  details?: EndpointDetails;
}

interface SslLabsApiResponse {
  status: string;
  endpoints?: Endpoint[];
}

const HeaderSecurityCheck: React.FC = () => {
  const [tlsStatus, setTlsStatus] = useState<string>('Scanning TLS settings...');

  useEffect(() => {
    const fetchTLSVersionAndCipher = async (retries = 3) => {
      try {
        const response = await fetch(`https://api.ssllabs.com/api/v3/analyze?host=${window.location.hostname}`);
        
        if (!response.ok) {
          if (response.status === 429 && retries > 0) {
            console.warn("API rate limit hit. Retrying...");
            setTimeout(() => fetchTLSVersionAndCipher(retries - 1), 5000);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SslLabsApiResponse = await response.json();

        if (data.status !== "READY") {
          setTlsStatus("Scanning in progress... ⏳");
          return;
        }

        let tlsSafe = false;
        let pqcLikely = false;
        let strongCert = false;
        let tlsVersion = "Unknown";
        let cipherSuites: string[] = [];
        let certAlgorithm = "Unknown";

        if (data.endpoints?.length) {
          const endpoint = data.endpoints[0];
          tlsVersion = endpoint.details?.tlsVersion || "Unknown";
          certAlgorithm = endpoint.details?.certSignatureAlgorithm || "Unknown";
          const cipherSuiteObjects = endpoint.details?.cipherSuites || [];
          cipherSuites = cipherSuiteObjects.map(cs => cs.name || "Unknown");

          tlsSafe = tlsVersion === "TLSv1.3";

          //Known Post-Quantum Safe Cipher Suites
          const pqcCiphers = [
            "TLS_KYBER", "TLS_NTRU", "TLS_SABER", "TLS_CLASSIC_MCELIECE",
            "TLS_BIKE", "TLS_FRODOKEM", "TLS_HQC", "TLS_NTRUPRIME",
            "TLS_DILITHIUM", "TLS_FALCON", "TLS_SPHINCS+", 
            "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256", 
            "TLS_AES_128_GCM_SHA256", "TLS_AES_128_CCM_8_SHA256", "TLS_AES_128_CCM_SHA256",
            "Kyber-based", "NTRU-based", "SABER-based", "Dilithium-based", "Falcon-based", 
            "SPHINCS+-based", "Hybrid-PQC"
          ];
          
          // Known **Unsafe** Cipher Suites
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
          
          pqcLikely = cipherSuites.some(cs => pqcCiphers.some(kw => cs.toLowerCase().includes(kw.toLowerCase())));
          
          if (cipherSuites.some(cs => weakQuantumCiphers.some(kw => cs.toLowerCase().includes(kw.toLowerCase())))) {
            pqcLikely = false; // Override if unsafe keywords are found.
          }

          // ✅ Check for Strong Certificate Algorithms
          const strongCertAlgorithms = [
            "ECDSA_P256_SHA256", "ECDSA_P384_SHA384", "ECDSA_P521_SHA512",
            "Ed25519", "Dilithium", "SPHINCS+"
          ];

          strongCert = strongCertAlgorithms.includes(certAlgorithm);
        }

        let statusMessage = `TLS Status: `;
      if (tlsSafe) {
        statusMessage += "TLS 1.3 is used. ";
      } else {
        statusMessage += "TLS 1.3 is NOT used. ";
      }

      statusMessage += `Possible Post-Quantum Ciphers: ${pqcLikely ? "Likely" : "Unlikely"}. `;
      statusMessage += `Strong Certificate Algorithm: ${strongCert ? "Yes" : "No"}.`;
      statusMessage += ` (TLS: ${tlsVersion}, Ciphers: ${cipherSuites.join(", ")}, Cert: ${certAlgorithm})`;

      setTlsStatus(statusMessage);

      } catch (error) {
        console.error("An error occurred:", error);
        setTlsStatus(error instanceof Error ? `❌ Error: ${error.message}` : "❌ Unknown error occurred");
      }
    };

    fetchTLSVersionAndCipher().then(() => {
      console.log(`TLS Security Assessment: ${tlsStatus}`);
    });
    
  }, []);

  return null; // Or return an empty fragment: return <></>;
};

export default HeaderSecurityCheck;