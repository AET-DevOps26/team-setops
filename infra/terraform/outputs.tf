output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "vm_public_ip" {
  value       = azurerm_public_ip.public_ip.ip_address
  description = "The public IP address of the deployed VM"
}

output "vm_fqdn" {
  value       = azurerm_public_ip.public_ip.fqdn
  description = "The fully qualified domain name of the deployed VM"
}
