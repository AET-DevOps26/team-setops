variable "location" {
  type        = string
  description = "The Azure region to deploy to."
  default     = "polandcentral"
}

variable "resource_group_name" {
  type        = string
  description = "The name of the resource group."
  default     = "team-setops-rg"
}

variable "vm_name" {
  type        = string
  description = "The name of the virtual machine."
  default     = "team-setops-vm"
}

variable "vm_size" {
  type        = string
  description = "The size of the virtual machine. Using Standard_DS2_v3."
  default     = "Standard_DS2_v3"
}

variable "admin_username" {
  type        = string
  description = "Admin username for the VM."
  default     = "azureuser"
}

variable "dns_label" {
  type        = string
  description = "DNS label for the public IP. Must be unique within the Azure region."
  default     = "team-setops-devpulse"
}

variable "ssh_public_key" {
  type        = string
  description = "The SSH public key to access the VM. Must be provided or read from file."
  # Default reads from a standard location, but usually provided via tfvars
  default     = "~/.ssh/id_rsa.pub"
}
