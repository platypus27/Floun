import { useState } from "react";
import { SHODAN_API_KEY } from "../config";  // Adjust path as needed

interface ShodanSSLCheckerProps {
  host: string;
}

const ShodanSSLChecker: React.FC<ShodanSSLCheckerProps> = ({ host: initialHost }) => {
  const [host, setHost] = useState(initialHost);
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

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg">
      <h2 className="text-lg font-bold">Shodan SSL Cipher Checker</h2>
      <input
        type="text"
        className="mt-2 p-2 bg-gray-700 border border-gray-600 rounded"
        value={host}
        onChange={(e) => setHost(e.target.value)}
        placeholder="Enter domain (e.g., youtube.com)"
      />
      <button
        onClick={fetchSSLInfo}
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Scanning..." : "Check SSL Ciphers"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {ciphers.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-semibold">SSL Ciphers Found:</h3>
          <ul className="mt-2 list-disc list-inside">
            {ciphers.map((cipher, index) => (
              <li key={index}>{cipher}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShodanSSLChecker;