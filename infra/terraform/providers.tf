terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "team-setops-tfstate-rg"
    storage_account_name = "teamsetopstfstate"
    container_name       = "tfstate"
    key                  = "team-setops.tfstate"
    use_azuread_auth      = true
  }
}

provider "azurerm" {
  features {}
}
