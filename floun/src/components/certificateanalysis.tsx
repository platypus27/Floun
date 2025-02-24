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

export const analyzeCertificate = (certificate: any): Record<string, string> | null => {
  const certificate_algo = certificate["result"]["cert_alg"];
  const analysisResult: Record<string, string> = {};

  if (QUANTUM_SAFE_SIGNATURES.includes(certificate_algo)) {
    analysisResult["Signature Algorithm"] = "Certificate is Quantum-Safe";
  } else {
    analysisResult["Signature Algorithm"] =
      "Certificate Not Quantum-Safe, Hash Result: " + certificate_algo;
  }

  console.log(analysisResult);
  return analysisResult;
};