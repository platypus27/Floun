// header information is sent from autoscan getHeaders(), just have to analyse the headers and retrieve
// this is very not easy
// the cryptographic algorithm is straight up told to you from the header/signature
// 1. Check TLS Version (TLS 1.3 and Above = Safe)
// 2. Cipher Suite (RSA/ECDHE = Unsafe) (Hybrid key exchanges such as Kyber + X25519 is safe)
// 3. Post Quantum Cryptography (PQC) Algorithm (Kyber, Dilithium, SPHINCS+, Falcon = Safe)
// 4. Certificate Signature Algorithm (Public Key Pins, Strict Transport Security headers = Safe)

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

console.log("test");

export async function HeaderSecurityCheck(hostname: string): Promise<string> {
  const url = `https://api.ssllabs.com/api/v3/analyze?host=${hostname}&all=on`;
  console.log(`Fetching data from SSL Labs API for host: ${hostname}`);

  const maxAttempts = 10;  // Maximum number of polling attempts
  const delay = 5000;      // Delay between attempts in milliseconds (5 seconds)
  let attempt = 0;
  let data: SslLabsApiResponse | null = null;

  while (attempt < maxAttempts) {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`Rate limit reached: ${response.status}`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    data = await response.json();
    if (data) {
      console.log(`Attempt ${attempt + 1}: Status = ${data.status}`);
    }

    if (data && data.status === "READY") {
      break; // The scan is complete.
    }

    // Wait for the specified delay before polling again.
    await new Promise(resolve => setTimeout(resolve, delay));
    attempt++;
  }

  if (!data || data.status !== "READY") {
    return "Scan did not complete in time. Try again later.";
  }

  console.log("Raw API scan data:", data);
  return JSON.stringify(data);
}

//Known Post-Quantum Safe Cipher Suites
// const pqcCiphers = [
// "TLS_KYBER", "TLS_NTRU", "TLS_SABER", "TLS_CLASSIC_MCELIECE",
// "TLS_BIKE", "TLS_FRODOKEM", "TLS_HQC", "TLS_NTRUPRIME",
// "TLS_DILITHIUM", "TLS_FALCON", "TLS_SPHINCS+", 
// "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256", 
// "TLS_AES_128_GCM_SHA256", "TLS_AES_128_CCM_8_SHA256", "TLS_AES_128_CCM_SHA256",
// "Kyber-based", "NTRU-based", "SABER-based", "Dilithium-based", "Falcon-based", 
// "SPHINCS+-based", "Hybrid-PQC"];

// Known **Unsafe** Cipher Suites
// const weakQuantumCiphers = [
// "TLS_RSA", "TLS_ECDHE_RSA", "TLS_ECDHE_ECDSA", "TLS_DHE_RSA",
// "TLS_RSA_WITH_AES_256_GCM_SHA384", "TLS_RSA_WITH_AES_128_GCM_SHA256",
// "TLS_RSA_WITH_AES_256_CBC_SHA256", "TLS_RSA_WITH_AES_128_CBC_SHA256",
// "TLS_RSA_WITH_AES_256_CBC_SHA", "TLS_RSA_WITH_AES_128_CBC_SHA",
// "TLS_RSA_WITH_CAMELLIA_256_CBC_SHA", "TLS_RSA_WITH_CAMELLIA_128_CBC_SHA",
// "TLS_RSA_WITH_3DES_EDE_CBC_SHA",
// "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
// "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384", "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
// "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA", "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
// "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384", "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
// "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384", "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
// "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA", "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
// "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
// "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
// "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384", "TLS_DHE_RSA_WITH_AES_128_GCM_SHA256",
// "TLS_DHE_RSA_WITH_AES_256_CBC_SHA256", "TLS_DHE_RSA_WITH_AES_128_CBC_SHA256",
// "TLS_DHE_RSA_WITH_AES_256_CBC_SHA", "TLS_DHE_RSA_WITH_AES_128_CBC_SHA",
// "TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA", "TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA",
// "TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA"];

 // ✅ Check for Strong Certificate Algorithms
// const strongCertAlgorithms = ["ECDSA_P256_SHA256", "ECDSA_P384_SHA384", "ECDSA_P521_SHA512","Ed25519", "Dilithium", "SPHINCS+"];