# lansonai.com 技术介绍 / Technical Introduction

## 中文版 / Chinese Version

### 概述
lansonai.com 是一个基于人工智能的代码生成和执行平台，提供类似于 Anthropic Claude Artifacts 的开源实现。该平台允许用户通过自然语言与 AI 交互，生成和运行各种类型的代码。

### 核心技术栈

#### 前端框架
- **Next.js 14.2.4** - React 框架，支持服务端渲染和静态站点生成
- **React 18** - 用户界面构建库
- **TypeScript** - 类型安全的 JavaScript 超集
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Radix UI** - 无样式、可访问的 UI 组件库

#### AI 集成
- **Anthropic Claude Sonnet 3.5** - 主要的 AI 模型，用于代码生成
- **Vercel AI SDK** - 工具调用和流式响应处理
- **多模型支持**：
  - Anthropic Claude (@ai-sdk/anthropic)
  - Google AI (@ai-sdk/google)
  - Mistral AI (@ai-sdk/mistral)
  - OpenAI (@ai-sdk/openai)
  - Ollama (本地模型支持)

#### 代码执行环境
- **E2B Code Interpreter SDK** - 安全的云端代码执行沙箱
- **E2B Core SDK** - 提供隔离的执行环境
- **支持的运行时**：
  - Python (Jupyter Notebook)
  - Next.js 应用
  - Streamlit 应用
  - JavaScript/TypeScript (计划中)
  - R 语言 (计划中)

#### 开发工具
- **Turbopack** - 快速的开发构建工具
- **ESLint** - 代码质量检查
- **Prism.js** - 代码语法高亮

#### 其他关键库
- **Supabase** - 后端服务和身份验证
- **Xterm.js** - 终端模拟器，用于交互式命令行界面
- **Vercel Analytics** - 分析和性能监控

### 主要特性

1. **AI 驱动的代码生成**
   - 通过自然语言描述生成代码
   - 支持多种编程语言和框架
   - 实时代码生成和修改

2. **安全的代码执行**
   - 使用 E2B 沙箱隔离执行环境
   - 支持动态安装依赖库
   - 可以运行 shell 命令

3. **多种应用类型支持**
   - Jupyter Notebook（Python）
   - Next.js 应用
   - Streamlit 应用
   - 更多类型正在开发中

4. **交互式界面**
   - 实时终端输出
   - 代码编辑器
   - 可视化结果展示

### 架构设计

```
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│  (React + TypeScript + Tailwind)        │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│      Vercel AI SDK                      │
│  (Tool Calling & Streaming)             │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴───────┐
        ↓               ↓
┌──────────────┐  ┌─────────────────┐
│   AI Models  │  │  E2B Sandboxes  │
│   (Claude,   │  │  (Code Runner)  │
│    GPT, etc) │  │                 │
└──────────────┘  └─────────────────┘
```

### 安全性
- **沙箱隔离**：所有 AI 生成的代码在 E2B 云沙箱中运行
- **权限控制**：通过 Supabase 实现用户认证和授权
- **环境隔离**：每个执行环境相互独立

### 部署和运行

#### 环境要求
- Node.js 18+
- npm 或 yarn

#### 环境变量配置
```
E2B_API_KEY=your-e2b-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

#### 开发模式
```bash
npm install
npm run dev
```

#### 生产构建
```bash
npm run build
npm start
```

### 开源协议
该项目采用 Apache License 2.0 开源协议。

---

## English Version

### Overview
lansonai.com is an AI-powered code generation and execution platform, providing an open-source implementation similar to Anthropic's Claude Artifacts. The platform allows users to interact with AI through natural language to generate and run various types of code.

### Core Technology Stack

#### Frontend Framework
- **Next.js 14.2.4** - React framework with server-side rendering and static site generation
- **React 18** - User interface building library
- **TypeScript** - Type-safe superset of JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI component library

#### AI Integration
- **Anthropic Claude Sonnet 3.5** - Primary AI model for code generation
- **Vercel AI SDK** - Tool calling and streaming response handling
- **Multi-model Support**:
  - Anthropic Claude (@ai-sdk/anthropic)
  - Google AI (@ai-sdk/google)
  - Mistral AI (@ai-sdk/mistral)
  - OpenAI (@ai-sdk/openai)
  - Ollama (local model support)

#### Code Execution Environment
- **E2B Code Interpreter SDK** - Secure cloud-based code execution sandbox
- **E2B Core SDK** - Provides isolated execution environments
- **Supported Runtimes**:
  - Python (Jupyter Notebook)
  - Next.js applications
  - Streamlit applications
  - JavaScript/TypeScript (planned)
  - R language (planned)

#### Development Tools
- **Turbopack** - Fast development build tool
- **ESLint** - Code quality checking
- **Prism.js** - Code syntax highlighting

#### Other Key Libraries
- **Supabase** - Backend services and authentication
- **Xterm.js** - Terminal emulator for interactive command-line interface
- **Vercel Analytics** - Analytics and performance monitoring

### Key Features

1. **AI-Driven Code Generation**
   - Generate code from natural language descriptions
   - Support for multiple programming languages and frameworks
   - Real-time code generation and modification

2. **Secure Code Execution**
   - Uses E2B sandbox for isolated execution environments
   - Supports dynamic dependency installation
   - Can run shell commands

3. **Multiple Application Type Support**
   - Jupyter Notebook (Python)
   - Next.js applications
   - Streamlit applications
   - More types under development

4. **Interactive Interface**
   - Real-time terminal output
   - Code editor
   - Visual result display

### Architecture Design

```
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│  (React + TypeScript + Tailwind)        │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│      Vercel AI SDK                      │
│  (Tool Calling & Streaming)             │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴───────┐
        ↓               ↓
┌──────────────┐  ┌─────────────────┐
│   AI Models  │  │  E2B Sandboxes  │
│   (Claude,   │  │  (Code Runner)  │
│    GPT, etc) │  │                 │
└──────────────┘  └─────────────────┘
```

### Security
- **Sandbox Isolation**: All AI-generated code runs in E2B cloud sandboxes
- **Access Control**: User authentication and authorization via Supabase
- **Environment Isolation**: Each execution environment is independent

### Deployment and Running

#### Requirements
- Node.js 18+
- npm or yarn

#### Environment Variables
```
E2B_API_KEY=your-e2b-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

#### Development Mode
```bash
npm install
npm run dev
```

#### Production Build
```bash
npm run build
npm start
```

### Open Source License
This project is licensed under Apache License 2.0.

---

## Related Repositories
- **profile**: Main application repository (Next.js + TypeScript)
- **.github**: Organization-wide GitHub configurations and documentation

## Links
- GitHub Organization: https://github.com/lansonai
- Main Repository: https://github.com/lansonai/profile
