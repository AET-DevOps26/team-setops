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
  description = "The size of the virtual machine. Using B2s for cost efficiency (student account)."
  default     = "Standard_B2s"
}

variable "admin_username" {
  type        = string
  description = "Admin username for the VM."
  default     = "azureuser"
}

variable "ssh_public_key" {
  type        = string
  description = "The SSH public key to access the VM. Must be provided or read from file."
  # Default reads from a standard location, but usually provided via tfvars
  default     = "~/.ssh/id_rsa.pub"
}
