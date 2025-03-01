/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { SHODAN_API_KEY } from "../shodankey";

interface ShodanSSLCheckerProps {
  host: string;
}

const ShodanSSLChecker: React.FC<ShodanSSLCheckerProps> = ({ host }) => {
  const [ciphers, setCiphers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSSLInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Resolve domain to IP
      const dnsResponse = await fetch(
        `https://api.shodan.io/dns/resolve?hostnames=${host}&key=${SHODAN_API_KEY}`
      );
      const dnsData = await dnsResponse.json();
      const ip = dnsData[host];

      if (!ip) {
        throw new Error("Could not resolve IP address.");
      }

      // Step 2: Fetch SSL cipher details
      const sslResponse = await fetch(
        `https://api.shodan.io/shodan/host/${ip}?key=${SHODAN_API_KEY}`
      );
      const sslData = await sslResponse.json();

      // Extract SSL ciphers
      const cipherNames =
        sslData.ssl?.cipher?.name
          ? [sslData.ssl.cipher.name]
          : sslData.ssl?.ciphers?.map((c: { name: string }) => c.name) || [];

      setCiphers(cipherNames);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSSLInfo();
  }, [host]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <ul>
        {ciphers.map((cipher, index) => (
          <li key={index}>{cipher}</li>
        ))}
      </ul>
    </div>
  );
};

export default ShodanSSLChecker;