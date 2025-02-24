// src/components/headercheck.tsx
import React, { useEffect } from 'react';

export async function runTlsScanViaNode(hostname: string): Promise<string> {
  try {
    // Adjust the URL if your server runs on a different host/port.
    const response = await fetch(`http://localhost:3000/api/tls-scan?hostname=${encodeURIComponent(hostname)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const output = await response.text();
    return output;
  } catch (error: any) {
    console.error('Error running TLS scan via Node:', error);
    throw error;
  }
}

const HeaderSecurityCheck: React.FC = () => {
  useEffect(() => {
    // Example hostname – you can replace this with the actual hostname you want to scan.
    const hostname = 'example.com';
    
    runTlsScanViaNode(hostname)
      .then(result => {
        console.log('TLS scan output:', result);
      })
      .catch(error => {
        console.error('TLS scan failed:', error);
      });
  }, []);

  return null;
};

export default HeaderSecurityCheck;


    // // Define known Post-Quantum and unsafe cipher suites.
    // const pqcCiphers = [
    //   "TLS_KYBER", "TLS_NTRU", "TLS_SABER", "TLS_CLASSIC_MCELIECE",
    //   "TLS_BIKE", "TLS_FRODOKEM", "TLS_HQC", "TLS_NTRUPRIME",
    //   "TLS_DILITHIUM", "TLS_FALCON", "TLS_SPHINCS+",
    //   "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256",
    //   "TLS_AES_128_GCM_SHA256", "TLS_AES_128_CCM_8_SHA256", "TLS_AES_128_CCM_SHA256",
    //   "Kyber-based", "NTRU-based", "SABER-based", "Dilithium-based", "Falcon-based",
    //   "SPHINCS+-based", "Hybrid-PQC"
    // ];

    // const weakQuantumCiphers = [
    //   "TLS_RSA", "TLS_ECDHE_RSA", "TLS_ECDHE_ECDSA", "TLS_DHE_RSA",
    //   "TLS_RSA_WITH_AES_256_GCM_SHA384", "TLS_RSA_WITH_AES_128_GCM_SHA256",
    //   "TLS_RSA_WITH_AES_256_CBC_SHA256", "TLS_RSA_WITH_AES_128_CBC_SHA256",
    //   "TLS_RSA_WITH_AES_256_CBC_SHA", "TLS_RSA_WITH_AES_128_CBC_SHA",
    //   "TLS_RSA_WITH_CAMELLIA_256_CBC_SHA", "TLS_RSA_WITH_CAMELLIA_128_CBC_SHA",
    //   "TLS_RSA_WITH_3DES_EDE_CBC_SHA",
    //   "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
    //   "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384", "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
    //   "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA", "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
    //   "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384", "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
    //   "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384", "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
    //   "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA", "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
    //   "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
    //   "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
    //   "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384", "TLS_DHE_RSA_WITH_AES_128_GCM_SHA256",
    //   "TLS_DHE_RSA_WITH_AES_256_CBC_SHA256", "TLS_DHE_RSA_WITH_AES_128_CBC_SHA256",
    //   "TLS_DHE_RSA_WITH_AES_256_CBC_SHA", "TLS_DHE_RSA_WITH_AES_128_CBC_SHA",
    //   "TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA", "TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA",
    //   "TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA"
    // ];
    // const strongCertAlgorithms = [
    //   "ECDSA_P256_SHA256", "ECDSA_P384_SHA384", "ECDSA_P521_SHA512",
    //   "Ed25519", "Dilithium", "SPHINCS+"
    // ];