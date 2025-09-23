from zeroconf import Zeroconf, ServiceInfo, NonUniqueNameException
import socket
import atexit
from utils import get_private_ip

def register_mdns_service(service_name: str, service_type: str, port: int, hostname: str = "mydevice.local."):
    """
    Registers a service with mDNS, ensuring proper cleanup if the service already exists.
    
    Args:
        service_name (str): The name of the service to register.
        service_type (str): The type of service to register (e.g., "_http._tcp.local.").
        port (int): The port on which the service is running.
        hostname (str, optional): The hostname for the mDNS service. Defaults to "mydevice.local.".
    
    Returns:
        Zeroconf: The Zeroconf instance for managing the service.
        ServiceInfo: The mDNS service information.
    """

    # Get the local IP address of the device
    ip = get_private_ip()
    ip_bytes = socket.inet_aton(ip)

    # Create mDNS service info
    info = ServiceInfo(
        type_=service_type,
        name=service_name,
        port=port,
        addresses=[ip_bytes],
        properties={},
        server=hostname,
    )

    # Initialize Zeroconf and register the service
    zeroconf = Zeroconf()

    try:
        zeroconf.register_service(info)
        print(f"[mDNS] Registered: {service_name} at {hostname} ({ip}:{port})")

    except NonUniqueNameException:
        # mDNS already registered, re-registering due to config changes
        print(f"[mDNS] Service name conflict: {service_name} already exists!")

        zeroconf.unregister_service(info)
        zeroconf.register_service(info)

    # Cleanup function to unregister and close Zeroconf
    def cleanup():
        print(f"\n[mDNS] Shutting down responder for {service_name}...")
        zeroconf.unregister_service(info)
        zeroconf.close()

    # Register the cleanup function to be called on program exit
    atexit.register(cleanup)

    return zeroconf, info

if __name__ == "__main__":
    # Register mDNS service
    zeroconf_instance, service_info = register_mdns_service(
        service_name="My Python Web Server._http._tcp.local.",
        service_type="_http._tcp.local.",
        port=8000
    )

    import time
    time.sleep(1000)

"""
    some times mDNS service got stuck after registration and cannot re register, if have to manually remove

    check mDNS registration
    > avahi-browse -a
    find the process of service registrar
    > ps aux | grep avahi
    kill the process
    > sudo kill <PID>

"""