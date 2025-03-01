from sslyze import ServerNetworkLocation, Scanner, ServerScanRequest, CipherSuiteAcceptedByServer
from sslyze.plugins.scan_commands import ScanCommand

server_location = ServerNetworkLocation(hostname="www.youtube.com", port=443)
server_scan_request = ServerScanRequest(
    server_location,
    scan_commands={
        ScanCommand.SSL_1_0_CIPHER_SUITES,
        ScanCommand.SSL_2_0_CIPHER_SUITES,
        ScanCommand.SSL_3_0_CIPHER_SUITES,
        ScanCommand.TLS_1_0_CIPHER_SUITES,
        ScanCommand.TLS_1_1_CIPHER_SUITES,
        ScanCommand.TLS_1_2_CIPHER_SUITES,
        ScanCommand.TLS_1_3_CIPHER_SUITES
    }
)
scanner = Scanner()

# Queue the scan request.
scanner.queue_scans([server_scan_request])
results = list(scanner.get_results())  # Convert generator to list

# Iterate through the results.
for result in results:
    scan_obj = result.scan_result
    # Loop through the requested scan commands.
    for scan_command in server_scan_request.scan_commands:
        # Convert the enum name to lowercase attribute name.
        attr_name = scan_command.name.lower()  # e.g. "TLS_1_2_CIPHER_SUITES" -> "tls_1_2_cipher_suites"
        command_attempt = getattr(scan_obj, attr_name, None)
        if command_attempt:
            # Check that the attempt is completed and has a result.
            if command_attempt.status.name == "COMPLETED" and command_attempt.result:
                accepted = command_attempt.result.accepted_cipher_suites
                if accepted:
                    print(f"Accepted TLS/SSL Cipher Suites for {command_attempt.result.tls_version_used}:")
                    for suite_info in accepted:
                        print(suite_info.cipher_suite.name)
                else:
                    print(f"No accepted cipher suites returned for {attr_name}.")
            else:
                print(f"Scan not completed for {attr_name} (status: {command_attempt.status}).")
        else:
            print(f"No scan attempt found for {attr_name}.")