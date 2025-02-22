// certificate contents will be sent from autoscan getCertificate(), just have to analyse the certificate
// find the cryptographic algorithm used in the certificate and determine if it is quantum resistant
// semi easy i guess shouldnt be hard at all

const QUANTUM_SAFE_SIGNATURES = [
  "dilithium",
  "falcon",
  "sphincs",
  "crystals-dilithium",
  "crystals-kyber",
];

const analyzeCertificate = async (certificate: any): Promise<any | null> => {
  const certificate_algo = certificate["result"]["cert_alg"];
  const analysisResult: Record<string, string> = {};

  if (QUANTUM_SAFE_SIGNATURES.includes(certificate_algo)) {
    analysisResult["Signature Algorithm"] = "✅ Quantum-Safe";
  } else {
    analysisResult["Signature Algorithm"] =
      "❌ Not Quantum-Safe (Signature algorithm not in quantum-safe list)";
  }

  console.log(analysisResult);
  return analysisResult;
};

export { analyzeCertificate };
