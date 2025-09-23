import socket

def get_private_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)

    while True:
        try:
            # This connects to an external address (doesn't actually send data)
            s.connect(('255.255.255', 1))
            ip_address = s.getsockname()[0]
        except Exception:
            print(f"No ip address found")
        finally:
            s.close()
            break

    return ip_address

if __name__ == "__main__":
    print(get_private_ip())
