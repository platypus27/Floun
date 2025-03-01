// certificate contents will be sent from autoscan getCertificate(), just have to analyse the certificate
// find the cryptographic algorithm used in the certificate and determine if it is quantum resistant
// semi easy i guess shouldnt be hard at all

import { CERTIFICATE_SIGNATURES } from './cryptographyAnalysisEngine';

export const analyzeCertificate = (certificate: any): string | null => {
  const certificate_algo = certificate["result"]["cert_alg"];

  if (CERTIFICATE_SIGNATURES['safe'].includes(certificate_algo)) {
    return `Found ${certificate_algo} [Safe] in certificate`
  } else {
    return `Found ${certificate_algo} [Vulnerable] in certificate`
  }
};