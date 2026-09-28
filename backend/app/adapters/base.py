from abc import ABC, abstractmethod
from typing import Any, Dict

class ERPAdapter(ABC):
    """
    Abstract Base Class for ERP System Integrations.
    Ensures that any external ERP (SAP, Oracle, etc.) implements the required
    interface for material data synchronization.
    """

    @abstractmethod
    def connect(self) -> bool:
        """Establish a connection to the ERP system."""
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        """Close the connection to the ERP system."""
        pass

    @abstractmethod
    def push_material(self, material_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Push a new or updated material record to the ERP system.
        Must return a status dict, typically containing the ERP's internal ID.
        """
        pass

    @abstractmethod
    def get_material(self, material_id: str) -> Dict[str, Any]:
        """
        Fetch material details from the ERP system using the material's ID.
        """
        pass
