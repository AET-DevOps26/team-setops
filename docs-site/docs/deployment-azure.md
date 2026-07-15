---
sidebar_position: 11
---

# Azure Deployment (Terraform + Ansible)

In addition to the Rancher Kubernetes cluster, the application is also deployable to **Microsoft Azure** using **Terraform** (Infrastructure as Code) and **Ansible** (Configuration Management). This provides a second, independent deployment environment.

## How It Works

1. **Terraform** (`infra/terraform/`) provisions the Azure infrastructure:
   - A Resource Group, Virtual Network, Subnet, and Public IP in the `polandcentral` region.
   - A Network Security Group allowing SSH (port 22), HTTP (port 80), and HTTPS (port 443).
   - An Ubuntu 24.04 LTS Virtual Machine (`Standard_DS2_v3`).
   - After provisioning, Terraform automatically generates the Ansible inventory file with the VM's public IP.

2. **Ansible** (`infra/ansible/`) configures the VM:
   - Installs Docker and Docker Compose from official repositories.
   - Copies the production `docker-compose.prod.yml` and Nginx configuration to the VM.
   - Starts the full application stack using the pre-built GHCR Docker images.

3. **GitHub Actions** (`deploy-azure.yml`) orchestrates this end-to-end on every push to `main`.

## Prerequisites (Additional GitHub Repository Secrets)

The Azure deployment pipeline requires the following **additional** secrets:

| Secret                | Description                                     |
| :--------------------- | :------------------------------------------------ |
| `ARM_CLIENT_ID`       | Azure Service Principal `appId`                 |
| `ARM_CLIENT_SECRET`   | Azure Service Principal `password`              |
| `ARM_SUBSCRIPTION_ID` | Azure Subscription ID                           |
| `ARM_TENANT_ID`       | Azure Active Directory `tenant` ID              |
| `SSH_PRIVATE_KEY`     | Private SSH key for Ansible to access the VM    |
| `SSH_PUBLIC_KEY`      | Public SSH key injected into the VM at creation |

To create the Service Principal, run locally:

```bash
az ad sp create-for-rbac --name "github-actions-team-setops" --role contributor --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>
```

:::caution[Least privilege]

This grants Contributor on the **entire subscription**, not just the deployment resource group, because `infra/terraform/main.tf` creates the resource group itself (`resource "azurerm_resource_group"`, not a `data` reference) — a resource-group-scoped Service Principal can't create the resource group it doesn't have access to yet. To scope this down: pre-create the resource group once (`az group create --name team-setops-rg --location <region>`), scope the Service Principal to that resource group's ID instead of the subscription, and change `main.tf` to reference the resource group via a `data "azurerm_resource_group"` block rather than managing it.

:::

## Manual Deployment

To deploy to Azure manually from your local machine (requires Azure CLI and Ansible):

```bash
# 1. Provision the VM
cd infra/terraform
terraform init
terraform apply -auto-approve

# 2. Configure and deploy the application
cd ../ansible
ansible-playbook playbook.yml
```

## Accessing the Application on Azure

Once deployed, the application is accessible via a fully qualified domain name (FQDN). You can find the exact URL from the Terraform output:

```bash
cd infra/terraform
terraform output vm_fqdn
```

Then open `http://<vm_fqdn>` in your browser. (The raw IP is also available via `terraform output vm_public_ip`.)
