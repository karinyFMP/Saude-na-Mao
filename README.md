# Saúde na Mão

<p align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React">
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJS">
  <img src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express.js">
  <img src="https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
</p>

<p align="center">
  <strong>Uma solução digital para conectar cidadãos a serviços de saúde essenciais de forma rápida, intuitiva e acessível.</strong>
</p>

---

## Sobre o Projeto

O **Saúde na Mão** é um aplicativo/plataforma desenvolvido com o objetivo de centralizar e facilitar o acesso a informações e serviços de saúde pública ou privada. Através dele, os usuários conseguem gerenciar consultas, acompanhar históricos médicos ou localizar postos de atendimento de maneira prática.

> *Nota: Nossa aplicação foi pensada para pessoas que não tem condições de se locomover para outra cidade toda vez que precisa marcar algum exame ou verificar o andamento de um já existente.*

---

## Funcionalidades Principais

- 🧑‍🦱 **Portal do Paciente:** Acompanhamento de protocolos, histórico médico e visualização de pareceres e anexos.
- 🩺 **Painel do Médico:** Criação de novos protocolos, envio de anexos (PDFs de exames) e encaminhamento de pacientes.
- 🛡️ **Painel do Auditor:** Avaliação de protocolos médicos (Aprovação/Negação), análise de justificativas e arquivos em anexo.

---

## Tecnologias Utilizadas

O projeto foi construído utilizando as seguintes tecnologias e ferramentas:

### **Front-end**
- ![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat-square&logo=react&logoColor=%2361DAFB)
- ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat-square&logo=vite&logoColor=white)
- ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=flat-square&logo=css3&logoColor=white)
- ![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=flat-square&logo=javascript&logoColor=black)

### **Back-end / Banco de Dados**
- ![NodeJS](https://img.shields.io/badge/node.js-%2343853D.svg?style=flat-square&logo=node.js&logoColor=white)
- ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat-square&logo=express&logoColor=%2361DAFB)
- ![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=flat-square&logo=sqlite&logoColor=white)

---

## Estrutura do Projeto

A arquitetura do projeto separa claramente os conceitos entre cliente (React) e servidor (Node).

```plaintext
/
├── backend/
│   ├── database.js                    → Instância, tabelas e dados iniciais (seed) do SQLite
│   ├── server.js                      → Ponto de entrada do Express (APIs e rotas)
│   ├── middlewares/                   → Middlewares de validação e autenticação do auditor
│   ├── schemas/                       → Validações de payload da API
│   ├── uploads/                       → Diretório de salvamento físico de PDFs anexos
│   ├── saude_na_mao_v2.db             → Arquivo físico do banco de dados local
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/                → Componentes UI, Telas de detalhes e anexador de PDF
    │   ├── contexts/                  → Contextos de autenticação (Paciente, Médico, Auditor)
    │   ├── schemas/                   → Validações de formulários com Zod (ex: Novo Protocolo)
    │   ├── services/                  → Serviços de comunicação Axios (api, medicoApi, auditorApi)
    │   ├── App.jsx & main.jsx         → Ponto de entrada do React, rotas e Toastify
    │   └── index.css                  → Design system e estilização global
    └── package.json
```

---

## Deploy

A aplicação está hospedada e pode ser acessada em tempo real:

* **Frontend (Vercel):** [https://desenvolvimento-de-formularios-de-c.vercel.app](https://desenvolvimento-de-formularios-de-c.vercel.app)
* **Backend & API (Render):** [https://saude-na-mao-qt2w.onrender.com](https://saude-na-mao-qt2w.onrender.com)

> **⚠️ AVISO IMPORTANTE:** O serviço gratuito do Render utiliza Discos Efêmeros. Isto significa que a qualquer momento que a máquina for reiniciada (por inatividade ou atualização no provedor), o ficheiro `saude_na_mao_v2.db` será apagado e regressará ao seu estado inicial. Contas e protocolos adicionados na nuvem podem sumir periodicamente.

---

## Como Executar o Projeto

### **Pré-requisitos**
Antes de começar, você vai precisar ter instalado em sua máquina:
- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org/en/)

### **Passo a Passo**

```bash
# 1. Clone este repositório
$ git clone https://github.com/karinyFMP/Saude-na-Mao.git

# 2. Acesse a pasta do projeto
$ cd Saude-na-Mao

# 3. Instale as dependências de ambos os projetos (Frontend e Backend)
$ npm run install-all 

# 4. Inicie a aplicação de forma concorrente (Frontend + Backend)
$ npm start 
```

---

## 🌐 URLs de Acesso Local

- **Front-end (Painel Web):**
  - **Paciente:** [http://localhost:5173/login](http://localhost:5173/login)
  - **Médico:** [http://localhost:5173/medico/login](http://localhost:5173/medico/login)
  - **Auditor:** [http://localhost:5173/auditor/login](http://localhost:5173/auditor/login)
- **Back-end (API Rest):** [http://localhost:3001/api](http://localhost:3001/api)

---

## 🔑 Contas e Credenciais de Teste

A aplicação é dividida em três fluxos principais baseados no tipo de usuário. Seguem as credenciais pré-configuradas no banco de dados (`seedDatabase`):

### 1. 🧑‍🦱 Paciente
*Acesso padrão na tela inicial.*
- **CPF:** `123.456.789-00` | **Senha:** `123456` *(Maria Silva)*
- **CPF:** `987.654.321-00` | **Senha:** `654321` *(João Santos)*

### 2. 🩺 Médico (Clínico Geral & Especialista)
*Acessível na tela de login médico dedicada (/medico).*
- **Clínico Geral:**
  - **CRM:** `CRM/SP 123456` | **Senha:** `medico123` *(Dr. Carlos Mendes)*
  - **CRM:** `CRM/SP 111111` | **Senha:** `medico123` *(Dra. Mariana Rocha)*
- **Especialista:**
  - **CRM:** `CRM/SP 234567` | **Senha:** `medico123` *(Dra. Ana Oliveira - Cardiologia)*
  - **CRM:** `CRM/SP 345678` | **Senha:** `medico123` *(Dr. Pedro Lima - Ortopedia)*
  - **CRM:** `CRM/SP 789012` | **Senha:** `medico123` *(Dr. Marcos Pereira - Neurologia)*

### 3. 🛡️ Auditor (Servidor Administrativo)
*Acessível na tela de login de servidores/auditoria.*
- **CPF:** `000.000.000-00` | **Senha:** `admin123` *(auditor)*
